export interface ModelConfig {
  modelPath: string;
  type: 'local' | 'cloud';
  name: string;
}

export interface ModelError {
  code: string;
  message: string;
  details?: unknown;
}

export type ModelStatus = {
  isLoaded: boolean;
  error?: ModelError;
} & ModelMetrics;

export interface ModelMetrics {
  fps?: number;
  memoryUsage?: number;
  processingTime?: number;
  confidenceScore?: number;
}

export interface ModelValidation {
  isValid: boolean;
  lastValidated: Date;
  errors: ModelError[];
}

export interface TelemetryEvent {
  timestamp: number;
  type: 'error' | 'performance' | 'usage';
  data: Record<string, unknown>;
}

export interface PerformanceMetrics extends ModelMetrics {
  renderTime?: number;
  memoryHeapSize?: number;
  domNodes?: number;
}

export interface EnhancedTelemetry extends TelemetryEvent {
  context: {
    darkMode: boolean;
    reducedMotion: boolean;
    deviceMemory?: number;
    connection?: {
      type: string;
      downlink: number;
    };
  };
}

export const validateModel = (config: ModelConfig): ModelValidation => {
  const errors: ModelError[] = [];
  if (!config.modelPath) {
    errors.push({ code: 'INVALID_PATH', message: 'Model path is required' });
  }
  return {
    isValid: errors.length === 0,
    lastValidated: new Date(),
    errors
  };
};

export const trackMetrics = (metrics: PerformanceMetrics): void => {
  // Implementation
};

export const sendTelemetry = (event: EnhancedTelemetry): void => {
  // Add network info
  event.context.connection = {
    type: navigator.connection?.type || 'unknown',
    downlink: navigator.connection?.downlink || 0
  };
  console.info('Enhanced telemetry:', event);
};

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'deepseek-local': {
    modelPath: '/models/deepseek-base',
    type: 'local',
    name: 'DeepSeek (Local)'
  },
  'llama-cloud': {
    modelPath: 'https://api.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf',
    type: 'cloud',
    name: 'Llama (Cloud)'
  }
};
