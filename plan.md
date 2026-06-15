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

**前端框架：React + TypeScript**
- 生态成熟，社区庞大
- 组件库丰富（shadcn/ui、Ant Design）
- 对新手开发者友好
- Vite提供快速开发体验

**构建工具：Vite**
- 快速热重载
- 优化的生产构建
- 原生 ES 模块支持

**本地数据库：IndexedDB + Dexie.js**
- 浏览器原生，无需加载额外资源
- 性能好，支持大量数据
- Dexie.js提供简洁的API
- 支持加密插件

**加密：Web Crypto API**
- 浏览器原生加密 API
- AES-256-GCM 支持
- 安全密钥管理
- 封装成简洁的工具类

**UI 框架：Tailwind CSS + shadcn/ui**
- 实用优先的 CSS 框架
- 现代设计，高度可定制
- 组件质量高，可访问性好
- bundle小，性能好

**状态管理：React Context + Zustand**
- React内置状态管理
- Zustand提供全局状态
- 简单易用，性能好

**后端：第一阶段无需后端**
- 数据完全本地化
- 使用静态托管（Vercel/Netlify）
- 后续阶段可选云备份

## 数据库设计

### 本地 IndexedDB 数据库结构（使用 Dexie.js）

```typescript
// src/lib/database.ts
import Dexie from 'dexie';

export interface Credential {
    id?: number;
    title: string;
    username?: string;
    password: string; // 加密存储
    url?: string;
    category?: string;
    notes?: string; // 加密存储
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id?: number;
    name: string;
    icon?: string;
}

export interface Tag {
    id?: number;
    name: string;
}

export class RememberDatabase extends Dexie {
    credentials!: Dexie.Table<Credential, number>;
    categories!: Dexie.Table<Category, number>;
    tags!: Dexie.Table<Tag, number>;

    constructor() {
        super('remember-db');
        this.version(1).stores({
            credentials: '++id, title, username, url, category, *tags, createdAt, updatedAt',
            categories: '++id, name',
            tags: '++id, name'
        });
    }
}

export const db = new RememberDatabase();
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

### 第五阶段：个人数字档案系统（10-12周）

**核心理念转变：**
从"个人数据保险库"升级为"全面的个人数字档案库"

**技术可行性说明：**
本阶段功能分为可实现和需要技术突破两类，将在文档中明确标注。

**新增功能模块：**

#### 1. 人格建模系统 ✓ 可实现
- **性格特征**：MBTI、大五人格、价值观体系
- **思维方式**：决策模式、逻辑推理习惯、思维偏好
- **情感模式**：情绪反应、情感触发点、应对机制
- **语言风格**：常用词汇、表达习惯、语气特征
- **幽默感**：笑话偏好、讽刺程度、幽默风格

#### 2. 关系网络系统 ✓ 可实现
- **人际关系图谱**：与每个人的关系、互动历史
- **社交模式**：社交偏好、沟通风格
- **情感记忆**：重要事件、情感连接点
- **关系动态**：关系的变化轨迹

#### 3. 记忆与经历系统 ✓ 可实现
- **人生时间线**：关键事件、转折点
- **重要记忆**：深刻的记忆、情感标记
- **成长轨迹**：从过去到现在的变化
- **遗憾与愿望**：未完成的心愿、遗憾

#### 4. 知识与智慧系统 ✓ 可实现
- **专业知识**：各领域的知识积累
- **人生智慧**：经验总结、教训、人生哲学
- **观点立场**：对各种话题的看法和立场
- **判断力**：决策依据、权衡方式

#### 5. 创造性输出系统 ✓ 可实现
- **写作风格**：文章、邮件、社交媒体的风格
- **创意偏好**：审美、艺术偏好、创意方向
- **决策模式**：在不确定性下的选择倾向

#### 6. AI交互系统 ⚠️ 技术挑战
- **对话风格**：如何与人交流 ⚠️ 需要大量训练数据
- **回应模式**：对不同类型问题的回应方式 ⚠️ 需要NLP模型
- **价值观判断**：在道德困境中的选择 ⚠️ 准确性有限
- **情感表达**：如何表达关心、支持、批评 ⚠️ 只能模拟

#### 7. 数字遗产执行系统 ✓ 可实现
- **自动执行**：在特定条件下自动执行遗嘱
- **渐进式交接**：逐步向继承者释放信息
- **数字档案传承**：将个人数字档案传递给指定继承人

**技术实现：**
- 多模态数据采集（文字、语音、视频）✓
- 人格模型训练（基于用户数据）⚠️ 需要机器学习
- 语言风格分析（理解用户表达方式）⚠️ 需要NLP
- 知识图谱构建（组织用户知识）✓
- AI对话系统（保存用户交互模式）⚠️ 效果有限

**伦理框架：**
- 用户的数据所有权
- 继承者的使用权限
- 禁止商业滥用
- 明确标注数字档案身份

**重要说明：**
本阶段的AI相关功能（标记为⚠️）目前技术上可以实现基础版本，但效果有限。这些功能旨在：
1. 采集和存储用户的人格特征、关系网络、记忆等数据
2. 提供基础的数据分析和模式识别
3. 为未来AI技术发展预留接口

**不承诺实现的功能：**
- 完全自主的AI代理（无法完全自主决策）
- 实时情感交互（无法真正理解情感）
- 完全复制个人意识（只能模拟行为模式）

## 技术实现细节

### 项目结构
```
remember/
├── src/
│   ├── components/         # React组件
│   │   ├── ui/             # shadcn/ui组件
│   │   ├── auth/           # 认证相关组件
│   │   ├── credentials/    # 凭证管理组件
│   │   └── layout/         # 布局组件
│   ├── hooks/              # 自定义Hooks
│   ├── lib/                # 工具库
│   │   ├── crypto.ts       # 加密工具
│   │   ├── database.ts     # 数据库操作
│   │   ├── utils.ts        # 通用工具函数
│   │   └── types.ts        # TypeScript类型
│   ├── stores/             # Zustand状态管理
│   ├── pages/              # 页面组件
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── components.json         # shadcn/ui配置
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
import { db } from './database';
import { CryptoManager } from './crypto';

