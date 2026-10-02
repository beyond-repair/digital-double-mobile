import React from 'react';
import type { TaskStatusItem } from '../services/TaskManager';

type Props = {
  tasks?: TaskStatusItem[];
};

export const PixelIcons: React.FC<Props> = ({ tasks = [] }) => {
  const icons = [
    { name: 'browser', icon: '🌐' },
    { name: 'calendar', icon: '📅' },
    { name: 'notes', icon: '📝' },
    { name: 'settings', icon: '⚙️' },
  ];

  return (
    <>
      {icons.map(({ name, icon }) => (
        <div key={name} className="pixel-icon">
          <span className="icon">{icon}</span>
          <span className="icon-label">{name}</span>
        </div>
      ))}
      {tasks.slice(0, 4).map((task) => (
        <div key={task.id} className="pixel-icon task-chip" title={task.description}>
          <span className="icon">📌</span>
          <span className="icon-label">{task.priority}</span>
        </div>
      ))}
    </>
  );
};
