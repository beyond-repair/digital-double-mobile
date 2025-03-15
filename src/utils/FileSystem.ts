export class FileSystem {
  static async verifyPath(path: string): Promise<boolean> {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async copyFile(source: string, destination: string): Promise<void> {
    const response = await fetch(source);
    const blob = await response.blob();
    const data = new FormData();
    data.append('file', blob);
    
    await fetch(destination, {
      method: 'POST',
      body: data
    });
  }

  static async validateModelFile(path: string): Promise<{isValid: boolean; size: number}> {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      const size = Number(response.headers.get('content-length'));
      const isValid = size > 0 && response.headers.get('content-type')?.includes('application/octet-stream');
      return { isValid, size };
    } catch {
      return { isValid: false, size: 0 };
    }
  }

  static async loadModelWithProgress(
    path: string, 
    onProgress: (progress: number) => void
  ): Promise<ArrayBuffer> {
    const response = await fetch(path);
    const reader = response.body!.getReader();
    const contentLength = Number(response.headers.get('content-length'));
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while(true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      chunks.push(value);
      receivedLength += value.length;
      onProgress((receivedLength / contentLength) * 100);
    }

    const allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for(const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }
    
    return allChunks.buffer;
  }
}
