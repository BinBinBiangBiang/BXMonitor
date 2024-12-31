export enum MonitorType {
  PERFORMANCE = 'performance', // 性能监控
  CLICK = 'click', // 点击埋点
  ERROR = 'error', // 错误监控
  PAGE_VIEW = 'pageView', // 页面曝光埋点
  PAGE_VIEW_OUT = 'pageViewOut', // 页面离开埋点
  MODULE_EXPOSE = 'moduleExpose', // 模块曝光埋点
  PROMISE_ERROR = 'promise_error' // promise 错误监控
}
