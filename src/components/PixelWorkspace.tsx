import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';
import { MenuOverlay } from './MenuOverlay';
import { PixelIcons } from './PixelIcons';
import { TaskManager } from '../services/TaskManager';

export const PixelWorkspace: React.FC = () => {
  const [tasks, setTasks] = useState([]);
  const [activeModel, setActiveModel] = useState('deepseek-local');

  useEffect(() => {
    const taskManager = TaskManager.getInstance();
    const loadTasks = async () => {
      const taskStatus = await taskManager.getTaskStatus();
      setTasks(taskStatus);
    };
    loadTasks();
  }, []);

  return (
    <div className="pixel-workspace">
      <div className="crt-overlay"></div>
      <MenuOverlay activeModel={activeModel} onModelChange={setActiveModel} />
      <div className="workspace-grid">
        <PixelIcons tasks={tasks} />
      </div>
    </div>
  );
};
