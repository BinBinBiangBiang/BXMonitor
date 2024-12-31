# BXMonitor Plugin

一个轻量级的前端性能监控插件，支持 SPA 应用。

## 特性
- 自动收集页面性能指标
- 支持 SPA 路由变化监控
- 支持错误监控
- 支持自定义埋点
- 支持采样率配置

## 安装 
```bash
npm install bx-monitor
# or
yarn add bx-monitor
```

## 使用

```javascript
import { BXMonitor } from 'performance-monitor';

// 初始化监控
const monitor = new BXMonitor({
  reportUrl: 'your-api-endpoint',  // 数据上报地址（必填）
  appId: 'your-app-id',           // 应用标识
  enablePerformance: true,        // 是否启用性能监控
  enableError: true,              // 是否启用错误监控
  sampling: 1,                    // 采样率 0-1
});
```

## 配置项

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| reportUrl | string | 是 | - | 数据上报地址 |
| appId | string | 否 | - | 应用标识 |
| userId | string | 否 | - | 用户标识 |
| enablePerformance | boolean | 否 | true | 是否启用性能监控 |
| enableError | boolean | 否 | true | 是否启用错误监控 |
| maxCache | number | 否 | 50 | 最大缓存数量 |
| reportTimeout | number | 否 | 5000 | 上报超时时间(ms) |
| sampling | number | 否 | 1 | 采样率 0-1 |

## 性能指标

| 指标 | 说明 |
| --- | --- |
| dnsFindTime | DNS查询时间 |
| tcpConnectTime | TCP连接时间 |
| whiteScreenTime | 白屏时间 |
| domCompletionTime | DOM完成时间 |
| pageLoadTime | 页面加载时间 |
| routeChangeTime | 路由切换耗时(仅SPA) |

## 错误监控

自动捕获以下类型的错误：
- JavaScript运行时错误
- Promise未处理的rejection
- 资源加载错误

## License

MIT 