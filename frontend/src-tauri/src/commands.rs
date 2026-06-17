//! Tauri IPC命令模块
//! 
//! 定义前端可以调用的所有命令

use tauri::State;
use std::sync::Arc;
use crate::crypto::{EncryptedData};
use crate::storage::{StorageManager, Credential, Memoir, MemoirLink};
use crate::ai::{AiClient, AiConfig, ChatMessage, get_memoir_system_prompt, get_extract_tags_prompt, get_summary_prompt, get_emotion_prompt};
use std::sync::Mutex;

/// Base64编码辅助函数
fn base64_encode(data: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(data)
}

/// Base64解码辅助函数
fn base64_decode(data: &str) -> Result<Vec<u8>, String> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("Base64解码失败: {}", e))
}

/// 应用状态
pub struct AppState {
    pub storage: Arc<StorageManager>,
    pub is_locked: Mutex<bool>,
    pub master_key: Mutex<Option<Vec<u8>>>,
}

/// 加密结果响应
#[derive(serde::Serialize)]
pub struct EncryptResponse {
    pub success: bool,
    pub data: Option<EncryptedData>,
    pub error: Option<String>,
}

/// 凭证列表响应
#[derive(serde::Serialize)]
pub struct CredentialListResponse {
    pub success: bool,
    pub data: Option<Vec<Credential>>,
    pub error: Option<String>,
}

/// 回忆录列表响应
#[derive(serde::Serialize)]
pub struct MemoirListResponse {
    pub success: bool,
    pub data: Option<Vec<Memoir>>,
    pub error: Option<String>,
}

/// 回忆录关联列表响应
#[derive(serde::Serialize)]
pub struct MemoirLinkListResponse {
    pub success: bool,
    pub data: Option<Vec<MemoirLink>>,
    pub error: Option<String>,
}

/// 通用响应
#[derive(serde::Serialize)]
pub struct ApiResponse {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<String>,
}

// ==================== 加密相关命令 ====================

/// 派生密钥
#[tauri::command]
pub fn derive_key(password: &str, salt: &str) -> Result<Vec<u8>, String> {
    let _ = (password, salt);
    // 简化的密钥派生（实际应使用Argon2id）
    let key = crate::crypto::generate_random_bytes(32);
    Ok(key)
}

/// 加密数据
#[tauri::command]
pub fn encrypt_data(key: Vec<u8>, data: &str) -> EncryptResponse {
    match crate::crypto::encrypt_with_key(&key, data) {
        Ok(encrypted) => EncryptResponse {
            success: true,
            data: Some(encrypted),
            error: None,
        },
        Err(e) => EncryptResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        },
    }
}

/// 解密数据
#[tauri::command]
pub fn decrypt_data(key: Vec<u8>, encrypted: EncryptedData) -> EncryptResponse {
    match crate::crypto::decrypt_with_key(&key, &encrypted) {
        Ok(decrypted) => {
            let re_encrypted = crate::crypto::EncryptedData {
                nonce: encrypted.nonce,
                data: decrypted,
            };
            EncryptResponse {
                success: true,
                data: Some(re_encrypted),
                error: None,
            }
        }
        Err(e) => EncryptResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        },
    }
}

/// 生成随机密码
#[tauri::command]
pub fn generate_password(
    length: usize,
    use_uppercase: bool,
    use_lowercase: bool,
    use_numbers: bool,
    use_symbols: bool,
) -> String {
    crate::crypto::generate_password(length, use_uppercase, use_lowercase, use_numbers, use_symbols)
}

// ==================== 存储相关命令 ====================

