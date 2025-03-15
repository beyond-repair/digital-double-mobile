import React, { useEffect, useState, useCallback } from 'react';
import { ModelManager } from '../services/ModelManager';
import { ErrorBoundary } from 'react-error-boundary';
import { MODEL_CONFIGS } from '../types/ModelConfig';
import { FileSystem } from '../utils/FileSystem';

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
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memoryUtilization: 0,
    lastOptimization: 0
  });
  const MAX_RETRIES = 3;
  const ERROR_THRESHOLD = 3;
  const MEMORY_THRESHOLDS = {
    WARN: 40, // Lower threshold for larger models
    CRITICAL: 65,
    FATAL: 80
  };

  const initializeModel = useCallback(async () => {
    if (retryCount >= MAX_RETRIES) {
      setModelStatus('error');
      return;
    }

    try {
      setModelStatus('loading');
      const modelConfig = MODEL_CONFIGS[activeModel];
      
      // Validate model file first
      if (modelConfig.type === 'local') {
        const { isValid, size } = await FileSystem.validateModelFile(modelConfig.modelPath);
        if (!isValid) {
          throw new Error(`Invalid model file at: ${modelConfig.modelPath}`);
        }
        if (size > 1024 * 1024 * 1024 * 8) { // 8GB
          throw new Error('Model file too large for available memory');
        }
      }

      const modelManager = ModelManager.getInstance({ 
        modelPath: modelConfig.modelPath,
        useLocalCache: modelConfig.type === 'local'
      });
      
      if (modelConfig.type === 'local') {
        await FileSystem.loadModelWithProgress(
          modelConfig.modelPath,
          (progress) => setDownloadProgress(progress)
        );
      }
      
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

      const now = performance.now();
      const metrics = {
        memory: modelManager.getMemoryUsage(),
        heap: performance?.memory?.usedJSHeapSize || 0,
        heapLimit: performance?.memory?.jsHeapSizeLimit || 0,
        fps: 1000 / (now - (performanceMetrics.lastOptimization || now))
      };

      const memoryPercent = (metrics.heap / metrics.heapLimit) * 100;
      setMemoryUsage(metrics.memory);

      // Progressive optimization strategy
      if (memoryPercent > MEMORY_THRESHOLDS.WARN) {
        await modelManager.optimizeMemory();
        modelManager.clearCache();
      }
      if (memoryPercent > MEMORY_THRESHOLDS.CRITICAL) {
        await modelManager.unloadInactiveModels();
        modelManager.compactHeap();
      }
      if (memoryPercent > MEMORY_THRESHOLDS.FATAL) {
        throw new Error(`Memory usage critical: ${memoryPercent.toFixed(1)}%`);
      }

      if (metrics.fps < 30 || memoryPercent > MEMORY_THRESHOLDS.WARN) {
        await modelManager.optimizePerformance({
          aggressiveGC: metrics.fps < 20,
          unloadUnused: true
        });
        setPerformanceMetrics(prev => ({
          ...prev,
          lastOptimization: now
        }));
      }

      // Health check with circuit breaker
      if (errorCount > ERROR_THRESHOLD) {
        await modelManager.reset();
        setErrorCount(0);
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [activeModel, errorCount, performanceMetrics.lastOptimization]);

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
      
      // Enhanced cleanup for large models
      if (newModel === 'mistral-7b') {
        await modelManager.fullCleanup();
        await modelManager.preloadOptimization();
      }
      
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

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      ModelManager.getInstance().cleanup();
    }
    if (e.key === 'Enter' && modelStatus === 'error') {
      initializeModel();
    }
  }, [modelStatus, initializeModel]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div 
        className="menu-overlay" 
        role="menu" 
        tabIndex={0}
        onKeyDown={handleKeyPress}
        aria-label="Model control menu"
      >
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
            aria-label="Select AI model"
          >
            <option value="deepseek-local">DeepSeek (Local)</option>
            <option value="llama-cloud">Llama (Cloud)</option>
            <option value="mistral-7b">Mistral 7B</option>
          </select>
          <button className="menu-item" role="menuitem">Browser</button>
          <button className="menu-item" role="menuitem">Calendar</button>
          <button className="menu-item" role="menuitem">Notes</button>
          <button className="menu-item" role="menuitem">Settings</button>
          <div className="performance-stats">
            <div>FPS: {performanceMetrics.fps.toFixed(1)}</div>
            <div>Memory: {(memoryUsage / (1024 * 1024)).toFixed(2)}MB</div>
            {performanceMetrics.fps < 30 && (
              <div className="performance-warning">Performance degraded</div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
