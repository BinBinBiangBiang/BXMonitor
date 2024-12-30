import PerformanceMonitor from './monitor/index';
export { PerformanceMonitor };
export type { MonitorConfig } from './monitor/types';
// Just assign the imported PerformanceMonitor to window
(window as any).PerformanceMonitor = PerformanceMonitor;
