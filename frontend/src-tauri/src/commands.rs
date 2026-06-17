//! Tauri IPC命令模块
//! 
//! 定义前端可以调用的所有命令

use tauri::State;
use std::sync::Arc;
use crate::crypto::{EncryptedData};
use crate::storage::{StorageManager, Credential};
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
