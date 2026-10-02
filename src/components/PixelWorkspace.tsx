import React, { useState, useEffect, useCallback } from 'react';
import { MenuOverlay } from './MenuOverlay';
import { PixelIcons } from './PixelIcons';
import { TaskManager, type TaskStatusItem } from '../services/TaskManager';
import { ErrorBoundary } from './ErrorBoundary';
import { trackMetrics } from '../types/ModelConfig';

export const PixelWorkspace: React.FC = () => {
  const [tasks, setTasks] = useState<TaskStatusItem[]>([]);
  const [activeModel, setActiveModel] = useState('deepseek-local');
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const taskManager = TaskManager.getInstance();
      const taskStatus = await taskManager.getTaskStatus();
      setTasks(taskStatus);
      trackMetrics({
        renderTime: 0,
        domNodes: typeof document !== 'undefined' ? document.querySelectorAll('*').length : 0,
      });
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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
