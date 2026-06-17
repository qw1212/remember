//! 存储模块
//! 
//! 使用SQLite进行数据存储
//! 使用系统Keychain进行密钥存储

use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Error, Debug)]
pub enum StorageError {
    #[error("数据库错误: {0}")]
    DatabaseError(#[from] rusqlite::Error),
    #[error("Keychain错误: {0}")]
    KeychainError(String),
    #[error("数据不存在")]
    NotFound,
    #[error("序列化错误: {0}")]
    SerializationError(#[from] serde_json::Error),
}

/// 凭证数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Credential {
    pub id: String,
    pub title: String,
    pub username: Option<String>,
    pub password: String,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub category: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub is_favorite: bool,
}

/// 回忆条目数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memoir {
    pub id: String,
    pub title: String,
    pub content: String,
    pub summary: Option<String>,
    pub event_date: Option<String>,
    pub location: Option<String>,
    pub people: Vec<String>,
    pub tags: Vec<String>,
    pub category: String,
    pub emotion: Option<String>,
    pub ai_conversation: Option<String>,
    pub is_private: bool,
    pub created_at: String,
    pub updated_at: String,
}

/// 回忆关联数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoirLink {
    pub id: String,
    pub from_id: String,
    pub to_id: String,
    pub relation: Option<String>,
    pub created_at: String,
}

/// 存储管理器
pub struct StorageManager {
    db: Mutex<Option<Connection>>,
    keychain_service: String,
}

impl StorageManager {
    /// 创建新的存储管理器
    pub fn new() -> Self {
        Self {
            db: Mutex::new(None),
            keychain_service: "com.remember.app".to_string(),
        }
    }

    /// 初始化数据库
    pub fn init_database(&self, app_data_dir: &PathBuf) -> Result<(), StorageError> {
        let db_path = app_data_dir.join("remember.db");
        let conn = Connection::open(db_path)?;
        
        // 创建表
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS credentials (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                username TEXT,
                password TEXT NOT NULL,
                url TEXT,
                notes TEXT,
                category TEXT DEFAULT 'general',
                tags TEXT DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_favorite INTEGER DEFAULT 0
            );
            
            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS memoirs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                event_date TEXT,
                location TEXT,
                people TEXT DEFAULT '[]',
                tags TEXT DEFAULT '[]',
                category TEXT DEFAULT 'life',
                emotion TEXT,
                ai_conversation TEXT,
                is_private INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS memoir_links (
                id TEXT PRIMARY KEY,
                from_id TEXT NOT NULL,
                to_id TEXT NOT NULL,
                relation TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (from_id) REFERENCES memoirs(id) ON DELETE CASCADE,
                FOREIGN KEY (to_id) REFERENCES memoirs(id) ON DELETE CASCADE
            );"
        )?;
        
        let mut db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        *db = Some(conn);
        
