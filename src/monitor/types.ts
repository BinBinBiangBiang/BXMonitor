export interface MonitorConfig {
  reportUrl: string;           // 数据上报地址（必填）
  appId?: string;             // 应用标识
  userId?: string;            // 用户标识
  enablePerformance?: boolean; // 是否启用性能监控
  enableError?: boolean;       // 是否启用错误监控
  maxCache?: number;          // 最大缓存数量
  reportTimeout?: number;     // 上报超时时间
  sampling?: number;          // 采样率 0-1
  beforeReport?: (data: any) => any; // 上报前的数据处理钩子
  onError?: (error: any) => void;    // 上报失败的回调
  // 错误监控
  message?: string;           // 自定义消息
  fileName?: string;          // 文件名
  lineNo?: number;        // 行号
  colNo?: number;          // 列号
  error?: string;          // 错误信息
  stack?: string;          // 错误堆栈
}

export interface PerformanceMetrics {
  dnsFindTime: number; // DNS查询时间
  tcpConnectTime: number; // TCP连接时间
  whiteScreenTime: number; // 白屏时间
  domCompletionTime: number; // DOM完成时间
  pageLoadTime: number; // 页面加载时间
}

export interface RouteChangeMetrics extends Partial<PerformanceMetrics> {
  routeChangeTime: number; // 路由切换耗时
}
