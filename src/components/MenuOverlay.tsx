import React, { useEffect, useState } from 'react';
import { ModelManager } from '../services/ModelManager';
import { ErrorBoundary } from 'react-error-boundary';

interface MenuOverlayProps {
  activeModel: string;
  onModelChange: (model: string) => void;
}

const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="error-container">
    <p>Something went wrong: {error.message}</p>
    <button onClick={() => window.location.reload()}>Retry</button>
  </div>
);

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ activeModel, onModelChange }) => {
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    const modelManager = ModelManager.getInstance();
    
    const updateProgress = () => {
      if (!mounted) return;
      setDownloadProgress(modelManager.getDownloadProgress());
    };

    const progressInterval = setInterval(updateProgress, 100);

    modelManager.downloadModel()
      .then((response) => {
        if (!mounted) return;
        if (response.status === 'error') {
          throw new Error(response.error);
        }
        setModelStatus('ready');
      })
      .catch((error) => {
        if (!mounted) return;
        setModelStatus('error');
        console.error('Model download failed:', error);
      })
      .finally(() => {
        clearInterval(progressInterval);
      });

    return () => {
      mounted = false;
      clearInterval(progressInterval);
    };
  }, []);

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
            onChange={(e) => onModelChange(e.target.value)}
          >
            <option value="deepseek-local">DeepSeek (Local)</option>
            <option value="llama-cloud">Llama (Cloud)</option>
          </select>
          <button className="menu-item" role="menuitem">Browser</button>
          <button className="menu-item" role="menuitem">Calendar</button>
          <button className="menu-item" role="menuitem">Notes</button>
          <button className="menu-item" role="menuitem">Settings</button>
        </div>
      </div>
    </ErrorBoundary>
  );
};
