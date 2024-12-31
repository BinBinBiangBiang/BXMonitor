# BXMonitor

一个轻量级的前端监控 SDK，支持性能监控、错误监控和自定义埋点。

## 特性
- 🚀 自动收集页面性能指标
- 🔄 支持 SPA 路由变化监控
- ⚠️ 自动捕获 JS 错误和 Promise 异常
- 📊 支持点击、曝光等埋点统计
- ⚡ 支持性能采样和错误采样
- 🔌 提供灵活的扩展和钩子机制

## 安装 
```bash
npm install bx-monitor
# or
yarn add bx-monitor
```

## 快速开始

```javascript
import { BXMonitor } from 'bx-monitor';

// 初始化监控
const monitor = new BXMonitor({
  reportUrl: 'your-api-endpoint',  // 数据上报地址（必填）
  appId: 'hello-bike',            // 应用标识（必填）
  bizType: 'order',              // 业务类型
  env: 'prod',                   // 环境标识
  version: '1.0.0',              // 应用版本号
  pageId: 'home'                 // 页面标识
});
```

## 埋点使用

### 点击埋点
```javascript
monitor.clickReport({
  pageId: 'home',
  buttonName: 'submit',          // 按钮名称
  elementId: 'submit_btn',       // 元素标识
  categoryId: 'order',           // 业务标识
  extra: { orderId: '123' }      // 额外信息
});
```

### 页面曝光
```javascript
monitor.pageView({
  pageId: 'home',
  categoryId: 'marketing',
  extra: { source: 'banner' }
});
```

### 模块曝光
```javascript
monitor.moduleExpose({
  pageId: 'home',
  moduleId: 'banner',           // 页面区块标识
  contentId: 'banner_1',        // 内容标识
  exposeTimes: 1,              // 曝光次数
  categoryId: 'marketing'
});
```

### 错误上报
```javascript
monitor.errorReport({
  pageId: 'home',
  message: '自定义错误信息',
  fileName: 'app.js',
  lineNo: 100,
  colNo: 50,
  stack: 'Error stack trace'
});
```

## 配置项

### 基础配置
| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| reportUrl | string | 是 | - | 数据上报地址 |
| appId | string | 是 | - | 应用标识 |
| bizType | string | 否 | - | 业务类型 |
| env | 'dev' \| 'test' \| 'prod' | 否 | - | 环境标识 |
| version | string | 否 | - | 应用版本号 |
| pageId | string | 否 | - | 页面标识 |

### 功能配置
| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| enablePerformance | boolean | true | 是否启用性能监控 |
| enableError | boolean | true | 是否启用错误监控 |
| maxCache | number | 50 | 最大缓存数量 |
| reportTimeout | number | 5000 | 上报超时时间(ms) |
| sampling | number | 1 | 采样率 0-1 |

### 钩子函数
| 参数 | 类型 | 说明 |
| --- | --- | --- |
| beforeReport | (data: any) => any | 上报前的数据处理钩子 |
| onError | (error: any) => void | 上报失败的回调 |

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
- JavaScript 运行时错误
- Promise 未处理的 rejection
- 资源加载错误

## 浏览器支持

- Chrome >= 58
- Firefox >= 52
- Safari >= 11
- Edge >= 79

## License

MIT 