# remember 项目实现规划

> 详细的项目愿景和功能说明请参考 [README_CN.md](./README_CN.md)

## 技术架构

### 最终技术栈

| 组件 | 技术选择 | 选择理由 |
|------|----------|----------|
| **前端框架** | Svelte + TypeScript | 编译时框架，运行时代码量少，攻击面小 |
| **桌面框架** | Tauri（Rust后端） | 内存安全，系统WebView攻击面小 |
| **核心加密** | Rust 原生 libsodium | 高层安全封装，Argon2id算法，避开JS环境风险 |
| **敏感数据存储** | 系统Keychain/钥匙串 | 硬件安全，密钥不进入JS内存 |
| **普通数据存储** | SQLite + SQLCipher | 本地文件加密，Rust侧管理 |
| **构建工具** | Vite | 快速构建，HMR支持 |
| **UI 框架** | Tailwind CSS | 原子化CSS，易于维护 |

### 安全架构

```
前端（Svelte）→ 仅UI交互，不处理加密
        │
        ▼
Tauri后端（Rust）→ 核心加密、密钥管理
        │
        ├── libsodium加密（Argon2id + secretbox）
        └── 系统Keychain存储（硬件安全）
```

## 项目结构

```
remember/
├── frontend/                    # 前端 + Tauri项目
│   ├── src/                     # Svelte前端代码
│   │   ├── lib/
│   │   │   ├── api.ts          # Tauri IPC API封装
│   │   │   ├── utils.ts        # 工具函数
│   │   │   ├── components/     # Svelte组件
│   │   │   │   └── Login.svelte
│   │   │   └── __tests__/      # 测试文件
│   │   │       ├── utils.test.ts
│   │   │       └── api.test.ts
│   │   ├── App.svelte          # 主应用
│   │   ├── main.ts             # 入口
│   │   └── app.css             # 全局样式
│   ├── src-tauri/              # Rust后端代码
│   │   ├── src/
│   │   │   ├── main.rs        # 主入口
│   │   │   ├── lib.rs         # 模块导出
│   │   │   ├── crypto.rs      # 加密模块
│   │   │   ├── storage.rs     # 存储模块
│   │   │   └── commands.rs    # IPC命令
│   │   ├── Cargo.toml         # Rust依赖
│   │   ├── build.rs           # 构建脚本
│   │   └── tauri.conf.json    # Tauri配置
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts       # 测试配置
│   └── tsconfig.json
├── docs/                        # 文档
│   ├── security.md             # 安全架构文档
│   └── desktop-app.md          # 桌面应用指南
├── README.md                   # 英文说明
├── README_CN.md                # 中文说明
└── plan.md                     # 本文件
```

## 实现阶段

### 第一阶段：MVP（已完成）
- [x] 项目初始化（Svelte + Tauri + TypeScript）
- [x] Rust后端架构搭建
- [x] 加密模块（crypto.rs）- PBKDF2-SHA256密钥派生 + XOR加密
- [x] 存储模块（storage.rs）- SQLite + Keychain
- [x] IPC命令接口（commands.rs）
- [x] 前端API封装（api.ts）
- [x] 前端工具函数（utils.ts）
- [x] 登录组件（Login.svelte）
- [x] 主应用框架（App.svelte）
- [x] 修复：添加lib.rs解决Cargo编译问题
- [x] 前端测试框架搭建（vitest）
- [x] 前端单元测试（25个测试全部通过）

### 第二阶段：核心功能（进行中）
- [x] 完善加密模块（PBKDF2-SHA256密钥派生，密码验证）
- [x] 修复Rust编译环境（tauri.conf.json配置、async命令返回类型）
- [x] 清理旧React代码残留
- [ ] 密码管理UI组件
- [ ] 凭证CRUD功能
- [ ] 密码生成器UI
- [ ] 搜索和分类

### 第三阶段：AI 回忆录工具
> 让用户通过 AI 对话的方式记录、整理和回忆人生经历，打造个人专属的人生故事库。

#### 功能设计

**核心理念**：AI 作为"回忆引导者"，通过对话帮助用户挖掘、记录和组织珍贵的人生回忆。

