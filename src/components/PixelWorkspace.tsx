import React from 'react';
import { colors } from '../utils/colors';
import { MenuOverlay } from './MenuOverlay';
import { PixelIcons } from './PixelIcons';

export const PixelWorkspace: React.FC = () => {
  return (
    <div className="pixel-workspace">
      <div className="crt-overlay"></div>
      <MenuOverlay />
      <div className="workspace-grid">
        <PixelIcons />
      </div>
    </div>
  );
};
