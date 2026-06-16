/**
 * 同步管理器
 * 
 * 负责协调本地数据与云端数据的同步
 * 核心原则：主密码永远不离开本地设备
 */

import type {
  CloudAdapter,
  CloudCredentials,
  SyncConfig,
  SyncConflict,
  SyncManager as ISyncManager,
  SyncPackage,
  SyncResult,
  SyncStatus
} from './types';

import { generateChecksum } from '../utils';
import { db } from '../database';

export class SyncManager implements ISyncManager {
  private config: SyncConfig | null = null;
  private adapter: CloudAdapter | null = null;
  private status: SyncStatus = 'idle';
  private lastSyncTime: number | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(status: SyncStatus) => Set> = new Set();

  /**
   * 初始化同步管理器
   */
  async init(config: SyncConfig, adapter: CloudAdapter): Promise<boolean> {
    try {
      this.config = config;
      this.adapter = adapter;
      
      // 如果启用了自动同步，启动定时器
      if (config.autoSync && config.syncInterval > 0) {
        this.startAutoSync(config.syncInterval);
      }
      
      this.updateStatus('idle');
      return true;
    } catch (error) {
      console.error('Sync manager init failed:', error);
      this.updateStatus('error');
      return false;
    }
  }

  /**
   * 执行完整同步
   */
  async sync(): Promise<SyncResult> {
    if (!this.config || !this.adapter) {
      return this.createResult(false, 'error', 'Sync manager not initialized');
    }

    if (!this.adapter.isConnected()) {
      return this.createResult(false, 'error', 'Cloud adapter not connected');
    }

    this.updateStatus('syncing');

    try {
      // 1. 获取本地数据
      const localData = await this.getLocalData();
      const localPackage = await this.createSyncPackage(localData);

      // 2. 获取远程数据
      const remotePath = this.getRemotePath();
      const remotePackage = await this.adapter.download(remotePath);

      // 3. 检查冲突
      if (remotePackage) {
        const conflict = this.detectConflict(localPackage, remotePackage);
        if (conflict) {
          this.updateStatus('conflict');
          return this.createResult(false, 'conflict', 'Sync conflict detected', [conflict]);
        }
      }

      // 4. 上传本地数据
      const uploaded = await this.adapter.upload(remotePath, localPackage);
      if (!uploaded) {
        return this.createResult(false, 'error', 'Upload failed');
      }

      // 5. 更新同步时间
      this.lastSyncTime = Date.now();
      this.updateStatus('success');

      return this.createResult(true, 'success', 'Sync completed', undefined, 1, 0);
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateStatus('error');
      return this.createResult(false, 'error', String(error));
    }
  }

  /**
   * 上传所有本地数据
   */
  async uploadAll(): Promise<SyncResult> {
    if (!this.config || !this.adapter) {
      return this.createResult(false, 'error', 'Sync manager not initialized');
    }

    this.updateStatus('syncing');

    try {
      const localData = await this.getLocalData();
      const syncPackage = await this.createSyncPackage(localData);
      const remotePath = this.getRemotePath();

      const uploaded = await this.adapter.upload(remotePath, syncPackage);
      
      if (uploaded) {
        this.lastSyncTime = Date.now();
        this.updateStatus('success');
        return this.createResult(true, 'success', 'Upload completed', undefined, 1, 0);
      } else {
        this.updateStatus('error');
        return this.createResult(false, 'error', 'Upload failed');
      }
    } catch (error) {
      this.updateStatus('error');
      return this.createResult(false, 'error', String(error));
    }
  }

  /**
   * 下载远程数据
   */
  async downloadAll(): Promise<SyncResult> {
    if (!this.config || !this.adapter) {
      return this.createResult(false, 'error', 'Sync manager not initialized');
    }

    this.updateStatus('syncing');

    try {
      const remotePath = this.getRemotePath();
      const remotePackage = await this.adapter.download(remotePath);

      if (!remotePackage) {
        return this.createResult(false, 'error', 'No remote data found');
      }

      // 验证数据完整性
      const isValid = await this.verifySyncPackage(remotePackage);
      if (!isValid) {
        return this.createResult(false, 'error', 'Data integrity check failed');
      }

      // 应用远程数据到本地
      await this.applyRemoteData(remotePackage.data);

      this.lastSyncTime = Date.now();
      this.updateStatus('success');
      return this.createResult(true, 'success', 'Download completed', undefined, 0, 1);
    } catch (error) {
      this.updateStatus('error');
      return this.createResult(false, 'error', String(error));
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote'
  ): Promise<boolean> {
    try {
      if (resolution === 'local') {
        // 保留本地数据，上传覆盖
        const localData = await this.getLocalData();
        const syncPackage = await this.createSyncPackage(localData);
        const remotePath = this.getRemotePath();
        return await this.adapter!.upload(remotePath, syncPackage);
      } else {
        // 使用远程数据
        await this.applyRemoteData(conflict.remoteData.data);
        return true;
      }
    } catch (error) {
      console.error('Resolve conflict failed:', error);
      return false;
    }
  }

  /**
   * 获取同步状态
   */
  getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * 获取最后同步时间
   */
  getLastSyncTime(): number | null {
    return this.lastSyncTime;
  }

  /**
   * 停止同步
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.updateStatus('idle');
  }

  /**
   * 添加状态监听器
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ============ 私有方法 ============

  private updateStatus(status: SyncStatus): void {
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }

  private startAutoSync(interval: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncInterval = setInterval(() => this.sync(), interval);
  }

  private async getLocalData(): Promise<string> {
    // 从数据库获取所有数据
    const credentials = await db.credentials.toArray();
    return JSON.stringify(credentials);
  }

  private async createSyncPackage(data: string): Promise<SyncPackage> {
    const checksum = await generateChecksum(data);
    
    return {
      version: '1.0.0',
      deviceId: this.config!.deviceId,
      timestamp: Date.now(),
      data, // 注意：这里的数据应该已经加密
      checksum,
      metadata: {
        itemCount: JSON.parse(data).length,
        lastModified: Date.now(),
        dataType: 'credentials'
      }
    };
  }

  private async verifySyncPackage(pkg: SyncPackage): Promise<boolean> {
    const checksum = await generateChecksum(pkg.data);
    return checksum === pkg.checksum;
  }

  private detectConflict(local: SyncPackage, remote: SyncPackage): SyncConflict | null {
    // 如果远程数据比本地新，可能存在冲突
    if (remote.timestamp > local.timestamp) {
      return {
        id: `${local.deviceId}-${remote.deviceId}-${Date.now()}`,
        localData: local,
        remoteData: remote,
        localTimestamp: local.timestamp,
        remoteTimestamp: remote.timestamp
      };
    }
    return null;
  }

  private async applyRemoteData(encryptedData: string): Promise<void> {
    // 注意：这里需要先解密数据
    const data = JSON.parse(encryptedData);
    // 清空本地数据并导入远程数据
    await db.credentials.clear();
    await db.credentials.bulkAdd(data);
  }

  private getRemotePath(): string {
    return `/remember/sync/${this.config!.deviceId}/data.json`;
  }

  private createResult(
    success: boolean,
    status: SyncStatus,
    message?: string,
    conflicts?: SyncConflict[],
    uploaded?: number,
    downloaded?: number
  ): SyncResult {
    return {
      success,
      status,
      message,
      conflicts,
      uploaded,
      downloaded,
      timestamp: Date.now()
    };
  }
}

// 导出单例
export const syncManager = new SyncManager();
