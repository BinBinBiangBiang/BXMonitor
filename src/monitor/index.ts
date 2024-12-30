import { MonitorConfig, PerformanceMetrics, RouteChangeMetrics } from "./types";
import { MonitorType } from "./enum";

export default class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private config!: MonitorConfig;

  constructor(config: MonitorConfig) {
    // 检查必要的配置
    if (!config.reportUrl) {
      throw new Error('reportUrl is required');
    }

    // 单例
    if (PerformanceMonitor.instance) {
      return PerformanceMonitor.instance;
    }

    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };

    this.init();
    PerformanceMonitor.instance = this;
  }

  private getDefaultConfig(): Partial<MonitorConfig> {
    return {
      enablePerformance: true,  // 是否开启性能监控
      enableError: true,  // 是否开启错误监控
      maxCache: 50, // 最大缓存数
      reportTimeout: 5000, // 上报超时时间
      sampling: 1, // 采样率 1表示100%
    };
  }

  private init() {
    this.collectPerformanceMetrics();
    this.setupErrorListener();
    console.log('PerformanceMonitor initialized');
  }

  // 收集性能指标
  private collectPerformanceMetrics() {
    if (typeof window !== 'undefined' && window.performance) {
      // 通用的性能指标收集函数
      const collectMetricsData = () => {
        const paintEntries = performance.getEntriesByType('paint');
        const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');

        const navigationEntries = performance.getEntriesByType('navigation');
        const navigationEntry = navigationEntries[navigationEntries.length - 1] as PerformanceNavigationTiming;

        if (navigationEntry) {
          const { domainLookupEnd, domainLookupStart, connectEnd, connectStart, domComplete, loadEventEnd } = navigationEntry;
          
          return {
            dnsFindTime: Math.round(domainLookupEnd - domainLookupStart),
            tcpConnectTime: Math.round(connectEnd - connectStart),
            whiteScreenTime: Math.round(fpEntry?.startTime ?? -1),
            domCompletionTime: Math.round(domComplete),
            pageLoadTime: Math.round(loadEventEnd)
          };
        }
        return null;
      };

      // 首次加载的性能指标收集
      const collectInitialMetrics = (retryCount = 0, maxRetries = 20) => {
        setTimeout(() => {
          const metrics = collectMetricsData();
          
          if (!metrics && retryCount < maxRetries) {
            setTimeout(() => collectInitialMetrics(retryCount + 1, maxRetries), 100);
            return;
          }

          if (metrics) {
            console.log('Initial metrics====== ', metrics);
            this.report(MonitorType.performance, metrics);
            performance.clearResourceTimings();
          }
        }, 0);
      };

      // SPA路由变化的性能指标收集
      const collectRouteChangeMetrics = () => {
        const startTime = performance.now();
        
        const checkComplete = (retryCount = 0, maxRetries = 20) => {
          setTimeout(() => {
            const loadTime = performance.now() - startTime;
            
            if (document.readyState !== 'complete' && retryCount < maxRetries) {
              setTimeout(() => checkComplete(retryCount + 1, maxRetries), 100);
              return;
            }

            const baseMetrics = collectMetricsData();
            const routeMetrics = {
              routeChangeTime: Math.round(loadTime),
              domCompletionTime: Math.round(performance.now() - startTime),
              pageLoadTime: Math.round(loadTime)
            };

            const metrics = {
              ...baseMetrics,
              ...routeMetrics
            };

            console.log('Route change metrics====== ', metrics);
            this.report(MonitorType.performance, metrics);
            performance.clearResourceTimings();
          }, 0);
        };

        checkComplete();
      };

      // 监听首次加载
      if (document.readyState === 'complete') {
        collectInitialMetrics();
      } else {
        window.addEventListener('load', () => collectInitialMetrics());
      }

      // 监听SPA路由变化
      let lastHref = location.href;
      const observer = new MutationObserver(() => {
        const currentHref = location.href;
        if (currentHref !== lastHref) {
          lastHref = currentHref;
          collectRouteChangeMetrics();
        }
      });

      observer.observe(document, {
        subtree: true,
        childList: true,
      });
    }
  }

  // 错误监控
  private setupErrorListener() {
    window.addEventListener('error', (event) => {
      this.report(MonitorType.error, {
        ...this.config,
        message: event.message,
        fileName: event.filename,
        lineNo: event.lineno,
        colNo: event.colno,
        error: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.report(MonitorType.promiseError, {
        ...this.config,
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack
      });
    });
  }

  // 数据上报
  private async report(type: MonitorType, data: MonitorConfig | PerformanceMetrics | RouteChangeMetrics) {
    // 上报类型不存在
    if (!Object.values(MonitorType).includes(type)) {
      console.error('上报类型不存在');
      return;
    }

    const reportData = {
      type,
      data,
      currentTime: new Date().getTime()
    };

    // 应用采样率
    if (Math.random() > (this.config.sampling || 1)) {
      return;
    }

    // 应用上报前的钩子函数
    if (this.config.beforeReport) {
      reportData.data = this.config.beforeReport(reportData.data);
    }

    console.log('reportData====== ', reportData);

    const retryCount = 3;
    const retryDelay = 1000;

    const sendData = async (attempt = 0): Promise<boolean> => {
      try {
        if (navigator.sendBeacon) {
          const success = navigator.sendBeacon(this.config.reportUrl, JSON.stringify(reportData));
          if (!success) throw new Error('Beacon failed');
          return true;
        } else {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', this.config.reportUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(true);
              } else {
                reject(new Error(`HTTP Error: ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => reject(new Error('Network Error'));
            xhr.timeout = this.config.reportTimeout || 5000;
            xhr.ontimeout = () => reject(new Error('Timeout'));
            
            xhr.send(JSON.stringify(reportData));
          });
        }
      } catch (error) {
        if (attempt < retryCount) {
          console.warn(`Report attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return sendData(attempt + 1);
        }
        this.config.onError?.(error);
        throw error;
      }
    };

    try {
      await sendData();
    } catch (error) {
      console.error('Failed to report after retries:', error);
    }
  }
} 