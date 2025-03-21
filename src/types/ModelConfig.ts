export interface ModelConfig {
  modelPath: string;
  type: 'local' | 'cloud';
  name: string;
  maxTokens?: number;
  systemPrompt?: string;
  settings?: {
    temperature: number;
    topP: number;
    repetitionPenalty: number;
    contextWindow?: number;
  };
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
  const connection = (navigator as any)?.connection;
  event.context.connection = {
    type: connection?.type || 'unknown',
    downlink: connection?.downlink || 0
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
  },
  'mistral-7b': {
    modelPath: './models/mistral-7b-instruct-v0.3.gguf',
    type: 'local',
    name: 'Mistral 7B',
    maxTokens: 4096,
    systemPrompt: 'You are a helpful AI assistant.',
    settings: {
      temperature: 0.7,
      topP: 0.95,
      repetitionPenalty: 1.1,
      contextWindow: 8192
    }
  },
  'dolphin-mistral': {
    modelPath: 'https://api.openrouter.ai/api/v1/chat/completions',
    type: 'cloud',
    name: 'Dolphin Mistral 24B',
    maxTokens: 4096,
    systemPrompt: 'You are a helpful AI assistant.',
    settings: {
      temperature: 0.7,
      topP: 0.95,
      repetitionPenalty: 1.1,
      contextWindow: 8192
    }
  },
  'dolphin3.0-r1': {
    modelPath: 'https://api.openrouter.ai/api/v1/model/cognitivecomputations/dolphin3.0-r1-mistral-24b',
    type: 'cloud',
    name: 'Dolphin 3.0 R1 Mistral 24B (Free)',
    maxTokens: 4096,
    systemPrompt: 'You are a helpful AI assistant.',
    settings: {
      temperature: 0.7,
      topP: 0.95,
      repetitionPenalty: 1.1,
      contextWindow: 8192
    }
  }
};
