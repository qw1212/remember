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

// ==================== 回忆录相关 API ====================

export interface Memoir {
  id: string;
  title: string;
  content: string;
  summary?: string;
  event_date?: string;
  location?: string;
  people: string[];
  tags: string[];
  category: string;
  emotion?: string;
  ai_conversation?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemoirLink {
  id: string;
  from_id: string;
  to_id: string;
  relation?: string;
  created_at: string;
}

export interface MemoirListResponse {
  success: boolean;
  data?: Memoir[];
  error?: string;
}

export interface MemoirLinkListResponse {
  success: boolean;
  data?: MemoirLink[];
  error?: string;
}

/**
 * 保存回忆条目
 */
export async function saveMemoir(memoir: Memoir): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_memoir', { memoir });
}

/**
 * 获取所有回忆条目
 */
export async function getMemoirs(): Promise<MemoirListResponse> {
  return await invoke<MemoirListResponse>('get_memoirs');
}

/**
 * 根据ID获取回忆条目
 */
export async function getMemoirById(id: string): Promise<MemoirListResponse> {
  return await invoke<MemoirListResponse>('get_memoir_by_id', { id });
}

/**
 * 删除回忆条目
 */
export async function deleteMemoir(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_memoir', { id });
}

/**
 * 搜索回忆条目
 */
export async function searchMemoirs(keyword: string): Promise<MemoirListResponse> {
  return await invoke<MemoirListResponse>('search_memoirs', { keyword });
}

/**
 * 保存回忆关联
 */
export async function saveMemoirLink(link: MemoirLink): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_memoir_link', { link });
}

/**
 * 获取回忆条目的所有关联
 */
export async function getMemoirLinks(memoirId: string): Promise<MemoirLinkListResponse> {
  return await invoke<MemoirLinkListResponse>('get_memoir_links', { memoirId });
}

/**
 * 删除回忆关联
 */
export async function deleteMemoirLink(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_memoir_link', { id });
}

// ==================== AI 相关 API ====================

export interface AiConfig {
  provider: string;        // "ollama" | "openai"
  api_url: string;         // Ollama: http://localhost:11434, OpenAI: https://api.openai.com
  api_key?: string;        // OpenAI API Key
  model: string;           // 模型名称
}

export interface ChatMessage {
  role: string;    // "system" | "user" | "assistant"
  content: string;
}

export interface AiChatResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface AiStringListResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

/**
 * AI 聊天
 */
export async function aiChat(config: AiConfig, messages: ChatMessage[]): Promise<AiChatResponse> {
  return await invoke<AiChatResponse>('ai_chat', { config, messages });
}

/**
 * AI 流式聊天（通过事件接收数据）
 */
export async function aiChatStream(config: AiConfig, messages: ChatMessage[]): Promise<AiChatResponse> {
  return await invoke<AiChatResponse>('ai_chat_stream', { config, messages });
}

/**
 * 获取回忆录引导对话的 System Prompt
 */
export async function getMemoirPrompt(): Promise<string> {
  return await invoke<string>('get_memoir_prompt');
}

/**
 * AI 发现回忆关联
 */
export async function aiFindRelated(
  config: AiConfig,
  memoirId: string,
  memoirTitle: string,
  memoirContent: string,
  allMemoirs: Memoir[]
): Promise<AiChatResponse> {
  return await invoke<AiChatResponse>('ai_find_related', {
    config,
    memoirId,
    memoirTitle,
    memoirContent,
    allMemoirs
  });
}

/**
 * AI 提取标签
 */
export async function aiExtractTags(config: AiConfig, content: string): Promise<AiStringListResponse> {
  return await invoke<AiStringListResponse>('ai_extract_tags', { config, content });
}

/**
 * AI 生成摘要
 */
export async function aiGenerateSummary(config: AiConfig, content: string): Promise<AiChatResponse> {
  return await invoke<AiChatResponse>('ai_generate_summary', { config, content });
}

/**
 * AI 分析情感
 */
export async function aiAnalyzeEmotion(config: AiConfig, content: string): Promise<AiChatResponse> {
  return await invoke<AiChatResponse>('ai_analyze_emotion', { config, content });
}
