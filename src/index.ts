import BXMonitor from './monitor/index';
export { BXMonitor };
export type { IMonitorConfig } from './monitor/types';
// Just assign the imported BXMonitor to window
(window as any).BXMonitor = BXMonitor;
