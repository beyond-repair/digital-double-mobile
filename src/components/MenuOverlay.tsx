import React from 'react';

export const MenuOverlay: React.FC = () => {
  return (
    <div className="menu-overlay" role="menu" tabIndex={0}>
      <div className="holographic-menu">
        <button className="menu-item" role="menuitem">Browser</button>
        <button className="menu-item" role="menuitem">Calendar</button>
        <button className="menu-item" role="menuitem">Notes</button>
        <button className="menu-item" role="menuitem">Settings</button>
      </div>
    </div>
  );
};