export class CredentialService {
    private crypto: CryptoManager;
    
    constructor() {
        this.crypto = new CryptoManager();
    }
    
    async addCredential(credential: Credential): Promise<void> {
        // 加密敏感数据
        const encrypted = {
            ...credential,
            password: await this.crypto.encrypt(credential.password),
            notes: credential.notes ? await this.crypto.encrypt(credential.notes) : undefined
        };
        await db.credentials.add(encrypted);
    }
    
    async searchCredentials(query: string): Promise<Credential[]> {
        // 搜索凭证
        return await db.credentials
            .where('title')
            .startsWithIgnoreCase(query)
            .or('username')
            .startsWithIgnoreCase(query)
            .toArray();
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

**remember** 项目采用本地优先、隐私保护的设计理念，通过现代Web技术实现安全、易用的个人数据管理工具。项目愿景是成为"个人数字档案库"，帮助用户整理、保存并传承其数字存在。

### 项目意义升华

从"个人数据保险库"到"个人数字档案库"：

1. **不仅仅是密码和资产交接**
   - 避免逝者没来得及告诉继承者资产分布和账号密码的尴尬
   - 避免公证费用和法律纠纷

2. **而是将一个人所有值得被数字化的东西全部留存**
   - 人格特征、思维方式、情感模式
   - 知识智慧、人生经验、价值观
   - 关系网络、情感连接、社交模式
   - 记忆经历、成长轨迹、遗憾愿望

3. **使用和传递**
   - 让逝者的数字存在继续陪伴家人
   - 将个人智慧和经验传递给后代
   - 为未来AI集成提供结构化数据

4. **创造更大的价值**
   - 数字传承：让人的数字存在得以延续
   - 智慧传承：保存人类个体的独特性和多样性
   - 情感连接：让逝者以数字形式继续陪伴家人
   - AI进化：为构建更人性化的AI提供训练数据

### 关键优势
1. **隐私优先**：数据完全由用户控制
2. **零成本**：第一阶段完全免费
3. **跨平台**：Web App支持所有平台
4. **可扩展**：模块化设计支持功能扩展
5. **开源**：透明、可审计、社区驱动
6. **数字传承**：让人的数字存在得以延续和传承

### 项目愿景

> **remember** 不仅仅是您的"人生数据库"，更是您的"个人数字档案库"。
> 让您的数字存在得以保存和传承，让您的智慧和情感永远陪伴家人。