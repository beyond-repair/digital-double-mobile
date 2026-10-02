/**
 * Claim-0 offline menu shell.
 * Historical model-download MenuOverlay preserved as MenuOverlay.historical.tsx
 * (broken Worker / cloud download path — not product).
 */
import React, { useState } from 'react';
import { MODEL_CONFIGS } from '../types/ModelConfig';

interface MenuOverlayProps {
  activeModel: string;
  onModelChange: (model: string) => void;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({
  activeModel,
  onModelChange,
}) => {
  const [status] = useState<'ready'>('ready');

  return (
    <div
      className="menu-overlay"
      role="menu"
      tabIndex={0}
      aria-label="Model control menu (offline sketch)"
    >
      <div className="holographic-menu">
        <div className={`model-status ${status}`}>
          Model Status: {status} (offline Claim-0)
        </div>
        <select
          className="model-select"
          value={activeModel}
          onChange={(e) => onModelChange(e.target.value)}
          aria-label="Select AI model"
        >
          {Object.entries(MODEL_CONFIGS).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.name}
            </option>
          ))}
        </select>
        <button className="menu-item" role="menuitem" type="button">
          Browser
        </button>
        <button className="menu-item" role="menuitem" type="button">
          Calendar
        </button>
        <button className="menu-item" role="menuitem" type="button">
          Notes
        </button>
        <button className="menu-item" role="menuitem" type="button">
          Settings
        </button>
        <div className="performance-stats">
          <div>Mode: offline memory API</div>
          <div>Successor: Digital_Double_virtual_workforce</div>
        </div>
      </div>
    </div>
  );
};
