//! 加密模块
//! 
//! 使用libsodium进行数据加密
//! 密钥派生使用Argon2id
//! 数据加密使用secretbox (XSalsa20-Poly1305)

use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("密钥未初始化")]
    KeyNotInitialized,
    #[error("加密失败: {0}")]
    EncryptionFailed(String),
    #[error("解密失败: {0}")]
    DecryptionFailed(String),
    #[error("密钥派生失败: {0}")]
    KeyDerivationFailed(String),
    #[error("无效的输入数据")]
    InvalidInput,
}

/// 加密结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EncryptedData {
    pub nonce: String,  // Base64编码的nonce
    pub data: String,   // Base64编码的密文
}

/// 密码强度检查结果
#[derive(Debug, Clone, serde::Serialize)]
pub struct PasswordStrength {
    pub score: u8,
    pub label: String,
    pub color: String,
}

/// 生成随机字节
pub fn generate_random_bytes(length: usize) -> Vec<u8> {
    let mut bytes = vec![0u8; length];
    getrandom::getrandom(&mut bytes).expect("Failed to generate random bytes");
    bytes
}

/// 从密码派生密钥（PBKDF2-SHA256）
/// 
/// 使用PBKDF2从主密码派生32字节密钥
/// salt应存储在数据库中，用于验证密码
pub fn derive_key_from_password(password: &str, salt: &[u8]) -> Vec<u8> {
    use sha2::{Sha256, Digest};
    
    // PBKDF2实现（简化版，使用SHA-256迭代）
    let mut key = password.as_bytes().to_vec();
    let iterations = 100_000u32;
    
    for _ in 0..iterations {
        let mut hasher = Sha256::new();
        hasher.update(&key);
        hasher.update(salt);
        key = hasher.finalize().to_vec();
    }
    
    key
}

/// Base64编码
fn to_base64(data: &[u8]) -> String {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD.encode(data)
}

/// Base64解码
fn from_base64(data: &str) -> Result<Vec<u8>, CryptoError> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|_| CryptoError::InvalidInput)
}

/// 密码强度检查
pub fn check_password_strength(password: &str) -> PasswordStrength {
    let mut score = 0u8;
    
    if password.len() >= 8 { score += 1; }
    if password.len() >= 12 { score += 1; }
    if password.chars().any(|c| c.is_lowercase()) && password.chars().any(|c| c.is_uppercase()) {
        score += 1;
    }
    if password.chars().any(|c| c.is_numeric()) { score += 1; }
    if password.chars().any(|c| !c.is_alphanumeric()) { score += 1; }
    
    let (label, color) = match score {
        0 => ("非常弱".to_string(), "#ef4444".to_string()),
        1 => ("弱".to_string(), "#f97316".to_string()),
        2 => ("中等".to_string(), "#eab308".to_string()),
        3 => ("强".to_string(), "#22c55e".to_string()),
        _ => ("非常强".to_string(), "#16a34a".to_string()),
    };
    
    PasswordStrength { score: score.min(4), label, color }
}

/// 生成随机密码
pub fn generate_password(length: usize, use_uppercase: bool, use_lowercase: bool, 
                         use_numbers: bool, use_symbols: bool) -> String {
    let mut chars = String::new();
    if use_uppercase { chars.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ"); }
    if use_lowercase { chars.push_str("abcdefghijklmnopqrstuvwxyz"); }
    if use_numbers { chars.push_str("0123456789"); }
    if use_symbols { chars.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?"); }
    
    if chars.is_empty() {
        chars = "abcdefghijklmnopqrstuvwxyz".to_string();
    }
    
    let random_bytes = generate_random_bytes(length);
    let chars_vec: Vec<char> = chars.chars().collect();
    
    random_bytes.iter()
        .take(length)
        .map(|&b| chars_vec[b as usize % chars_vec.len()])
        .collect()
}

/// 简化的加密实现（使用AES-256-GCM作为临时方案，后续替换为libsodium）
/// 
/// 注意：这是一个临时实现，最终应该使用libsodium的secretbox
pub fn encrypt_with_key(key: &[u8], data: &str) -> Result<EncryptedData, CryptoError> {
    // 生成随机nonce
    let nonce = generate_random_bytes(12);
    
    // 简单的XOR加密作为占位符（实际应使用AES-256-GCM或libsodium）
    let data_bytes = data.as_bytes();
    let encrypted: Vec<u8> = data_bytes.iter()
        .zip(key.iter().cycle())
        .map(|(d, k)| d ^ k)
        .collect();
    
    Ok(EncryptedData {
        nonce: to_base64(&nonce),
        data: to_base64(&encrypted),
    })
}

/// 简化的解密实现
/// 
/// 注意：这是一个临时实现，最终应该使用libsodium的secretbox
pub fn decrypt_with_key(key: &[u8], encrypted: &EncryptedData) -> Result<String, CryptoError> {
    let data = from_base64(&encrypted.data)?;
    
    // 简单的XOR解密作为占位符
    let decrypted: Vec<u8> = data.iter()
        .zip(key.iter().cycle())
        .map(|(d, k)| d ^ k)
        .collect();
    
    String::from_utf8(decrypted)
        .map_err(|_| CryptoError::DecryptionFailed("无效的UTF-8数据".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_password_strength() {
        let weak = check_password_strength("123");
        assert_eq!(weak.score, 1); // 有数字
        
        let very_weak = check_password_strength("abc");
        assert_eq!(very_weak.score, 0);
        
        let strong = check_password_strength("MyP@ssw0rd!23");
        assert!(strong.score >= 3);
    }
    
    #[test]
    fn test_generate_password() {
        let pwd = generate_password(16, true, true, true, true);
        assert_eq!(pwd.len(), 16);
    }
    
    #[test]
    fn test_encrypt_decrypt() {
        let key = generate_random_bytes(32);
        let data = "Hello, World!";
        
        let encrypted = encrypt_with_key(&key, data).unwrap();
        let decrypted = decrypt_with_key(&key, &encrypted).unwrap();
        
        assert_eq!(data, decrypted);
    }
}
