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

### 第三阶段：功能扩展
- [ ] 习惯追踪模块
- [ ] 知识库模块
- [ ] 思想日记模块
- [ ] 梦想清单模块

### 第四阶段：高级功能
- [ ] 数字遗产功能
- [ ] 资产管理功能
- [ ] 经验库功能

### 第五阶段：平台扩展
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
