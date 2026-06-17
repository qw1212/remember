//! AI 模块
//!
//! 支持 Ollama 和 OpenAI 两种后端，用于回忆录的 AI 对话、标签提取、摘要生成和情感分析

use serde::{Deserialize, Serialize};
use thiserror::Error;
use reqwest::Url;

#[derive(Error, Debug)]
pub enum AiError {
    #[error("HTTP请求失败: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("JSON解析失败: {0}")]
    JsonError(#[from] serde_json::Error),
    #[error("AI响应为空")]
    EmptyResponse,
    #[error("配置错误: {0}")]
    ConfigError(String),
}

/// AI 配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConfig {
    pub provider: String,        // "ollama" | "openai"
    pub api_url: String,         // Ollama: http://localhost:11434, OpenAI: https://api.openai.com
    pub api_key: Option<String>, // OpenAI API Key
    pub model: String,           // 模型名称
}

/// 聊天消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,    // "system" | "user" | "assistant"
    pub content: String,
}

/// 聊天响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub content: String,
}

/// Ollama API 请求结构
#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    messages: Vec<OllamaMessage>,
    stream: bool,
}

#[derive(Serialize, Deserialize)]
struct OllamaMessage {
    role: String,
    content: String,
}

/// Ollama API 响应结构
#[derive(Deserialize)]
struct OllamaResponse {
    message: OllamaMessage,
}

/// OpenAI API 请求结构
#[derive(Serialize)]
struct OpenAiRequest {
    model: String,
    messages: Vec<OpenAiMessage>,
    stream: bool,
}

#[derive(Serialize, Deserialize)]
struct OpenAiMessage {
    role: String,
    content: String,
}

/// OpenAI API 响应结构
#[derive(Deserialize)]
struct OpenAiResponse {
    choices: Vec<OpenAiChoice>,
}

#[derive(Deserialize)]
struct OpenAiChoice {
    message: OpenAiMessage,
}

/// AI 客户端
pub struct AiClient {
    config: AiConfig,
    client: reqwest::Client,
}

impl AiClient {
    /// 创建新的 AI 客户端
    pub fn new(config: AiConfig) -> Self {
        Self {
            config,
            client: reqwest::Client::new(),
        }
    }

    /// 发送聊天请求
    pub async fn chat(&self, messages: Vec<ChatMessage>) -> Result<String, AiError> {
        match self.config.provider.as_str() {
            "ollama" => self.chat_ollama(messages).await,
            "openai" => self.chat_openai(messages).await,
            _ => Err(AiError::ConfigError(format!(
                "不支持的AI提供商: {}",
                self.config.provider
            ))),
        }
    }

    /// Ollama 聊天请求
    async fn chat_ollama(&self, messages: Vec<ChatMessage>) -> Result<String, AiError> {
        let ollama_messages: Vec<OllamaMessage> = messages
            .into_iter()
            .map(|m| OllamaMessage {
                role: m.role,
                content: m.content,
            })
            .collect();

        let request = OllamaRequest {
            model: self.config.model.clone(),
            messages: ollama_messages,
            stream: false,
        };

        let base_url = Url::parse(&self.config.api_url)
            .map_err(|e| AiError::ConfigError(format!("无效的API URL: {}", e)))?;
        let url = base_url.join("api/chat")
            .map_err(|e| AiError::ConfigError(format!("URL拼接失败: {}", e)))?;

        let response = self
            .client
            .post(url)
            .json(&request)
            .send()
            .await?;

        let ollama_response: OllamaResponse = response.json().await?;

        if ollama_response.message.content.is_empty() {
            return Err(AiError::EmptyResponse);
        }

        Ok(ollama_response.message.content)
    }

    /// OpenAI 聊天请求
    async fn chat_openai(&self, messages: Vec<ChatMessage>) -> Result<String, AiError> {
        let api_key = self
            .config
            .api_key
            .as_ref()
            .ok_or(AiError::ConfigError("OpenAI需要API Key".to_string()))?;

        let openai_messages: Vec<OpenAiMessage> = messages
            .into_iter()
            .map(|m| OpenAiMessage {
                role: m.role,
                content: m.content,
            })
            .collect();

        let request = OpenAiRequest {
            model: self.config.model.clone(),
            messages: openai_messages,
            stream: false,
        };

        let base_url = Url::parse(&self.config.api_url)
            .map_err(|e| AiError::ConfigError(format!("无效的API URL: {}", e)))?;
        let url = base_url.join("v1/chat/completions")
            .map_err(|e| AiError::ConfigError(format!("URL拼接失败: {}", e)))?;

        let response = self
            .client
            .post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&request)
            .send()
            .await?;

        let openai_response: OpenAiResponse = response.json().await?;

        let content = openai_response
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or(AiError::EmptyResponse)?;

        if content.is_empty() {
            return Err(AiError::EmptyResponse);
        }

        Ok(content)
    }
}

/// 回忆录引导 System Prompt
pub fn get_memoir_system_prompt() -> String {
    r#"你是一个温暖的回忆记录助手。你的任务是通过对话帮助用户记录珍贵的人生回忆。

引导规则：
1. 用温暖、好奇的语气提问，让用户感到被倾听
2. 逐步追问细节：什么时候？在哪里？和谁一起？
3. 关注感受和意义：这件事让你有什么感受？对你意味着什么？
4. 适时总结确认，让用户补充或修正
5. 当用户说"保存"或"记录下来"时，整理成结构化的回忆条目

输出格式（当用户确认记录时，输出JSON）：
```json
{
  "title": "回忆标题",
  "content": "整理后的回忆正文（Markdown格式）",
  "summary": "一句话摘要",
  "event_date": "时间（可以模糊，如2020年夏天）",
  "location": "地点",
  "people": ["人物1", "人物2"],
  "tags": ["标签1", "标签2"],
  "category": "分类（travel/family/work/growth/milestone/daily/life）",
  "emotion": "主要情感"
}
```

注意：
- 如果用户没有提到某些信息，对应字段可以为空或null
- category 必须是以下之一：travel/family/work/growth/milestone/daily/life
- 用中文回复"#
        .to_string()
}

/// 标签提取 Prompt
pub fn get_extract_tags_prompt(content: &str) -> String {
    format!(
        r#"请从以下回忆内容中提取5-10个关键标签，包括人物、地点、情感、主题等。

回忆内容：
{content}

请直接输出JSON数组格式，不要其他文字：
["标签1", "标签2", "标签3"]"#
    )
}

/// 摘要生成 Prompt
pub fn get_summary_prompt(content: &str) -> String {
    format!(
        r#"请为以下回忆内容生成一句简洁的摘要（不超过50字）。

回忆内容：
{content}

请直接输出摘要文字，不要其他内容。"#
    )
}

/// 情感分析 Prompt
pub fn get_emotion_prompt(content: &str) -> String {
    format!(
        r#"请分析以下回忆内容的主要情感，从以下选项中选择一个最匹配的：
开心、感动、怀念、成长、感恩、遗憾、温暖、激动、平静、忧伤

回忆内容：
{content}

请直接输出情感词语，不要其他内容。"#
    )
}