**用户使用流程**：
1. 用户点击"回忆录"Tab，进入 AI 对话界面
2. AI 主动发起引导对话（如："今天想聊聊什么？可以是一次旅行、一个人、或者一段难忘的经历"）
3. 用户输入回忆片段，AI 追问细节引导深入（时间、地点、人物、感受）
4. AI 自动整理成结构化的回忆条目，提取标签和分类
5. 回忆条目保存到本地数据库，可在时间线中浏览和搜索

#### 功能模块

| 模块 | 功能说明 | 优先级 |
|------|----------|--------|
| **回忆条目管理** | 创建/编辑/删除回忆条目，支持标题、正文、时间、地点、人物、标签 | P0 |
| **AI 对话引导** | 通过对话方式引导用户回忆细节，追问时间/地点/人物/感受 | P0 |
| **自动标签分类** | AI 自动为回忆提取标签（人物、地点、情感、主题）和分类 | P0 |
| **时间线视图** | 按时间轴展示所有回忆，支持按年/月/日筛选 | P1 |
| **智能搜索** | 自然语言搜索（如"那年夏天在海边的事"） | P1 |
| **回忆摘要** | AI 为每条回忆生成一句话摘要 | P1 |
| **情感分析** | AI 分析回忆的情感倾向（开心/感动/怀念/成长等） | P2 |
| **回忆关联** | AI 发现不同回忆之间的关联，自动建立链接 | P2 |
| **人生故事生成** | AI 将多条回忆串联生成完整的人生故事篇章 | P2 |

#### 数据模型

**memoirs 表**：
```sql
CREATE TABLE memoirs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,           -- 回忆正文（Markdown）
    summary TEXT,                    -- AI 生成的一句话摘要
    event_date TEXT,                 -- 回忆发生的时间（可模糊，如"2020年夏天"）
    location TEXT,                   -- 地点
    people TEXT DEFAULT '[]',        -- 相关人物（JSON数组）
    tags TEXT DEFAULT '[]',          -- 标签（JSON数组）
    category TEXT DEFAULT 'life',    -- 分类：travel/family/work/growth/milestone/daily/life
    emotion TEXT,                    -- AI 分析的情感
    ai_conversation TEXT,            -- AI 对话记录（JSON）
    is_private INTEGER DEFAULT 1,    -- 是否私密
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

**memoir_links 表**（回忆关联）：
```sql
CREATE TABLE memoir_links (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,           -- 关联来源回忆ID
    to_id TEXT NOT NULL,             -- 关联目标回忆ID
    relation TEXT,                   -- 关联描述
    created_at TEXT NOT NULL
);
```

#### AI 集成方案

**方案选择**：支持多种 AI 后端，用户可在设置中配置

| 方案 | 说明 | 优势 | 劣势 |
|------|------|------|------|
| **本地模型（Ollama）** | 通过 Ollama 调用本地 LLM（如 Qwen2、Llama3） | 完全离线，隐私安全 | 需要安装 Ollama，对硬件有要求 |
| **云端 API（OpenAI）** | 调用 OpenAI/兼容 API | 效果最好，无需本地资源 | 需要 API Key，数据经过网络 |

**推荐策略**：默认使用 Ollama 本地模型，可选配置云端 API 作为增强。

**Rust 端 AI 调用**：
```rust
// 新增 ai.rs 模块
pub struct AiConfig {
    pub provider: String,        // "ollama" | "openai"
    pub api_url: String,         // Ollama: http://localhost:11434, OpenAI: https://api.openai.com
    pub api_key: Option<String>, // OpenAI API Key
    pub model: String,           // 模型名称
}

// AI 核心命令
#[tauri::command]
async fn ai_chat(config: AiConfig, messages: Vec<ChatMessage>) -> Result<String, String>

#[tauri::command]
async fn ai_extract_tags(config: AiConfig, content: String) -> Result<Vec<String>, String>

#[tauri::command]
async fn ai_generate_summary(config: AiConfig, content: String) -> Result<String, String>

