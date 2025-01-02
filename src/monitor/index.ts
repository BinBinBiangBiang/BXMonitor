import { IMonitorConfig, PerformanceMetrics, RouteChangeMetrics, IClickConfig, IErrorConfig, IPromiseErrorConfig, ICommonConfig, IModuleExposeConfig } from "./types";
import { MonitorType } from "./enum";

export default class BXMonitor {
  private static instance: BXMonitor;
  private config!: IMonitorConfig;

  constructor(config: IMonitorConfig) {
    // 检查必要的配置
    if (!config.reportUrl) {
      throw new Error('reportUrl is required');
    }

    // 单例
    if (BXMonitor.instance) {
      return BXMonitor.instance;
    }

    this.config = {
      ...this.getDefaultConfig(),
      ...config
    };

    this.init();
    BXMonitor.instance = this;
  }

  private getDefaultConfig(): Partial<IMonitorConfig> {
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
            this.report(MonitorType.PERFORMANCE, metrics);
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
            this.report(MonitorType.PERFORMANCE, metrics);
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
    // 普通错误监控
    window.addEventListener('error', (event) => {
      this.report(MonitorType.ERROR, {
        ...this.config,
        message: event.message,
        fileName: event.filename,
        lineNo: event.lineno,
        colNo: event.colno,
        error: event.error?.stack
      });
    });

    // Promise错误监控
    window.addEventListener('unhandledrejection', (event) => {
      this.report(MonitorType.PROMISE_ERROR, {
        ...this.config,
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack
      });
    });

    // 资源加载错误监控
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as HTMLElement).tagName) {
        this.report(MonitorType.RESOURCE_ERROR, {
          ...this.config,
          tagName: (event.target as HTMLElement).tagName,
          src: (event.target as HTMLImageElement).src || (event.target as HTMLLinkElement).href,
        });
      }
    }, true);
  }

  // 数据上报
  private async report(type: MonitorType, data: IMonitorConfig | PerformanceMetrics | RouteChangeMetrics) {
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

  // 埋点点击上报
  public clickReport(data: IClickConfig, beforeReport?: (data: any) => any) {
    this.report(MonitorType.CLICK, this.config.beforeReport ? this.config.beforeReport(data) : data);
  }

  // 埋点错误上报
  public errorReport(data: IErrorConfig, beforeReport?: (data: any) => any) {
    this.report(MonitorType.ERROR, this.config.beforeReport ? this.config.beforeReport(data) : data);
  }

  // 页面埋点曝光上报
  public pageView(data: ICommonConfig, beforeReport?: (data: any) => any) {
    this.report(MonitorType.PAGE_VIEW, this.config.beforeReport ? this.config.beforeReport(data) : data);
  }

  // 页面埋点离开上报
  public pageViewOut(data: ICommonConfig, beforeReport?: (data: any) => any) {
    this.report(MonitorType.PAGE_VIEW_OUT, this.config.beforeReport ? this.config.beforeReport(data) : data);
  }

  // 模块埋点曝光上报
  public moduleExpose(data: IModuleExposeConfig, beforeReport?: (data: any) => any) {
    this.report(MonitorType.MODULE_EXPOSE, this.config.beforeReport ? this.config.beforeReport(data) : data);
  }
} 
