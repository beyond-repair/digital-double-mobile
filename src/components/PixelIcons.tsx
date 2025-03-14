import React from 'react';

export const PixelIcons: React.FC = () => {
  const icons = [
    { name: 'browser', icon: '🌐' },
    { name: 'calendar', icon: '📅' },
    { name: 'notes', icon: '📝' },
    { name: 'settings', icon: '⚙️' }
  ];

  return (
    <>
      {icons.map(({ name, icon }) => (
        <div key={name} className="pixel-icon">
          <span className="icon">{icon}</span>
          <span className="icon-label">{name}</span>
        </div>
      ))}
    </>
  );
};