#[tauri::command]
async fn ai_analyze_emotion(config: AiConfig, content: String) -> Result<String, String>
```

#### 前端组件规划

```
src/lib/components/
├── memoir/
│   ├── MemoirPanel.svelte       # 回忆录主面板（对话 + 列表切换）
│   ├── AiChat.svelte            # AI 对话界面
│   ├── MemoirList.svelte        # 回忆列表/时间线
│   ├── MemoirCard.svelte        # 回忆卡片
│   ├── MemoirEditor.svelte      # 回忆编辑器
│   ├── MemoirSearch.svelte      # 智能搜索
│   └── MemoirTimeline.svelte    # 时间线视图
```

#### 实施步骤

**步骤 1：数据层（Rust 后端）** ✅
- [x] 在 storage.rs 中添加 memoirs 和 memoir_links 表
- [x] 实现回忆条目的 CRUD 命令
- [x] 添加搜索命令（支持模糊匹配）

**步骤 2：AI 模块（Rust 后端）** ✅
- [x] 新建 ai.rs 模块，实现 Ollama/OpenAI HTTP 调用
- [x] 实现 ai_chat、ai_extract_tags、ai_generate_summary、ai_analyze_emotion 命令
- [x] 在 settings 中添加 AI 配置管理

**步骤 3：前端基础组件** ✅
- [x] 在 App.svelte 中添加"回忆录"Tab
- [x] 实现 MemoirPanel 主面板
- [x] 实现 MemoirList 和 MemoirCard 组件

**步骤 4：AI 对话界面** ✅
- [x] 实现 AiChat 对话组件（流式显示）
- [x] 设计 System Prompt（回忆引导提示词）
- [x] 对话结束后自动生成回忆条目

**步骤 5：高级功能** ✅
- [x] 时间线视图
- [x] 智能搜索
- [x] 回忆关联
- [x] 情感分析展示

#### System Prompt 设计示例

```
你是一个温暖的回忆记录助手。你的任务是通过对话帮助用户记录珍贵的人生回忆。

引导规则：
1. 用温暖、好奇的语气提问，让用户感到被倾听
2. 逐步追问细节：什么时候？在哪里？和谁一起？
3. 关注感受和意义：这件事让你有什么感受？对你意味着什么？
4. 适时总结确认，让用户补充或修正
5. 对话结束时，整理成结构化的回忆条目

输出格式（当用户确认记录时）：
{
  "title": "回忆标题",
  "content": "整理后的回忆正文",
  "summary": "一句话摘要",
  "event_date": "时间",
  "location": "地点",
  "people": ["人物1", "人物2"],
  "tags": ["标签1", "标签2"],
  "category": "分类",
  "emotion": "情感"
}
```

### 第四阶段：功能扩展
- [ ] 习惯追踪模块
- [ ] 知识库模块
- [ ] 思想日记模块
- [ ] 梦想清单模块

### 第五阶段：高级功能
- [ ] 数字遗产功能
- [ ] 资产管理功能
- [ ] 经验库功能

### 第六阶段：平台扩展
- [ ] 移动端应用
- [ ] 数据同步功能
- [ ] 可选云备份

## 已知问题

### Rust编译环境（已解决）
- **问题**：Windows环境下`cargo check/test`失败
- **解决方案**：修复tauri.conf.json配置（移除无效的`title`字段）、修复async命令返回类型（必须返回`Result`）、添加缺失的`use tauri::Manager`
- **状态**：✅ 已解决

### 旧代码残留（已解决）
- 根目录`src/`下的旧React代码已全部清理
- **状态**：✅ 已解决

### 加密实现
- 当前使用PBKDF2-SHA256进行密钥派生（100,000次迭代）
- 数据加密使用XOR占位符（待替换为libsodium secretbox）
- **状态**：密钥派生已实现，数据加密待升级

### 测试状态
- 前端单元测试：✅ 25个测试全部通过
- svelte-check：✅ 0 errors, 0 warnings
- 前端构建：✅ 成功
- Rust编译：✅ 成功
- Rust测试：✅ 3个测试全部通过

## 开发指南

### 环境要求
- Node.js 18+
- Rust 1.70+
- Visual Studio Build Tools（Windows）

### 运行开发模式
```bash
cd frontend
npm install
npx tauri dev
```

### 构建生产版本
```bash
cd frontend
npx tauri build
```

## 相关文档

- [README_CN.md](./README_CN.md) - 中文项目说明
- [README.md](./README.md) - 英文项目说明
- [docs/security.md](./docs/security.md) - 安全架构文档
- [docs/desktop-app.md](./docs/desktop-app.md) - 桌面应用打包指南
