import BXMonitor from './monitor/index';
export { BXMonitor };
export type { MonitorConfig } from './monitor/types';
// Just assign the imported BXMonitor to window
(window as any).BXMonitor = BXMonitor;