        Ok(())
    }

    /// 保存凭证
    pub fn save_credential(&self, credential: &Credential) -> Result<(), StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let tags_json = serde_json::to_string(&credential.tags)?;
        
        conn.execute(
            "INSERT OR REPLACE INTO credentials (id, title, username, password, url, notes, category, tags, created_at, updated_at, is_favorite)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                credential.id,
                credential.title,
                credential.username,
                credential.password,
                credential.url,
                credential.notes,
                credential.category,
                tags_json,
                credential.created_at,
                credential.updated_at,
                credential.is_favorite as i32,
            ],
        )?;
        
        Ok(())
    }

    /// 获取所有凭证
    pub fn get_credentials(&self) -> Result<Vec<Credential>, StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, title, username, password, url, notes, category, tags, created_at, updated_at, is_favorite FROM credentials ORDER BY updated_at DESC"
        )?;
        
        let credentials = stmt.query_map([], |row| {
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            
            Ok(Credential {
                id: row.get(0)?,
                title: row.get(1)?,
                username: row.get(2)?,
                password: row.get(3)?,
                url: row.get(4)?,
                notes: row.get(5)?,
                category: row.get(6)?,
                tags,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
                is_favorite: row.get::<_, i32>(10)? != 0,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(credentials)
    }

    /// 删除凭证
    pub fn delete_credential(&self, id: &str) -> Result<(), StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        conn.execute("DELETE FROM credentials WHERE id = ?1", params![id])?;
        
        Ok(())
    }

    /// 更新凭证
    pub fn update_credential(&self, credential: &Credential) -> Result<(), StorageError> {
        self.save_credential(credential)
    }

    /// 保存应用状态
    pub fn set_app_state(&self, key: &str, value: &str) -> Result<(), StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        conn.execute(
            "INSERT OR REPLACE INTO app_state (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        
        Ok(())
    }

    /// 获取应用状态
    pub fn get_app_state(&self, key: &str) -> Result<Option<String>, StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let mut stmt = conn.prepare("SELECT value FROM app_state WHERE key = ?1")?;
        let mut rows = stmt.query_map(params![key], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;
        
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    /// 保存密钥到系统Keychain
    pub fn save_key_to_keychain(&self, key_name: &str, key_data: &[u8]) -> Result<(), StorageError> {
        use base64::Engine;
        let encoded = base64::engine::general_purpose::STANDARD.encode(key_data);
        
        let entry = keyring::Entry::new(&self.keychain_service, key_name)
            .map_err(|e| StorageError::KeychainError(e.to_string()))?;
        
        entry.set_password(&encoded)
            .map_err(|e| StorageError::KeychainError(e.to_string()))?;
        
        Ok(())
    }

    /// 从系统Keychain读取密钥
    pub fn get_key_from_keychain(&self, key_name: &str) -> Result<Option<Vec<u8>>, StorageError> {
        use base64::Engine;
        
        let entry = keyring::Entry::new(&self.keychain_service, key_name)
            .map_err(|e| StorageError::KeychainError(e.to_string()))?;
        
        match entry.get_password() {
            Ok(encoded) => {
                let decoded = base64::engine::general_purpose::STANDARD
                    .decode(&encoded)
                    .map_err(|e| StorageError::KeychainError(e.to_string()))?;
                Ok(Some(decoded))
            }
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(StorageError::KeychainError(e.to_string())),
        }
    }

    /// 从系统Keychain删除密钥
    pub fn delete_key_from_keychain(&self, key_name: &str) -> Result<(), StorageError> {
        let entry = keyring::Entry::new(&self.keychain_service, key_name)
            .map_err(|e| StorageError::KeychainError(e.to_string()))?;
        
        entry.delete_credential()
            .map_err(|e| StorageError::KeychainError(e.to_string()))?;
        
        Ok(())
    }

    /// 导出所有数据
    pub fn export_data(&self) -> Result<String, StorageError> {
        let credentials = self.get_credentials()?;
        let export = serde_json::to_string_pretty(&credentials)?;
        Ok(export)
    }

    /// 导入数据
    pub fn import_data(&self, data: &str) -> Result<usize, StorageError> {
        let credentials: Vec<Credential> = serde_json::from_str(data)?;
        let count = credentials.len();
        
        for credential in credentials {
            self.save_credential(&credential)?;
        }
        
        Ok(count)
    }

    // ==================== 回忆录相关方法 ====================

    /// 保存回忆条目
    pub fn save_memoir(&self, memoir: &Memoir) -> Result<(), StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let people_json = serde_json::to_string(&memoir.people)?;
        let tags_json = serde_json::to_string(&memoir.tags)?;
        
        conn.execute(
            "INSERT OR REPLACE INTO memoirs (id, title, content, summary, event_date, location, people, tags, category, emotion, ai_conversation, is_private, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                memoir.id,
                memoir.title,
                memoir.content,
                memoir.summary,
                memoir.event_date,
                memoir.location,
                people_json,
                tags_json,
                memoir.category,
                memoir.emotion,
                memoir.ai_conversation,
                memoir.is_private as i32,
                memoir.created_at,
                memoir.updated_at,
            ],
        )?;
        
        Ok(())
    }

    /// 获取所有回忆条目
    pub fn get_memoirs(&self) -> Result<Vec<Memoir>, StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, title, content, summary, event_date, location, people, tags, category, emotion, ai_conversation, is_private, created_at, updated_at FROM memoirs ORDER BY created_at DESC"
        )?;
        
        let memoirs = stmt.query_map([], |row| {
            let people_json: String = row.get(6)?;
            let people: Vec<String> = serde_json::from_str(&people_json).unwrap_or_default();
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            
            Ok(Memoir {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                summary: row.get(3)?,
                event_date: row.get(4)?,
                location: row.get(5)?,
                people,
                tags,
                category: row.get(8)?,
                emotion: row.get(9)?,
                ai_conversation: row.get(10)?,
                is_private: row.get::<_, i32>(11)? != 0,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(memoirs)
    }

    /// 根据ID获取回忆条目
    pub fn get_memoir_by_id(&self, id: &str) -> Result<Option<Memoir>, StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, title, content, summary, event_date, location, people, tags, category, emotion, ai_conversation, is_private, created_at, updated_at FROM memoirs WHERE id = ?1"
        )?;
        
        let mut rows = stmt.query_map(params![id], |row| {
            let people_json: String = row.get(6)?;
            let people: Vec<String> = serde_json::from_str(&people_json).unwrap_or_default();
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            
            Ok(Memoir {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                summary: row.get(3)?,
                event_date: row.get(4)?,
                location: row.get(5)?,
                people,
                tags,
                category: row.get(8)?,
                emotion: row.get(9)?,
                ai_conversation: row.get(10)?,
                is_private: row.get::<_, i32>(11)? != 0,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;
        
        match rows.next() {
            Some(row) => Ok(Some(row?)),
            None => Ok(None),
        }
    }

    /// 删除回忆条目
    pub fn delete_memoir(&self, id: &str) -> Result<(), StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        // 先删除关联关系
        conn.execute("DELETE FROM memoir_links WHERE from_id = ?1 OR to_id = ?1", params![id])?;
        // 再删除回忆条目
        conn.execute("DELETE FROM memoirs WHERE id = ?1", params![id])?;
        
        Ok(())
    }

    /// 搜索回忆条目（模糊匹配标题、内容、地点、标签）
    pub fn search_memoirs(&self, keyword: &str) -> Result<Vec<Memoir>, StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let search_pattern = format!("%{}%", keyword);
        
        let mut stmt = conn.prepare(
            "SELECT id, title, content, summary, event_date, location, people, tags, category, emotion, ai_conversation, is_private, created_at, updated_at 
             FROM memoirs 
             WHERE title LIKE ?1 OR content LIKE ?1 OR location LIKE ?1 OR tags LIKE ?1 OR summary LIKE ?1
             ORDER BY created_at DESC"
        )?;
        
        let memoirs = stmt.query_map(params![search_pattern], |row| {
            let people_json: String = row.get(6)?;
            let people: Vec<String> = serde_json::from_str(&people_json).unwrap_or_default();
            let tags_json: String = row.get(7)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            
            Ok(Memoir {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                summary: row.get(3)?,
                event_date: row.get(4)?,
                location: row.get(5)?,
                people,
                tags,
                category: row.get(8)?,
                emotion: row.get(9)?,
                ai_conversation: row.get(10)?,
                is_private: row.get::<_, i32>(11)? != 0,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(memoirs)
    }

    /// 保存回忆关联
    pub fn save_memoir_link(&self, link: &MemoirLink) -> Result<(), StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        conn.execute(
            "INSERT OR REPLACE INTO memoir_links (id, from_id, to_id, relation, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![link.id, link.from_id, link.to_id, link.relation, link.created_at],
        )?;
        
        Ok(())
    }

    /// 获取回忆条目的所有关联
    pub fn get_memoir_links(&self, memoir_id: &str) -> Result<Vec<MemoirLink>, StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        let mut stmt = conn.prepare(
            "SELECT id, from_id, to_id, relation, created_at FROM memoir_links WHERE from_id = ?1 OR to_id = ?1"
        )?;
        
        let links = stmt.query_map(params![memoir_id], |row| {
            Ok(MemoirLink {
                id: row.get(0)?,
                from_id: row.get(1)?,
                to_id: row.get(2)?,
                relation: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;
        
        Ok(links)
    }

    /// 删除回忆关联
    pub fn delete_memoir_link(&self, id: &str) -> Result<(), StorageError> {
        let db = self.db.lock().map_err(|e| StorageError::KeychainError(e.to_string()))?;
        let conn = db.as_ref().ok_or(StorageError::KeychainError("数据库未初始化".to_string()))?;
        
        conn.execute("DELETE FROM memoir_links WHERE id = ?1", params![id])?;
        
        Ok(())
    }
}
