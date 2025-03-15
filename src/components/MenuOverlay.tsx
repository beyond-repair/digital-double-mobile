import React, { useEffect, useState, useCallback } from 'react';
import { ModelManager } from '../services/ModelManager';
import { ErrorBoundary } from 'react-error-boundary';
import { MODEL_CONFIGS } from '../types/ModelConfig';

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

interface MenuOverlayProps {
  activeModel: string;
  onModelChange: (model: string) => void;
}

interface ModelStatus {
  status: 'loading' | 'ready' | 'error';
  progress: number; 
}

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="error-container">
    <p>Something went wrong: {error.message}</p>
    <button onClick={resetErrorBoundary}>Retry</button>
  </div>
);

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ activeModel, onModelChange }) => {
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const MAX_RETRIES = 3;
  const ERROR_THRESHOLD = 3;

  const initializeModel = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) {
      setModelStatus('error');
      return;
    }

    try {
      setModelStatus('loading');
      const modelConfig = MODEL_CONFIGS[activeModel];
      const modelManager = ModelManager.getInstance({ 
        modelPath: modelConfig.modelPath 
      });
      const response = await modelManager.downloadModel();
      
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      
      setModelStatus('ready');
    } catch (error) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      console.error(`Model initialization error (retry in ${retryDelay}ms):`, error);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        initializeModel();
      }, retryDelay);
    }
  }, [retryCount, activeModel]);

  const handleError = useCallback((error: Error) => {
    setErrorCount(prev => {
      if (prev + 1 >= ERROR_THRESHOLD) {
        ModelManager.getInstance().cleanup();
        return 0; // Reset after cleanup
      }
      return prev + 1;
    });
  }, []);

  const monitorSystem = useCallback(async () => {
    try {
      const modelManager = ModelManager.getInstance({ 
        modelPath: MODEL_CONFIGS[activeModel].modelPath 
      });

      // More aggressive memory monitoring
      const currentMemory = modelManager.getMemoryUsage();
      const heapSize = performance?.memory?.usedJSHeapSize || 0;
      const heapLimit = performance?.memory?.jsHeapSizeLimit || 0;
      const memoryUsagePercent = (heapSize / heapLimit) * 100;
      
      setMemoryUsage(currentMemory);

      if (memoryUsagePercent > 60) { // Lower threshold for proactive optimization
        console.warn(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
        await modelManager.optimizeMemory();
      }

      if (memoryUsagePercent > 85) {
        throw new Error('Critical memory usage');
      }

      // Add checkpoints for model status
      const status = modelManager.getModelStatus();
      if (status === 'error' && retryCount < MAX_RETRIES) {
        await initializeModel();
      }
    } catch (error) {
      console.error('System monitoring error:', error);
      handleError(error);
    }
  }, [activeModel, handleError, retryCount, initializeModel]);

  useEffect(() => {
    const sysMonitor = setInterval(monitorSystem, 1000); // More frequent checks
    return () => {
      clearInterval(sysMonitor);
      ModelManager.getInstance().cleanup().catch(console.error);
    };
  }, [monitorSystem]);

  useEffect(() => {
    let mounted = true;
    let progressCheck: number;

    const checkProgress = () => {
      if (!mounted) return;
      const modelManager = ModelManager.getInstance({ 
        modelPath: MODEL_CONFIGS[activeModel].modelPath 
      });
      setDownloadProgress(modelManager.getDownloadProgress());
      progressCheck = requestAnimationFrame(checkProgress);
    };

    checkProgress();
    initializeModel();

    return () => {
      mounted = false;
      cancelAnimationFrame(progressCheck);
    };
  }, [initializeModel, activeModel]);

  const handleModelChange = useCallback(async (newModel: string) => {
    try {
      setModelStatus('loading');
      const modelManager = ModelManager.getInstance({ 
        modelPath: MODEL_CONFIGS[newModel].modelPath 
      });
      
      // Cleanup previous model
      await modelManager.cleanup();
      
      // Set new model with error handling
      onModelChange(newModel);
      await initializeModel();
      
      // Monitor initial memory usage
      const memUsage = modelManager.getMemoryUsage();
      setMemoryUsage(memUsage);
      
      if (memUsage > 400 * 1024 * 1024) {
        await modelManager.optimizeMemory();
      }
    } catch (error) {
      console.error('Model change error:', error);
      setModelStatus('error');
      setErrorCount(prev => prev + 1);
    }
  }, [initializeModel, onModelChange]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="menu-overlay" role="menu" tabIndex={0}>
        <div className="holographic-menu">
          <div className={`model-status ${modelStatus}`}>
            Model Status: {modelStatus}
            {modelStatus === 'loading' && (
              <div className="download-progress">
                Downloading: {downloadProgress.toFixed(1)}%
              </div>
            )}
          </div>
          <select 
            className="model-select"
            value={activeModel}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            <option value="deepseek-local">DeepSeek (Local)</option>
            <option value="llama-cloud">Llama (Cloud)</option>
          </select>
          <button className="menu-item" role="menuitem">Browser</button>
          <button className="menu-item" role="menuitem">Calendar</button>
          <button className="menu-item" role="menuitem">Notes</button>
          <button className="menu-item" role="menuitem">Settings</button>
        </div>
        <div className="performance-metrics">
          Memory Usage: {(memoryUsage / (1024 * 1024)).toFixed(2)}MB
        </div>
      </div>
    </ErrorBoundary>
  );
};
