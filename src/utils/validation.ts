export const validateEnv = (): void => {
  const required = [
    'JWT_SECRET_KEY',
    'DATABASE_URL',
    'REDIS_URL',
    'HUGGINGFACE_API_KEY',
    'FIREBASE_CONFIG'
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  try {
    JSON.parse(process.env.FIREBASE_CONFIG || '');
  } catch (e) {
    throw new Error('Invalid FIREBASE_CONFIG JSON');
  }
};

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  measurementId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

export const validateFirebaseConfig = (config: FirebaseConfig): boolean => {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  return required.every(key => !!config[key]);
};

export interface ModelConfig {
  url: string;
  type: 'local' | 'cloud';
  maxLength?: number;
  temperature?: number;
}

export const validateModelResponse = (response: any): boolean => {
  return response && 
         (response.generated_text || 
          (Array.isArray(response) && response[0]?.generated_text));
};

export const validateRequestParams = (params: {
  message: string,
  model?: string,
  turboMode?: boolean
}): string | null => {
  if (!params.message?.trim()) {
    return 'Message is required';
  }
  if (params.message.length > parseInt(process.env.INPUT_MAX_LENGTH || '1000')) {
    return 'Message too long';
  }
  return null;
};

export const validateModelConfig = (config: any): boolean => {
  const required = ['url', 'type'];
  return required.every(key => !!config[key]) && 
         ['local', 'cloud'].includes(config.type);
};

export const validateCacheConfig = (ttl: number, maxSize: number): boolean => {
  return Number.isInteger(ttl) && ttl > 0 && 
         Number.isInteger(maxSize) && maxSize > 0;
};
