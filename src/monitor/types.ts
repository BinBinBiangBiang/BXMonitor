export interface IMonitorConfig {
  reportUrl: string;           // 数据上报地址（必填）
  appId: string;              // 应用标识，如：'hello-bike'
  pageId?: string;            // 页面标识，如：'home'、'detail'
  bizType?: string;           // 业务类型，如：'order'、'user'
  env?: 'dev' | 'test' | 'prod';  // 环境标识
  version?: string;           // 应用版本号
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

// 通用配置
export interface ICommonConfig {
  pageId: string;            // 页面标识
  categoryId?: string; // 业务标识
  elementId?: string;        // 元素标识
  extra?: Record<string, any>; // 额外信息
}

export interface IPromiseErrorConfig extends ICommonConfig {
  promiseName?: string; // 异步函数名称
}

export interface IErrorConfig extends ICommonConfig {
  message?: string;          // 错误信息
  stack?: string;           // 错误堆栈
  fileName?: string;        // 文件名
  lineNo?: number;         // 行号
  colNo?: number;          // 列号
}

export interface IClickConfig extends ICommonConfig {
  buttonName: string; // 按钮名称
}

export interface IModuleExposeConfig extends ICommonConfig {
  moduleId: string; // 对应曝光的页面区块标识
  contentId: string; // 对应页面区块的内容标识
  exposeTimes: number; // 内容曝光次数
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
