# 桌面应用打包指南

## 技术选择：Tauri（Rust后端）

| 特性 | Tauri | Electron |
|------|-------|----------|
| 体积 | ~10MB | ~100MB |
| 性能 | 高 | 中 |
| 安全性 | 高（Rust后端） | 中 |
| 内存安全 | 编译时检查 | 无 |
| 系统集成 | 原生API | 有限 |
| 攻击面 | 小（系统WebView） | 大（捆绑Chromium） |

**选择Tauri的理由：**
- Rust后端提供内存安全，无缓冲区溢出漏洞
- 可调用系统原生API（Keychain等）
- 系统WebView，攻击面小
- 安装包体积小

---

## 环境准备

### 1. 安装Rust

访问 https://rustup.rs/ 下载并安装Rust。

```bash
# Windows (PowerShell)
winget install Rustlang.Rustup

# 或访问 https://rustup.rs/ 下载安装器
```

### 2. 安装系统依赖

**Windows：**
- 安装 Visual Studio Build Tools（C++桌面开发）
- 安装 WebView2（Windows 10/11通常已预装）

**macOS：**
```bash
xcode-select --install
```

**Linux (Ubuntu/Debian)：**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### 3. 安装Tauri CLI

```bash
cargo install tauri-cli
```

---

## 项目配置

### 1. 初始化Tauri

在项目根目录执行：

```bash
cargo tauri init
```

### 2. 配置tauri.conf.json

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Remember",
    "version": "1.0.0"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "identifier": "com.remember.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ]
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "Remember",
        "width": 1200,
        "height": 800
      }
    ]
  }
}
```

---

## 构建与运行

### 开发模式

```bash
cargo tauri dev
```

### 构建生产版本

```bash
cargo tauri build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录。

---

## 安全优势

使用Tauri打包桌面应用提供以下安全优势：

1. **内存安全** - Rust编译时检查，无缓冲区溢出漏洞
2. **系统Keychain** - 可调用系统原生安全存储
3. **最小攻击面** - 系统WebView，不捆绑完整浏览器
4. **无XSS风险** - 核心加密在Rust后端，不在JS环境
5. **硬件安全** - 支持HSM/TPM硬件安全模块

---

## 与Svelte集成

Tauri与Svelte配合良好：

1. 前端使用Svelte构建UI
2. 通过Tauri的IPC机制与Rust后端通信
3. 敏感操作（加密、密钥管理）在Rust侧处理
4. 前端仅负责UI交互，不处理加密逻辑
