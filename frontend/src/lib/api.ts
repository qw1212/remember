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

// ==================== 习惯追踪相关 API ====================

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: string;       // 'daily' | 'weekly'
  target_days: number[];   // [0-6], 0=周日
  reminder_time?: string;
  created_at: string;
  is_active: boolean;
}

export interface HabitRecord {
  id: string;
  habit_id: string;
  date: string;            // YYYY-MM-DD
  completed: boolean;
  note?: string;
  created_at: string;
}

export interface HabitListResponse {
  success: boolean;
  data?: Habit[];
  error?: string;
}

export interface HabitRecordListResponse {
  success: boolean;
  data?: HabitRecord[];
  error?: string;
}

/**
 * 保存习惯
 */
export async function saveHabit(habit: Habit): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_habit', { habit });
}

/**
 * 获取所有习惯
 */
export async function getHabits(): Promise<HabitListResponse> {
  return await invoke<HabitListResponse>('get_habits');
}

/**
 * 删除习惯
 */
export async function deleteHabit(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_habit', { id });
}

/**
 * 保存打卡记录
 */
export async function saveHabitRecord(record: HabitRecord): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_habit_record', { record });
}

/**
 * 获取习惯的打卡记录
 */
export async function getHabitRecords(habitId: string): Promise<HabitRecordListResponse> {
  return await invoke<HabitRecordListResponse>('get_habit_records', { habitId });
}

/**
 * 获取指定日期范围的打卡记录
 */
export async function getHabitRecordsByDateRange(
  habitId: string,
  startDate: string,
  endDate: string
): Promise<HabitRecordListResponse> {
  return await invoke<HabitRecordListResponse>('get_habit_records_by_date_range', {
    habitId,
    startDate,
    endDate,
  });
}

/**
 * 删除打卡记录
 */
export async function deleteHabitRecord(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_habit_record', { id });
}

// ==================== 知识库相关 API ====================

export interface Knowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source?: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeListResponse {
  success: boolean;
  data?: Knowledge[];
  error?: string;
}

/**
 * 保存知识条目
 */
export async function saveKnowledge(knowledge: Knowledge): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_knowledge', { knowledge });
}

/**
 * 获取所有知识条目
 */
export async function getKnowledgeList(): Promise<KnowledgeListResponse> {
  return await invoke<KnowledgeListResponse>('get_knowledge_list');
}

/**
 * 删除知识条目
 */
export async function deleteKnowledge(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_knowledge', { id });
}

/**
 * 搜索知识条目
 */
export async function searchKnowledge(keyword: string): Promise<KnowledgeListResponse> {
  return await invoke<KnowledgeListResponse>('search_knowledge', { keyword });
}

// ==================== 思想日记相关 API ====================

export interface Thought {
  id: string;
  content: string;
  mood?: string;      // 'happy' | 'calm' | 'sad' | 'anxious' | 'angry'
  theme?: string;
  tags: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThoughtListResponse {
  success: boolean;
  data?: Thought[];
  error?: string;
}

/**
 * 保存思想日记
 */
export async function saveThought(thought: Thought): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_thought', { thought });
}

/**
 * 获取所有思想日记
 */
export async function getThoughts(): Promise<ThoughtListResponse> {
  return await invoke<ThoughtListResponse>('get_thoughts');
}

/**
 * 删除思想日记
 */
export async function deleteThought(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_thought', { id });
}

/**
 * 搜索思想日记
 */
export async function searchThoughts(keyword: string): Promise<ThoughtListResponse> {
  return await invoke<ThoughtListResponse>('search_thoughts', { keyword });
}

// ==================== 梦想清单相关 API ====================

export interface Dream {
  id: string;
  title: string;
  description?: string;
  category: string;        // 'travel' | 'career' | 'health' | 'learning' | 'personal' | 'other'
  target_date?: string;
  progress: number;        // 0-100
  status: string;          // 'pending' | 'in_progress' | 'completed' | 'abandoned'
  steps: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DreamListResponse {
  success: boolean;
  data?: Dream[];
  error?: string;
}

/**
 * 保存梦想
 */
export async function saveDream(dream: Dream): Promise<ApiResponse> {
  return await invoke<ApiResponse>('save_dream', { dream });
}

/**
 * 获取所有梦想
 */
export async function getDreams(): Promise<DreamListResponse> {
  return await invoke<DreamListResponse>('get_dreams');
}

/**
 * 删除梦想
 */
export async function deleteDream(id: string): Promise<ApiResponse> {
  return await invoke<ApiResponse>('delete_dream', { id });
}

/**
 * 搜索梦想
 */
export async function searchDreams(keyword: string): Promise<DreamListResponse> {
  return await invoke<DreamListResponse>('search_dreams', { keyword });
}
