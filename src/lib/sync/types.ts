/**
 * 同步模块类型定义
 * 
 * 核心原则：
 * - 主密码永远不离开本地设备
 * - 只同步加密后的数据
 * - 用户完全控制同步设置
 */

// 云存储提供商类型
export type CloudProvider = 'icloud' | 'onedrive' | 'gdrive' | 'dropbox' | 'webdav';

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict';

// 同步配置
export interface SyncConfig {
  enabled: boolean;
  provider: CloudProvider;
  autoSync: boolean;
  syncInterval: number; // 毫秒
  lastSyncTime?: number;
  deviceId: string;
}

// 云存储凭证（加密存储）
export interface CloudCredentials {
  provider: CloudProvider;
  accessToken?: string;
  refreshToken?: string;
  endpoint?: string; // WebDAV需要
  username?: string;
  expiresAt?: number;
}

// 同步数据包
export interface SyncPackage {
  version: string;
  deviceId: string;
  timestamp: number;
  data: string; // 加密后的数据
  checksum: string; // 数据校验
  metadata: SyncMetadata;
}

// 同步元数据
export interface SyncMetadata {
  itemCount: number;
  lastModified: number;
  dataType: 'credentials' | 'habits' | 'knowledge' | 'journal' | 'dreams' | 'full';
}

// 同步冲突
export interface SyncConflict {
  id: string;
  localData: SyncPackage;
  remoteData: SyncPackage;
  localTimestamp: number;
  remoteTimestamp: number;
  resolution?: 'local' | 'remote' | 'merge';
}

// 同步结果
export interface SyncResult {
  success: boolean;
  status: SyncStatus;
  message?: string;
  conflicts?: SyncConflict[];
  uploaded?: number;
  downloaded?: number;
  timestamp: number;
}

// 云存储适配器接口
export interface CloudAdapter {
  provider: CloudProvider;
  
  // 初始化连接
  init(credentials: CloudCredentials): Promise<boolean>;
  
  // 检查连接状态
  isConnected(): boolean;
  
  // 上传数据
  upload(path: string, data: SyncPackage): Promise<boolean>;
  
  // 下载数据
  download(path: string): Promise<SyncPackage | null>;
  
  // 列出文件
  list(prefix: string): Promise<string[]>;
  
  // 删除文件
  delete(path: string): Promise<boolean>;
  
  // 获取文件信息
  getInfo(path: string): Promise<{ modified: number; size: number } | null>;
}

// 同步管理器接口
export interface SyncManager {
  // 初始化
  init(config: SyncConfig): Promise<boolean>;
  
  // 执行同步
  sync(): Promise<SyncResult>;
  
  // 上传本地数据
  uploadAll(): Promise<SyncResult>;
  
  // 下载远程数据
  downloadAll(): Promise<SyncResult>;
  
  // 解决冲突
  resolveConflict(conflict: SyncConflict, resolution: 'local' | 'remote'): Promise<boolean>;
  
  // 获取同步状态
  getStatus(): SyncStatus;
  
  // 获取最后同步时间
  getLastSyncTime(): number | null;
  
  // 停止同步
  stop(): void;
}
