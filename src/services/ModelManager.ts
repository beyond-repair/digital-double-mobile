import { ApiResponse, ModelConfig } from '../types/ApiTypes';

export class ModelManager {
  private static instance: ModelManager;
  private modelPath = './models/mistral-7b-instruct-v0.3.gguf';
  private modelStatus: 'loading' | 'ready' | 'error' = 'loading';
  private downloadProgress = 0;
  private worker: Worker | null = null;

  private constructor() {}

  static getInstance(): ModelManager {
    if (!this.instance) {
      this.instance = new ModelManager();
    }
    return this.instance;
  }

  async downloadModel(): Promise<ApiResponse> {
    try {
      if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('Missing API key');
      }

      const response = await fetch('https://huggingface.co/lmstudio-community/Mistral-7B-Instruct-v0.3-GGUF/resolve/main/model.gguf', {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const contentLength = +(response.headers.get('Content-Length') ?? 0);
      let receivedLength = 0;
      const chunks = [];

      while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        this.downloadProgress = (receivedLength / contentLength) * 100;
      }

      const blob = new Blob(chunks);
      await this.initializeModel(blob);
      this.modelStatus = 'ready';

      return { status: 'success', data: { modelStatus: 'ready' } };
    } catch (error) {
      this.modelStatus = 'error';
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getDownloadProgress(): number {
    return this.downloadProgress;
  }

  private async initializeModel(modelBlob: Blob): Promise<void> {
    // Initialize WebAssembly worker
    this.worker = new Worker(new URL('../workers/model.worker.ts', import.meta.url));
    await this.worker.postMessage({ type: 'init', model: modelBlob });
  }

  getModelStatus() {
    return this.modelStatus;
  }
}
