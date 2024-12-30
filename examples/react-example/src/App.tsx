import { PerformanceMonitor } from '../../../dist/index';

// 初始化监控
new PerformanceMonitor({
    reportUrl: 'https://your-api.com/collect',
    appId: 'react-demo'
});

function App() {
    const triggerError = () => {
        throw new Error('Test React Error');
    };

    const triggerPromiseError = () => {
        Promise.reject(new Error('Test React Promise Error'));
    };

    return (
        <div>
            <h1>Performance Monitor React Demo</h1>
            <button onClick={triggerError}>Trigger Error</button>
            <button onClick={triggerPromiseError}>Trigger Promise Error</button>
        </div>
    );
}

export default App;
