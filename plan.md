# remember 项目实现规划

## 项目概述

**remember** 是一个私密的终身数字保险库，用于存储密码、习惯、知识、梦想、人际关系、遗产等个人重要信息。核心原则是隐私保护和数据主权。

## 边界重新评估

### 需要调整的边界
1. **社交功能** → **有限共享功能**
   - 不是社交网络，但支持家庭密码共享
   - 信任关系管理（家庭成员、遗产执行人）

2. **云依赖** → **可选云备份**
   - 本地优先，但提供可选的加密云备份
   - 用户完全控制是否启用云功能

3. **企业复杂性** → **多设备同步**
   - 保持个人使用简单，但支持基本的多设备访问
   - 通过加密同步实现

### 保持不变的边界
- ❌ 数据商业化（无广告、无数据销售）
- ❌ 不必要的复杂性（无区块链、无加密货币）
- ❌ 强制云依赖（本地优先原则）

## 技术架构

### 部署方案：混合架构
```
┌─────────────────────────────────────────┐
│           用户设备（本地优先）            │
│  ┌─────────────────────────────────┐    │
│  │  Web App / PWA / 桌面应用       │    │
│  │  - SQLite 本地数据库            │    │
│  │  - Web Crypto API 加密          │    │
│  │  - 离线优先架构                  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                    │
                    │ 可选加密同步
                    ▼
┌─────────────────────────────────────────┐
│           云服务（可选）                 │
│  ┌─────────────────────────────────┐    │
│  │  加密备份服务                    │    │
│  │  - 端到端加密                    │    │
│  │  - 零知识架构                    │    │
│  │  - 用户控制密钥                  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 用户访问方式
**第一阶段：Web App + PWA**
- 跨平台访问（Windows、macOS、Linux、iOS、Android）
- 离线支持（Service Worker）
- 安装到主屏幕（PWA）

**后续阶段：**
- 桌面应用（Electron/Tauri）
- 原生移动应用（React Native/Flutter）

## 第一阶段功能（MVP）

### 核心功能
1. **用户认证系统**
   - 主密码设置和登录
   - 密码强度验证
   - 自动锁定功能

2. **数字凭证管理**
   - 添加/编辑/删除密码条目
   - 分类管理（邮箱、社交媒体、金融等）
   - 密码生成器
   - 安全复制到剪贴板

3. **数据加密存储**
   - AES-256-GCM 加密
   - 本地 SQLite 数据库
   - Web Crypto API 实现

4. **基本搜索和分类**
   - 全文搜索
   - 分类筛选
   - 标签系统

5. **数据导出/导入**
   - 加密导出（JSON格式）
   - 导入恢复功能
   - 备份文件管理

### 技术栈选择

**前端框架：Svelte + TypeScript**
- 轻量级，高性能
- 编译时优化， bundle 体积小
- 优秀的开发体验

**构建工具：Vite**
- 快速热重载
- 优化的生产构建
- 原生 ES 模块支持

**本地数据库：sql.js (SQLite WebAssembly)**
- 浏览器中运行 SQLite
- 完整的 SQL 支持
- 数据文件可导出

**加密：Web Crypto API**
- 浏览器原生加密 API
- AES-256-GCM 支持
- 安全密钥管理

**UI 框架：Tailwind CSS**
- 实用优先的 CSS 框架
- 快速 UI 开发
- 响应式设计

**状态管理：Svelte stores**
- 内置状态管理
- 简单易用
- 响应式更新

## 数据库设计

### 本地 SQLite 数据库结构

```sql
-- 用户主表
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 密码条目表
CREATE TABLE credentials (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    username TEXT,
    password_encrypted TEXT NOT NULL,
    url TEXT,
    category TEXT,
    notes_encrypted TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 分类表
CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    icon TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 标签表
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 条目标签关联表
CREATE TABLE credential_tags (
    credential_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (credential_id, tag_id),
    FOREIGN KEY (credential_id) REFERENCES credentials(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### 数据加密方案
- **主密码**：PBKDF2 派生加密密钥
- **敏感数据**：AES-256-GCM 加密
- **密钥存储**：内存中，不持久化
- **导出文件**：整体加密，包含盐值和IV

## 安全设计

### 加密流程
1. 用户设置主密码
2. 使用 PBKDF2 从主密码派生加密密钥
3. 敏感数据使用 AES-256-GCM 加密
4. 加密数据存储在本地 SQLite
5. 导出时整体加密备份文件

### 安全特性
- **零知识架构**：服务器无法访问用户数据
- **本地优先**：数据默认不离开设备
- **自动锁定**：闲置后自动锁定
- **安全剪贴板**：复制后自动清除
- **内存保护**：敏感数据使用后清除

## 部署方案

### 第一阶段：静态托管
**推荐平台：**
- **Vercel**：免费、快速、自动部署
- **Netlify**：免费、易用、CDN加速
- **GitHub Pages**：免费、与GitHub集成

**部署步骤：**
1. 代码推送到 GitHub
2. 连接 Vercel/Netlify
3. 自动构建和部署
4. 自定义域名（可选）

**成本：完全免费**
- 静态托管免费
- 无服务器成本
- 无数据库成本

### 后续阶段：可选云服务
如果需要云备份功能：
- **云存储**：AWS S3 / Google Cloud Storage（用户自己的账号）
- **加密**：客户端加密后上传
- **同步**：可选的端到端加密同步

## 实现阶段

### 第一阶段：MVP（4-6周）
**周1-2：基础架构**
- 项目初始化（Svelte + Vite + TypeScript）
- 数据库设计和初始化
- 加密工具库开发
- 基础UI组件

**周3-4：核心功能**
- 用户认证系统
- 密码条目CRUD
- 分类和搜索功能
- 数据导出/导入

**周5-6：完善和测试**
- UI/UX优化
- 安全测试
- 性能优化
- 文档编写

### 第二阶段：功能扩展（4-6周）
- 习惯追踪功能
- 知识库功能
- 思想日记功能
- 梦想清单功能

### 第三阶段：高级功能（4-6周）
- 数字遗产功能
- 资产管理功能
- 经验库功能
- 高级搜索和标签

### 第四阶段：平台扩展（6-8周）
- 桌面应用（Electron/Tauri）
- 移动应用（React Native/Flutter）
- 可选云备份功能

## 技术实现细节

### 项目结构
```
remember/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte组件
│   │   ├── stores/         # 状态管理
│   │   ├── utils/          # 工具函数
│   │   ├── crypto.ts       # 加密工具
│   │   ├── database.ts     # 数据库操作
│   │   └── types.ts        # TypeScript类型
│   ├── routes/             # 页面路由
│   ├── app.html            # HTML模板
│   └── app.css             # 全局样式
├── static/                 # 静态资源
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

### 关键代码示例

**加密工具：**
```typescript
// src/lib/crypto.ts
export class CryptoManager {
    private key: CryptoKey | null = null;
    
    async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        // PBKDF2 密钥派生
    }
    
    async encrypt(data: string): Promise<string> {
        // AES-256-GCM 加密
    }
    
    async decrypt(encryptedData: string): Promise<string> {
        // AES-256-GCM 解密
    }
}
```

**数据库操作：**
```typescript
// src/lib/database.ts
export class DatabaseManager {
    private db: Database;
    
    async init(): Promise<void> {
        // 初始化 SQLite 数据库
    }
    
    async addCredential(credential: Credential): Promise<void> {
        // 添加密码条目
    }
    
    async searchCredentials(query: string): Promise<Credential[]> {
        // 搜索密码条目
    }
}
```

## 成本分析

### 第一阶段成本：完全免费
- **开发工具**：VS Code（免费）
- **托管平台**：Vercel/Netlify（免费）
- **域名**：可选（约$10/年）
- **云服务**：无

### 后续阶段成本
- **云备份**：如果用户选择云备份，使用自己的云存储账号
- **域名**：可选
- **高级功能**：无额外成本

## 风险评估

### 技术风险
1. **浏览器兼容性**：Web Crypto API 支持度
2. **性能问题**：大量数据时的性能
3. **数据丢失**：用户忘记主密码

### 解决方案
1. **渐进增强**：提供降级方案
2. **分页加载**：优化大数据集处理
3. **恢复机制**：提供密码提示和恢复选项

## 成功指标

### 第一阶段目标
- 完成核心密码管理功能
- 实现本地加密存储
- 部署可用的Web应用
- 获得初始用户反馈

### 长期目标
- 成为个人数据管理的标准工具
- 建立活跃的用户社区
- 实现可持续的开源项目

## 总结

**remember** 项目采用本地优先、隐私保护的设计理念，通过现代Web技术实现安全、易用的个人数据管理工具。第一阶段专注于核心密码管理功能，采用完全免费的部署方案，确保项目的可访问性和可持续性。

关键优势：
1. **隐私优先**：数据完全由用户控制
2. **零成本**：第一阶段完全免费
3. **跨平台**：Web App支持所有平台
4. **可扩展**：模块化设计支持功能扩展
5. **开源**：透明、可审计、社区驱动