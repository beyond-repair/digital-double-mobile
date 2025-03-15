export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

export interface ModelConfig {
  type: 'local' | 'cloud';
  url: string;
  maxBatchSize?: number;
  temperature?: number;
}

export interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
}
