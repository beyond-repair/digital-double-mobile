import type { Meta, StoryObj } from '@storybook/react';
import { MenuOverlay } from './MenuOverlay';

interface MenuOverlayProps {
  activeModel: string;
  onModelChange: (model: string) => void;
  error?: Error;
  resetErrorBoundary?: () => void;
}

const meta: Meta<typeof MenuOverlay> = {
  component: MenuOverlay,
  title: 'Components/MenuOverlay',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof MenuOverlay>;

export const Default: Story = {
  args: {
    activeModel: 'deepseek-local',
    onModelChange: (model: string) => console.log('Model changed:', model),
    error: undefined,
    resetErrorBoundary: () => console.log('Error boundary reset')
  },
};

export const WithError: Story = {
  args: {
    ...Default.args,
    error: new Error('Failed to load model'),
  },
};
