/**
 * 云存储适配器基类
 * 
 * 所有云存储适配器都继承此类
 */

import type { CloudAdapter, CloudCredentials, CloudProvider, SyncPackage } from './types';

export abstract class BaseCloudAdapter implements CloudAdapter {
  provider: CloudProvider;
  protected connected: boolean = false;
  protected credentials: CloudCredentials | null = null;

  constructor(provider: CloudProvider) {
    this.provider = provider;
  }

  async init(credentials: CloudCredentials): Promise<boolean> {
    this.credentials = credentials;
    this.connected = true;
    return true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  abstract upload(path: string, data: SyncPackage): Promise<boolean>;
  abstract download(path: string): Promise<SyncPackage | null>;
  abstract list(prefix: string): Promise<string[]>;
  abstract delete(path: string): Promise<boolean>;
  abstract getInfo(path: string): Promise<{ modified: number; size: number } | null>;

  protected ensureConnected(): void {
    if (!this.connected || !this.credentials) {
      throw new Error(`${this.provider} adapter not initialized`);
    }
  }
}