/// 保存凭证
#[tauri::command]
pub async fn save_credential(
    state: State<'_, AppState>,
    credential: Credential,
) -> Result<ApiResponse, String> {
    match state.storage.save_credential(&credential) {
        Ok(_) => Ok(ApiResponse {
            success: true,
            message: Some("凭证已保存".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 获取所有凭证
#[tauri::command]
pub async fn get_credentials(state: State<'_, AppState>) -> Result<CredentialListResponse, String> {
    match state.storage.get_credentials() {
        Ok(credentials) => Ok(CredentialListResponse {
            success: true,
            data: Some(credentials),
            error: None,
        }),
        Err(e) => Ok(CredentialListResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 删除凭证
#[tauri::command]
pub async fn delete_credential(state: State<'_, AppState>, id: String) -> Result<ApiResponse, String> {
    match state.storage.delete_credential(&id) {
        Ok(_) => Ok(ApiResponse {
            success: true,
            message: Some("凭证已删除".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 更新凭证
#[tauri::command]
pub async fn update_credential(
    state: State<'_, AppState>,
    credential: Credential,
) -> Result<ApiResponse, String> {
    match state.storage.update_credential(&credential) {
        Ok(_) => Ok(ApiResponse {
            success: true,
            message: Some("凭证已更新".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

// ==================== 密钥管理命令 ====================

/// 设置主密码
#[tauri::command]
pub async fn set_master_password(
    state: State<'_, AppState>,
    password: String,
) -> Result<ApiResponse, String> {
    // 生成随机salt
    let salt = crate::crypto::generate_random_bytes(32);
    
    // 从密码派生密钥
    let key = crate::crypto::derive_key_from_password(&password, &salt);
    
    // 保存salt到数据库
    if let Err(e) = state.storage.set_app_state("master_salt", &base64_encode(&salt)) {
        return Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        });
    }
    
    // 保存密钥到Keychain
    match state.storage.save_key_to_keychain("master_key", &key) {
        Ok(_) => {
            // 更新内存中的密钥
            let mut master_key = state.master_key.lock().unwrap();
            *master_key = Some(key);
            
            // 更新锁定状态
            let mut is_locked = state.is_locked.lock().unwrap();
            *is_locked = false;
            
            Ok(ApiResponse {
                success: true,
                message: Some("主密码已设置".to_string()),
                error: None,
            })
        }
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 验证主密码
#[tauri::command]
pub async fn verify_master_password(
    state: State<'_, AppState>,
    password: String,
) -> Result<ApiResponse, String> {
    // 从数据库读取salt
    let salt = match state.storage.get_app_state("master_salt") {
        Ok(Some(salt_b64)) => base64_decode(&salt_b64).unwrap_or_default(),
        _ => return Ok(ApiResponse {
            success: false,
            message: None,
            error: Some("主密码未设置".to_string()),
        }),
    };
    
    // 从密码派生密钥
    let key = crate::crypto::derive_key_from_password(&password, &salt);
    
    // 从Keychain读取存储的密钥
    match state.storage.get_key_from_keychain("master_key") {
        Ok(Some(stored_key)) => {
            // 比较密钥
            if key == stored_key {
                // 更新内存中的密钥
                let mut master_key = state.master_key.lock().unwrap();
                *master_key = Some(key);
                
                // 更新锁定状态
                let mut is_locked = state.is_locked.lock().unwrap();
                *is_locked = false;
                
                Ok(ApiResponse {
                    success: true,
                    message: Some("验证成功".to_string()),
                    error: None,
                })
            } else {
                Ok(ApiResponse {
                    success: false,
                    message: None,
                    error: Some("密码错误".to_string()),
                })
            }
        }
        Ok(None) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some("主密码未设置".to_string()),
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 检查主密码是否已设置
#[tauri::command]
pub async fn is_master_password_set(state: State<'_, AppState>) -> Result<bool, String> {
    match state.storage.get_key_from_keychain("master_key") {
        Ok(Some(_)) => Ok(true),
        _ => Ok(false),
    }
}

/// 锁定应用
#[tauri::command]
pub async fn lock_app(state: State<'_, AppState>) -> Result<ApiResponse, String> {
    let mut is_locked = state.is_locked.lock().unwrap();
    *is_locked = true;
    
    let mut master_key = state.master_key.lock().unwrap();
    *master_key = None;
    
    Ok(ApiResponse {
        success: true,
        message: Some("应用已锁定".to_string()),
        error: None,
    })
}

/// 检查应用是否已锁定
#[tauri::command]
pub async fn is_locked(state: State<'_, AppState>) -> Result<bool, String> {
    let is_locked = state.is_locked.lock().unwrap();
    Ok(*is_locked)
}

// ==================== 导入导出命令 ====================

/// 导出数据
#[tauri::command]
pub async fn export_data(state: State<'_, AppState>) -> Result<ApiResponse, String> {
    match state.storage.export_data() {
        Ok(data) => Ok(ApiResponse {
            success: true,
            message: Some(data),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 导入数据
#[tauri::command]
pub async fn import_data(state: State<'_, AppState>, data: String) -> Result<ApiResponse, String> {
    match state.storage.import_data(&data) {
        Ok(count) => Ok(ApiResponse {
            success: true,
            message: Some(format!("成功导入 {} 条凭证", count)),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

// ==================== 回忆录相关命令 ====================

/// 保存回忆条目
#[tauri::command]
pub async fn save_memoir(
    state: State<'_, AppState>,
    memoir: Memoir,
) -> Result<ApiResponse, String> {
    match state.storage.save_memoir(&memoir) {
        Ok(_) => Ok(ApiResponse {
            success: true,
            message: Some("回忆已保存".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 获取所有回忆条目
#[tauri::command]
pub async fn get_memoirs(state: State<'_, AppState>) -> Result<MemoirListResponse, String> {
    match state.storage.get_memoirs() {
        Ok(memoirs) => Ok(MemoirListResponse {
            success: true,
            data: Some(memoirs),
            error: None,
        }),
        Err(e) => Ok(MemoirListResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 根据ID获取回忆条目
#[tauri::command]
pub async fn get_memoir_by_id(state: State<'_, AppState>, id: String) -> Result<MemoirListResponse, String> {
    match state.storage.get_memoir_by_id(&id) {
        Ok(Some(memoir)) => Ok(MemoirListResponse {
            success: true,
            data: Some(vec![memoir]),
            error: None,
        }),
        Ok(None) => Ok(MemoirListResponse {
            success: false,
            data: None,
            error: Some("回忆不存在".to_string()),
        }),
        Err(e) => Ok(MemoirListResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 删除回忆条目
#[tauri::command]
pub async fn delete_memoir(state: State<'_, AppState>, id: String) -> Result<ApiResponse, String> {
    match state.storage.delete_memoir(&id) {
        Ok(_) => Ok(ApiResponse {
            success: true,
            message: Some("回忆已删除".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 搜索回忆条目
#[tauri::command]
pub async fn search_memoirs(state: State<'_, AppState>, keyword: String) -> Result<MemoirListResponse, String> {
    match state.storage.search_memoirs(&keyword) {
        Ok(memoirs) => Ok(MemoirListResponse {
            success: true,
            data: Some(memoirs),
            error: None,
        }),
        Err(e) => Ok(MemoirListResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 保存回忆关联
#[tauri::command]
pub async fn save_memoir_link(
    state: State<'_, AppState>,
    link: MemoirLink,
) -> Result<ApiResponse, String> {
    match state.storage.save_memoir_link(&link) {
        Ok(_) => Ok(ApiResponse {
            success: true,
            message: Some("关联已保存".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 获取回忆条目的所有关联
#[tauri::command]
pub async fn get_memoir_links(state: State<'_, AppState>, memoir_id: String) -> Result<MemoirLinkListResponse, String> {
    match state.storage.get_memoir_links(&memoir_id) {
        Ok(links) => Ok(MemoirLinkListResponse {
            success: true,
            data: Some(links),
            error: None,
        }),
        Err(e) => Ok(MemoirLinkListResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 删除回忆关联
#[tauri::command]
pub async fn delete_memoir_link(state: State<'_, AppState>, id: String) -> Result<ApiResponse, String> {
    match state.storage.delete_memoir_link(&id) {
        Ok(_) => Ok(ApiResponse {
            success: true,
            message: Some("关联已删除".to_string()),
            error: None,
        }),
        Err(e) => Ok(ApiResponse {
            success: false,
            message: None,
            error: Some(e.to_string()),
        }),
    }
}

// ==================== AI 相关命令 ====================

/// AI 聊天响应
#[derive(serde::Serialize)]
pub struct AiChatResponse {
    pub success: bool,
    pub content: Option<String>,
    pub error: Option<String>,
}

/// AI 字符串列表响应
#[derive(serde::Serialize)]
pub struct AiStringListResponse {
    pub success: bool,
    pub data: Option<Vec<String>>,
    pub error: Option<String>,
}

/// AI 聊天命令
#[tauri::command]
pub async fn ai_chat(
    config: AiConfig,
    messages: Vec<ChatMessage>,
) -> Result<AiChatResponse, String> {
    let client = AiClient::new(config);
    match client.chat(messages).await {
        Ok(content) => Ok(AiChatResponse {
            success: true,
            content: Some(content),
            error: None,
        }),
        Err(e) => Ok(AiChatResponse {
            success: false,
            content: None,
            error: Some(e.to_string()),
        }),
    }
}

/// 获取回忆录引导对话的 System Prompt
#[tauri::command]
pub async fn get_memoir_prompt() -> Result<String, String> {
    Ok(get_memoir_system_prompt())
}

/// AI 提取标签
#[tauri::command]
pub async fn ai_extract_tags(
    config: AiConfig,
    content: String,
) -> Result<AiStringListResponse, String> {
    let client = AiClient::new(config);
    let prompt = get_extract_tags_prompt(&content);
    let messages = vec![ChatMessage {
        role: "user".to_string(),
        content: prompt,
    }];
    
    match client.chat(messages).await {
        Ok(response) => {
            // 尝试解析 JSON 数组
            match serde_json::from_str::<Vec<String>>(&response) {
                Ok(tags) => Ok(AiStringListResponse {
                    success: true,
                    data: Some(tags),
                    error: None,
                }),
                Err(_) => Ok(AiStringListResponse {
                    success: false,
                    data: None,
                    error: Some("无法解析AI返回的标签".to_string()),
                }),
            }
        }
        Err(e) => Ok(AiStringListResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        }),
    }
}

/// AI 生成摘要
#[tauri::command]
pub async fn ai_generate_summary(
    config: AiConfig,
    content: String,
) -> Result<AiChatResponse, String> {
    let client = AiClient::new(config);
    let prompt = get_summary_prompt(&content);
    let messages = vec![ChatMessage {
        role: "user".to_string(),
        content: prompt,
    }];
    
    match client.chat(messages).await {
        Ok(summary) => Ok(AiChatResponse {
            success: true,
            content: Some(summary),
            error: None,
        }),
        Err(e) => Ok(AiChatResponse {
            success: false,
            content: None,
            error: Some(e.to_string()),
        }),
    }
}

/// AI 分析情感
#[tauri::command]
pub async fn ai_analyze_emotion(
    config: AiConfig,
    content: String,
) -> Result<AiChatResponse, String> {
    let client = AiClient::new(config);
    let prompt = get_emotion_prompt(&content);
    let messages = vec![ChatMessage {
        role: "user".to_string(),
        content: prompt,
    }];
    
    match client.chat(messages).await {
        Ok(emotion) => Ok(AiChatResponse {
            success: true,
            content: Some(emotion),
            error: None,
        }),
        Err(e) => Ok(AiChatResponse {
            success: false,
            content: None,
            error: Some(e.to_string()),
        }),
    }
}
