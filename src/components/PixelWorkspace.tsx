import React, { useState, useEffect, useCallback } from 'react';
import { colors } from '../utils/colors';
import { MenuOverlay } from './MenuOverlay';
import { PixelIcons } from './PixelIcons';
import { TaskManager } from '../services/TaskManager';
import { ErrorBoundary } from './ErrorBoundary';
import { trackMetrics, sendTelemetry } from '../types/ModelConfig';

export const PixelWorkspace: React.FC = () => {
  const [tasks, setTasks] = useState([]);
  const [activeModel, setActiveModel] = useState('deepseek-local');
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const taskManager = TaskManager.getInstance();
      const taskStatus = await taskManager.getTaskStatus();
      setTasks(taskStatus);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      trackMetrics({
        renderTime: entries[0]?.duration,
        domNodes: document.querySelectorAll('*').length
      });
    });
    
    observer.observe({ entryTypes: ['render'] });
    return () => observer.disconnect();
  }, []);

  const handleKeyNav = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [handleKeyNav]);

  return (
    <ErrorBoundary>
      <div className="pixel-workspace" role="main">
        <div 
          className="loading-overlay" 
          role="alert" 
          aria-live="polite"
          data-visible={loading}
        >
          {loading && (
            <>
              <div className="loading-pixel" />
              <span className="sr-only">Loading content...</span>
            </>
          )}
        </div>
        <div className="crt-overlay"></div>
        <MenuOverlay activeModel={activeModel} onModelChange={setActiveModel} />
        <div className="workspace-grid">
          <PixelIcons tasks={tasks} />
        </div>
      </div>
    </ErrorBoundary>
  );
};
