import { ImapConnectionConfig } from '@/lib/types/imap';

export class ImapTestWorker {
  private worker: Worker | null = null;
  private resolve: ((value: any) => void) | null = null;
  private reject: ((reason?: any) => void) | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor() {
    this.setupWorker();
  }

  private setupWorker() {
    if (this.worker) {
      this.worker.terminate();
    }
    
    this.worker = new Worker('/imap-test-worker.js');
    
    this.worker.onmessage = (event) => {
      if (this.resolve) {
        this.resolve(event.data);
      }
      this.cleanup();
    };

    this.worker.onerror = (error) => {
      if (this.reject) {
        this.reject(error);
      }
      this.cleanup();
    };
  }

  private cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.resolve = null;
    this.reject = null;
  }

  public async testConnection(config: ImapConnectionConfig) {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      
      // Set a timeout in case the worker gets stuck
      this.timeoutId = setTimeout(() => {
        if (this.reject) {
          this.reject(new Error('Connection test timed out'));
        }
        this.cleanup();
      }, 10000); // 10 seconds
      
      if (this.worker) {
        this.worker.postMessage({ config });
      } else {
        reject(new Error('Worker not initialized'));
      }
    });
  }

  public terminate() {
    this.cleanup();
  }
}
