# 桌面应用打包指南

## 方案对比

| 特性 | Tauri | Electron |
|------|-------|----------|
| 体积 | ~10MB | ~100MB |
| 性能 | 高 | 中 |
| 安全性 | 高（Rust后端） | 中 |
| 依赖 | 需要Rust | 仅Node.js |
| 跨平台 | ✓ | ✓ |

## 推荐：Tauri（更安全、更轻量）

### 1. 安装Rust

访问 https://rustup.rs/ 下载并安装Rust。

```bash
# Windows (PowerShell)
winget install Rustlang.Rustup

# 或访问 https://rustup.rs/ 下载安装器
```

### 2. 安装Tauri CLI

```bash
cargo install tauri-cli
```

### 3. 初始化Tauri

```bash
cargo tauri init
```

### 4. 配置tauri.conf.json

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

### 5. 构建桌面应用

```bash
# 开发模式
cargo tauri dev

# 构建生产版本
cargo tauri build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/` 目录。

---

## 替代方案：Electron（无需Rust）

### 1. 安装Electron依赖

```bash
npm install electron electron-builder --save-dev
```

### 2. 创建electron/main.js

```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('dist/index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

### 3. 更新package.json

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "electron .",
    "electron:build": "electron-builder"
  },
  "build": {
    "appId": "com.remember.app",
    "productName": "Remember",
    "directories": {
      "output": "release"
    }
  }
}
```

### 4. 构建

```bash
npm run electron:build
```

---

## 安全建议

无论使用哪种方案，桌面应用都提供以下安全优势：

1. **本地文件系统存储** - 数据不在浏览器环境中
2. **系统级安全** - 可使用操作系统的安全存储
3. **无XSS风险** - 不受浏览器脚本攻击影响
4. **无扩展风险** - 不受恶意浏览器扩展影响

> 对于存储密码、财务等高度敏感数据，强烈建议使用桌面应用版本。
