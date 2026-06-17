/**
 * Tauri IPC API 模块
 * 
 * 前端通过此模块调用Rust后端功能
 */

import { invoke } from '@tauri-apps/api/core';

// ==================== 类型定义 ====================

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface Credential {
  id: string;
  title: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

export interface CredentialListResponse {
  success: boolean;
  data?: Credential[];
  error?: string;
}

export interface EncryptedData {
  nonce: string;
  data: string;
}

export interface EncryptResponse {
  success: boolean;
  data?: EncryptedData;
  error?: string;
}

// ==================== 加密相关 API ====================

/**
 * 派生密钥
 */
export async function deriveKey(password: string, salt: string): Promise<Uint8Array> {
  return await invoke<number[]>('derive_key', { password, salt })
    .then(bytes => new Uint8Array(bytes));
}

/**
 * 加密数据
 */
export async function encryptData(key: Uint8Array, data: string): Promise<EncryptResponse> {
  return await invoke<EncryptResponse>('encrypt_data', { 
    key: Array.from(key), 
    data 
  });
}

/**
 * 解密数据
 */
export async function decryptData(key: Uint8Array, encrypted: EncryptedData): Promise<EncryptResponse> {
  return await invoke<EncryptResponse>('decrypt_data', { 
    key: Array.from(key), 
    encrypted 
  });
}

/**
 * 生成随机密码
 */
export async function generatePassword(
  length: number = 16,
  useUppercase: boolean = true,
  useLowercase: boolean = true,
  useNumbers: boolean = true,
  useSymbols: boolean = true
): Promise<string> {
  return await invoke<string>('generate_password', {
    length,
    useUppercase,
    useLowercase,
    useNumbers,
    useSymbols,
  });
}

// ==================== 凭证相关 API ====================

/**
 * 保存凭证
 */
export async function saveCredential(credential: Credential): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_credential', { credential });
}

/**
 * 获取所有凭证
 */
export async function getCredentials(): Promise<CredentialListResponse> {
  return await invoke<CredentialListResponse>('get_credentials');
}

/**
 * 删除凭证
 */
export async function deleteCredential(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_credential', { id });
}

/**
 * 更新凭证
 */
export async function updateCredential(credential: Credential): Promise<ApiResponse> {
  return await invoke<ApiResponse>('update_credential', { credential });
}

// ==================== 密钥管理 API ====================

/**
 * 设置主密码
 */
export async function setMasterPassword(password: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('set_master_password', { password });
}

/**
 * 验证主密码
 */
export async function verifyMasterPassword(password: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('verify_master_password', { password });
}

/**
 * 检查主密码是否已设置
 */
export async function isMasterPasswordSet(): Promise<boolean> {
  return await invoke<boolean>('is_master_password_set');
}

/**
 * 锁定应用
 */
export async function lockApp(): Promise<ApiResponse> {
  return await invoke<ApiResponse>('lock_app');
}

/**
 * 检查应用是否已锁定
 */
export async function isLocked(): Promise<boolean> {
  return await invoke<boolean>('is_locked');
}

// ==================== 导入导出 API ====================

/**
 * 导出数据
 */
export async function exportData(): Promise<ApiResponse> {
  return await invoke<ApiResponse>('export_data');
}

/**
 * 导入数据
 */
export async function importData(data: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('import_data', { data });
}
