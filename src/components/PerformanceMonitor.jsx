import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  performanceMonitor, 
  canvasMemoryManager, 
  errorLogger,
  performanceErrorDetector
} from '../utils/performance.js';

const MonitorContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 1000;
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const MetricLabel = styled.span`
  color: #ccc;
`;

const MetricValue = styled.span`
  color: ${props => {
    if (props.warning) return '#ffc107';
    if (props.error) return '#dc3545';
    return '#28a745';
  }};
  font-weight: bold;
`;

const ToggleButton = styled.button`
  position: fixed;
  top: 10px;
  right: 220px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  z-index: 1001;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

/**
 * Performance monitoring component for development
 * Shows real-time performance metrics and memory usage
 */
const PerformanceMonitor = ({ enabled = false }) => {
  const [isVisible, setIsVisible] = useState(enabled);
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    cacheSize: 0,
    operationTimes: {},
    errorCount: 0,
    recentErrors: []
  });

  useEffect(() => {
    if (!isVisible) return;

    // Start performance monitoring
    performanceMonitor.start();

    const updateMetrics = () => {
      const memoryStats = canvasMemoryManager.getMemoryStats();
      const errorStats = errorLogger.getStatistics();
      const operationTimes = performanceMonitor.getOperationTimes();

      setMetrics({
        fps: performanceMonitor.getFPS(),
        memoryUsage: memoryStats.estimatedMemoryUsage,
        cacheSize: memoryStats.imageCacheSize,
        canvasPoolSize: memoryStats.canvasPoolSize,
        operationTimes: Object.fromEntries(operationTimes),
        errorCount: errorStats.total,
        recentErrors: errorLogger.getRecentErrors(3)
      });
    };

    const interval = setInterval(updateMetrics, 1000);

    return () => {
      clearInterval(interval);
      performanceMonitor.stop();
    };
  }, [isVisible]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms) => {
    return `${ms.toFixed(2)}ms`;
  };

  const getFPSStatus = (fps) => {
    if (fps < 30) return 'error';
    if (fps < 50) return 'warning';
    return 'normal';
  };

  const getMemoryStatus = (bytes) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 100) return 'error';
    if (mb > 50) return 'warning';
    return 'normal';
  };

  if (!isVisible) {
    return (
      <ToggleButton onClick={() => setIsVisible(true)}>
        Show Performance
      </ToggleButton>
    );
  }

  return (
    <>
      <ToggleButton onClick={() => setIsVisible(false)}>
        Hide Performance
      </ToggleButton>
      <MonitorContainer>
        <div style={{ marginBottom: '8px', fontWeight: 'bold', borderBottom: '2px solid white', paddingBottom: '4px' }}>
          Performance Monitor
        </div>
        
        <MetricRow>
          <MetricLabel>FPS:</MetricLabel>
          <MetricValue {...{ [getFPSStatus(metrics.fps)]: true }}>
            {metrics.fps}
          </MetricValue>
        </MetricRow>

        <MetricRow>
          <MetricLabel>Memory:</MetricLabel>
          <MetricValue {...{ [getMemoryStatus(metrics.memoryUsage)]: true }}>
            {formatBytes(metrics.memoryUsage)}
          </MetricValue>
        </MetricRow>

        <MetricRow>
          <MetricLabel>Image Cache:</MetricLabel>
          <MetricValue>
            {metrics.cacheSize} items
          </MetricValue>
        </MetricRow>

        <MetricRow>
          <MetricLabel>Canvas Pool:</MetricLabel>
          <MetricValue>
            {metrics.canvasPoolSize} canvases
          </MetricValue>
        </MetricRow>

        <MetricRow>
          <MetricLabel>Errors:</MetricLabel>
          <MetricValue error={metrics.errorCount > 0}>
            {metrics.errorCount}
          </MetricValue>
        </MetricRow>

        {Object.keys(metrics.operationTimes).length > 0 && (
          <>
            <div style={{ marginTop: '8px', marginBottom: '4px', fontWeight: 'bold', fontSize: '11px' }}>
              Operation Times:
            </div>
            {Object.entries(metrics.operationTimes).map(([operation, time]) => (
              <MetricRow key={operation}>
                <MetricLabel style={{ fontSize: '10px' }}>
                  {operation}:
                </MetricLabel>
                <MetricValue warning={time > 16}>
                  {formatTime(time)}
                </MetricValue>
              </MetricRow>
            ))}
          </>
        )}

        {metrics.recentErrors.length > 0 && (
          <>
            <div style={{ marginTop: '8px', marginBottom: '4px', fontWeight: 'bold', fontSize: '11px', color: '#dc3545' }}>
              Recent Errors:
            </div>
            {metrics.recentErrors.map((error, index) => (
              <div key={index} style={{ fontSize: '10px', color: '#ffc107', marginBottom: '2px' }}>
                {error.context}: {error.message.substring(0, 30)}...
              </div>
            ))}
          </>
        )}

        <div style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}>
          Press Ctrl+Shift+P to clear metrics
        </div>
      </MonitorContainer>
    </>
  );
};

// Add keyboard shortcut to clear metrics
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      performanceMonitor.clearOperationTimes();
      errorLogger.clearErrors();
      canvasMemoryManager.cleanup();
      console.log('Performance metrics cleared');
    }
  });
}

export default PerformanceMonitor;