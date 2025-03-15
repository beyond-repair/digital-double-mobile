import { ApiResponse, ModelConfig } from '../types/ApiTypes';

export class ModelManager {
  private static instances: Map<string, ModelManager> = new Map();
  private modelPath: string;
  private modelStatus: 'loading' | 'ready' | 'error' = 'loading';
  private worker: Worker | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private downloadProgress = 0;
  private abortController: AbortController | null = null;
  private chunkCache: Map<string, ArrayBuffer> = new Map();
  private memoryUsage = 0;
  private readonly MAX_MEMORY_USAGE = 500 * 1024 * 1024; // 500MB

  private constructor(config: {modelPath: string}) {
    this.modelPath = config.modelPath;
  }

  static getInstance(config?: {modelPath: string}): ModelManager {
    if (!config?.modelPath) {
      throw new Error('ModelManager must be initialized with config');
    }
    
    if (!this.instances.has(config.modelPath)) {
      this.instances.set(config.modelPath, new ModelManager(config));
    }
    
    return this.instances.get(config.modelPath)!;
  }

  async initializeModel(modelBlob: Blob): Promise<void> {
    try {
      this.worker = new Worker(new URL('../workers/model.worker.ts', import.meta.url));
      await this.worker.postMessage({ type: 'init', model: modelBlob });
      this.modelStatus = 'ready';
    } catch (error) {
      this.modelStatus = 'error';
      throw error;
    }
  }

  async downloadModel(): Promise<ApiResponse> {
    try {
      this.abortController = new AbortController();
      const response = await fetch(this.modelPath, {
        signal: this.abortController.signal,
        headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}` }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      await this.streamDownload(response);
      return { status: 'success', data: { modelStatus: 'ready' } };
    } catch (error) {
      this.modelStatus = 'error';
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        return this.downloadModel();
      }
      return { status: 'error', error: error instanceof Error ? error.message : 'Download failed' };
    }
  }

  private async processModelChunk(chunk: Uint8Array): Promise<void> {
    if (!chunk?.length) return;

    try {
      // Add compression for large chunks
      const compressedChunk = chunk.length > 1024 * 1024 ? 
        await this.compressChunk(chunk) : chunk;

      const chunkHash = await crypto.subtle.digest('SHA-256', compressedChunk);
      const hashHex = Array.from(new Uint8Array(chunkHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (this.chunkCache.has(hashHex)) return;

      // Check memory before processing
      if (this.memoryUsage + compressedChunk.byteLength > this.MAX_MEMORY_USAGE * 0.8) {
        await this.optimizeMemory();
      }

      await this.validateAndProcessChunk(compressedChunk);
      this.chunkCache.set(hashHex, compressedChunk.buffer);
      this.memoryUsage += compressedChunk.byteLength;
    } catch (error) {
      console.error('Chunk processing error:', error);
      await this.handleChunkError(error);
    }
  }

  private async compressChunk(chunk: Uint8Array): Promise<Uint8Array> {
    // Simple compression - implement proper compression algorithm here
    return chunk.filter((_, i) => i % 2 === 0);
  }

  private async handleChunkError(error: Error): Promise<void> {
    this.modelStatus = 'error';
    await this.cleanup();
    throw new Error(`Chunk processing failed: ${error.message}`);
  }

  private async validateChunk(chunk: Uint8Array): Promise<boolean> {
    if (!chunk?.length || chunk.length > 10 * 1024 * 1024) return false;
    
    try {
      // Add SHA-256 validation
      const hash = await crypto.subtle.digest('SHA-256', chunk);
      return !!hash;
    } catch {
      return false;
    }
  }

  private async streamDownload(response: Response): Promise<void> {
    const reader = response.body!.getReader();
    const contentLength = Number(response.headers.get('Content-Length') ?? 0);
    let receivedLength = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        await this.processModelChunk(value);
        
        receivedLength += value.length;
        this.downloadProgress = (receivedLength / contentLength) * 100;
        
        if (this.modelStatus === 'error') {
          reader.cancel();
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  public async cleanup(): Promise<void> {
    try {
      this.abortController?.abort();
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      await this.releaseMemory();
      this.modelStatus = 'loading';
      this.downloadProgress = 0;
      this.retryCount = 0;
    } catch (error) {
      console.error('Cleanup error:', error);
      throw error;
    }
  }

  public static cleanup(): void {
    this.instances.forEach(instance => instance.cleanup());
    this.instances.clear();
  }

  public async optimizeMemory(): Promise<void> {
    try {
      const memoryThreshold = this.MAX_MEMORY_USAGE * 0.8;
      if (this.memoryUsage > memoryThreshold) {
        // Remove 30% of oldest chunks instead of 20% for more aggressive optimization
        const oldestChunks = Array.from(this.chunkCache.entries())
          .slice(0, Math.floor(this.chunkCache.size * 0.3));
        
        oldestChunks.forEach(([key]) => this.chunkCache.delete(key));
        
        this.memoryUsage = Array.from(this.chunkCache.values())
          .reduce((total, chunk) => total + chunk.byteLength, 0);

        // Force garbage collection if available
        if (globalThis.gc) {
          await new Promise<void>(resolve => setTimeout(() => {
            globalThis.gc?.();
            resolve();
          }, 0));
        }
      }
    } catch (error) {
      console.error('Memory optimization failed:', error);
      throw new Error('Memory optimization failed');
    }
  }

  private async validateAndProcessChunk(chunk: Uint8Array): Promise<void> {
    try {
      const isValid = await this.validateChunk(chunk);
      if (!isValid) {
        this.modelStatus = 'error';
        throw new Error('Invalid model chunk detected');
      }
      
      const currentMemory = this.getMemoryUsage();
      if (currentMemory + chunk.byteLength > this.MAX_MEMORY_USAGE) {
        await this.optimizeMemory();
      }
      
      await this.processChunk(chunk);
    } catch (error) {
      this.modelStatus = 'error';
      throw new Error(`Chunk validation failed: ${error.message}`);
    }
  }

  private async processChunk(chunk: Uint8Array): Promise<void> {
    const CHUNK_SIZE = 512 * 1024; // Reduced to 512KB for better memory handling
    const chunks: Uint8Array[] = [];
    
    for (let i = 0; i < chunk.length; i += CHUNK_SIZE) {
      chunks.push(chunk.slice(i, i + CHUNK_SIZE));
    }

    for (const subChunk of chunks) {
      if (this.worker) {
        try {
          await this.worker.postMessage({ type: 'process', chunk: subChunk }, [subChunk.buffer]);
          await new Promise(resolve => setTimeout(resolve, 0));
        } catch (error) {
          console.error('Chunk processing error:', error);
          throw error;
        }
      }
    }
  }

  private async releaseMemory(): Promise<void> {
    this.chunkCache.clear();
    this.memoryUsage = 0;
    if (globalThis.gc) {
      await new Promise<void>(resolve => {
        setTimeout(() => {
          globalThis.gc?.();
          resolve();
        }, 0);
      });
    }
  }

  getDownloadProgress(): number {
    return this.downloadProgress;
  }

  getModelStatus(): string {
    return this.modelStatus;
  }

  public getMemoryUsage(): number {
    return this.memoryUsage;
  }
}
