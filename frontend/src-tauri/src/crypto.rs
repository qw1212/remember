//! 加密模块
//! 
//! 使用 ChaCha20-Poly1305 进行数据加密（AEAD）
//! 密钥派生使用 PBKDF2-HMAC-SHA256

use thiserror::Error;
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};


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

/// HMAC-SHA256 实现
fn hmac_sha256(key: &[u8], data: &[u8]) -> [u8; 32] {
    use sha2::{Sha256, Digest};
    
    // 如果 key 长度大于块大小（64字节），先哈希
    let key_block = if key.len() > 64 {
        Sha256::digest(key).to_vec()
    } else {
        key.to_vec()
    };
    
    // 创建 ipad 和 opad
    let mut ipad = [0x36u8; 64];
    let mut opad = [0x5cu8; 64];
    
    for (i, &k) in key_block.iter().enumerate() {
        ipad[i] ^= k;
        opad[i] ^= k;
    }
    
    // 内层哈希
    let mut inner = Sha256::new();
    inner.update(&ipad);
    inner.update(data);
    let inner_result = inner.finalize();
    
    // 外层哈希
    let mut outer = Sha256::new();
    outer.update(&opad);
    outer.update(&inner_result);
    let result = outer.finalize();
    
    result.into()
}

/// 从密码派生密钥（PBKDF2-HMAC-SHA256）
/// 
/// 使用标准 PBKDF2 算法从主密码派生 32 字节密钥
/// salt 应存储在数据库中
pub fn derive_key_from_password(password: &str, salt: &[u8]) -> Vec<u8> {
    let iterations = 100_000u32;
    let dk_len = 32; // 目标密钥长度
    let h_len = 32;  // SHA-256 输出长度
    
    // 计算需要的块数
    let blocks = (dk_len + h_len - 1) / h_len;
    let mut derived_key = Vec::with_capacity(dk_len);
    
    for block in 1..=blocks {
        // U_1 = HMAC(password, salt || INT(block))
        let mut data = salt.to_vec();
        data.extend_from_slice(&(block as u32).to_be_bytes());
        
        let mut u = hmac_sha256(password.as_bytes(), &data);
        let mut result = u;
        
        // U_2 到 U_c
        for _ in 1..iterations {
            u = hmac_sha256(password.as_bytes(), &u);
            for i in 0..h_len {
                result[i] ^= u[i];
            }
        }
        
        derived_key.extend_from_slice(&result);
    }
    
    derived_key.truncate(dk_len);
    derived_key
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

/// 加密数据（使用 ChaCha20-Poly1305 AEAD）
/// 
/// key 必须是 32 字节
/// nonce 自动生成并附加到密文
pub fn encrypt_with_key(key: &[u8], data: &str) -> Result<EncryptedData, CryptoError> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidInput);
    }
    
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;
    
    // 生成随机 12 字节 nonce
    let nonce_bytes = generate_random_bytes(12);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    // 加密（密文包含认证标签）
    let ciphertext = cipher.encrypt(nonce, data.as_bytes())
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;
    
    // 将 nonce 和密文拼接后 Base64 编码
    let mut combined = nonce_bytes.clone();
    combined.extend_from_slice(&ciphertext);
    
    Ok(EncryptedData {
        nonce: to_base64(&nonce_bytes),
        data: to_base64(&combined),
    })
}

/// 解密数据（使用 ChaCha20-Poly1305 AEAD）
/// 
/// 从 data 中提取 nonce 和密文进行解密
pub fn decrypt_with_key(key: &[u8], encrypted: &EncryptedData) -> Result<String, CryptoError> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidInput);
    }
    
    let combined = from_base64(&encrypted.data)?;
    
    // 前 12 字节是 nonce，其余是密文
    if combined.len() < 12 {
        return Err(CryptoError::InvalidInput);
    }
    
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;
    
    // 解密并验证认证标签
    let plaintext = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;
    
    String::from_utf8(plaintext)
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
    
    #[test]
    fn test_pbkdf2_deterministic() {
        let password = "test_password";
        let salt = b"test_salt";
        
        let key1 = derive_key_from_password(password, salt);
        let key2 = derive_key_from_password(password, salt);
        
        assert_eq!(key1, key2, "PBKDF2 should be deterministic");
        assert_eq!(key1.len(), 32, "Derived key should be 32 bytes");
    }
    
    #[test]
    fn test_pbkdf2_different_inputs() {
        let salt = b"test_salt";
        
        let key1 = derive_key_from_password("password1", salt);
        let key2 = derive_key_from_password("password2", salt);
        
        assert_ne!(key1, key2, "Different passwords should produce different keys");
    }
    
    #[test]
    fn test_encrypt_wrong_key() {
        let key1 = generate_random_bytes(32);
        let key2 = generate_random_bytes(32);
        let data = "Secret data";
        
        let encrypted = encrypt_with_key(&key1, data).unwrap();
        let result = decrypt_with_key(&key2, &encrypted);
        
        assert!(result.is_err(), "Decryption with wrong key should fail");
    }
}
