<!--
╔══════════════════════════════════════════════════════════════════════╗
║  DreamSeed 种梦计划 — AI创造者大赛  官方 README 模板                ║
║                                                                      ║
║  使用说明：                                                          ║
║  1. 将本模板放在参赛仓库根目录 README.md 的顶部                       ║
║  2. 头图使用 DreamField 官方公开活动图片地址                         ║
║  3. 请保留 DREAMFIELD_README_HEADER_START / END 标识                 ║
║  4. 分割线以下供创作者自由编写项目内容                               ║
╚══════════════════════════════════════════════════════════════════════╝
-->

<!-- DREAMFIELD_README_HEADER_START -->

<p align="center">
  <a href="https://www.dreamfield.top">
    <img src="https://www.dreamfield.top/dream-field/contest-readme/assets/dreamseed-readme-banner.png" alt="DreamSeed 种梦计划参赛作品" width="100%" />
  </a>
</p>

<!-- DREAMFIELD_README_HEADER_END -->

<p align="center">
  <strong>English</strong> | <a href="./README_CN.md">中文</a>
</p>

---

# remember

> **A private, lifelong vault for your passwords, habits, knowledge, dreams, relationships, legacy, and everything that defines you — encrypted and fully under your control.**

**remember** is your own "digital life book". It helps you settle and organize all the important information in your life — from daily habit check‑ins and fleeting insights, to highly sensitive wills and asset records — in a secure, private, and long‑lasting way.

---

## 💡 Why remember?

Our lives are made up of countless pieces of information: account passwords, habits we stick to, knowledge we’ve learned, future dreams, important people, and eventually the wills and asset arrangements we must face… These fragments are scattered everywhere.  
**remember** seeks to give them a unified, secure home that can accompany you for decades.

---

## ✨ Core Features

- 🔐 **Digital Credentials** – accounts, passwords, private keys, etc., stored with strong local encryption  
- 🧭 **Habit Tracker** – daily check‑ins, streak counts, habit‑forming curves  
- 📚 **Knowledge Base** – study notes, book excerpts, concept cards  
- 💭 **Thought Journal** – diaries, reflections, insights  
- 🌟 **Dream List** – life goals, wishes, progress tracking  
- 👥 **Important Relationships** – connections and memories of family, close friends, key contacts  
- 📜 **Will & Instructions** – digital wills, after‑life arrangements, attachment archives  
- 💰 **Assets** – digital/physical assets, investment records (encrypted storage)  
- 🧪 **Experience Repository** – project retrospectives, lessons learned, life experience  

**All data is local‑first, offline‑capable, and supports end‑to‑end encryption.**

---

## 🔒 Security & Privacy

- **Zero‑knowledge architecture** – the platform cannot access any of your plaintext; highly sensitive data uses military‑grade encryption  
- **Fully offline capable** – core functionality requires no network, data is entirely under your control  
- **Backup & recovery** – supports encrypted export/import to prevent data loss from single points of failure  
- **Legacy handover** – preset a “digital legacy contact” and time‑triggered mechanism (e.g., prolonged inactivity) to ensure critical information reaches trusted hands when necessary  

> This is your own "life database", not a data mine for cloud providers.

---

## 🎯 Vision & Boundaries

### Core Meaning
**remember** represents a return to data sovereignty in the digital age. It's not just a tool—it's a philosophy: your digital life should be as private and controllable as your physical one. This project addresses three critical needs:
1. **Data fragmentation** – Consolidating scattered personal information into one secure location
2. **Privacy erosion** – Providing a genuine alternative to cloud-dependent services that monetize your data
3. **Digital legacy** – Ensuring your digital presence can be properly managed and transferred

### Expansion Possibilities
The project can grow thoughtfully in these directions:
- **Family sharing** – Secure password sharing and family memory vaults
- **Time capsules** – Content that unlocks at predetermined future dates
- **Biometric integration** – Fingerprint and facial recognition for enhanced security
- **Multi-device sync** – Cross-device access with encryption preservation
- **Legal integration** – Working with digital estate planning services
- **Selective AI integration** – Users choose which data to share with AI (e.g., habits, knowledge) while keeping sensitive data (passwords, private notes) encrypted and hidden. Supports custom AI APIs for full control.

### Clear Boundaries
To maintain its core principles, **remember** will never include:
- ❌ **Social network features** – Limited sharing (family passwords) is supported, but this is not a social platform
- ❌ **Data monetization** – No ads, no analytics sales, no third-party data sharing
- ❌ **Mandatory cloud dependency** – Local-first with optional encrypted cloud backup
- ❌ **Unnecessary complexity** – No blockchain, cryptocurrency, or over-engineered solutions

> **remember** is your digital sanctuary—private, secure, and entirely yours.

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Local Database**: IndexedDB + Dexie.js (browser-native)
- **Encryption**: Web Crypto API (AES-256-GCM)
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + Zustand
- **Desktop App**: Tauri (Recommended) / Electron
- **Backend**: Not required (first phase) – static hosting only
- **Deployment**: Static hosting (Vercel/Netlify) – **completely free**

---

## 🔐 Security & Encryption

### Data Encryption

| Layer | Technology | Description |
|-------|-----------|-------------|
| Key Derivation | PBKDF2 | 100,000 iterations, SHA-256 |
| Data Encryption | AES-256-GCM | Military-grade encryption |
| Storage | IndexedDB | Local encrypted storage |

### Desktop App Security Benefits

Using **Tauri** to package as a desktop app provides higher security:

- ✓ Data stored in local filesystem, not browser environment
- ✓ Can use OS secure storage (Windows Credential Manager / macOS Keychain)
- ✓ No XSS attack risk
- ✓ No browser extension risk
- ✓ Native system-level security protection

### Security Recommendations

| Deployment | Security Level | Suitable Data |
|------------|---------------|---------------|
| **Desktop App (Tauri)** | High | ✓ Passwords, finances, confidential data |
| PWA | Medium | General personal data |
| Pure Web | Low-Medium | General personal data |

> **Important**: For storing passwords, financial data, and other highly sensitive information, using the desktop app version is strongly recommended.

---

## 📱 Product Architecture: Local-First + Optional Sync

### Architecture Design

```
┌─────────────────────────────────────────────────────────┐
│                    User Master Password                  │
│              (Never leaves local device)                 │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Desktop │     │ Mobile  │     │ Tablet  │
    │   App   │     │   App   │     │   App   │
    │ (Primary)│    │ (Helper)│     │ (Helper)│
    └─────────┘     └─────────┘     └─────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌─────────────────────┐
              │  Encrypted Sync     │
              │ (User's own cloud)  │
              │ iCloud/OneDrive/etc │
              └─────────────────────┘
```

### Platform Responsibilities

| Platform | Role | Main Functions |
|----------|------|----------------|
| **Desktop** | Primary | Full feature management, bulk data input, complex operations, highest security |
| **Mobile** | Helper | Quick password view, biometric unlock, quick notes, photo capture |
| **Tablet** | Helper | Medium screen experience, between desktop and mobile |

### Sync Security Design

| Principle | Implementation |
|-----------|---------------|
| **Data Encryption** | AES-256-GCM, encrypted locally before sync |
| **Master Password** | Never leaves local device, never uploaded |
| **Sync Content** | Only encrypted ciphertext, no plaintext |
| **User Control** | User chooses whether to sync and which cloud storage |

### Supported Cloud Storage (Optional)

- iCloud (Apple devices)
- OneDrive (Microsoft)
- Google Drive
- Dropbox
- Self-hosted WebDAV

> **Core Principle**: Data always belongs to the user. Cloud storage is only a transmission channel for encrypted data.

---

## 🚀 Implementation Roadmap

### Phase 1: MVP (4-6 weeks)
**Core Features:**
- User authentication with master password
- Digital credentials management (CRUD)
- AES-256-GCM encryption for sensitive data
- Local SQLite database
- Basic search and categorization
- Encrypted export/import

**Deployment:** Static hosting – zero cost

### Phase 2: Feature Expansion (4-6 weeks)
- Habit tracker
- Knowledge base
- Thought journal
- Dream list

### Phase 3: Advanced Features (4-6 weeks)
- Digital legacy management
- Asset tracking
- Experience repository
- Advanced search and tagging

### Phase 4: Platform Expansion (6-8 weeks)
- Desktop app (Electron/Tauri)
- Mobile app (React Native/Flutter)
- Optional encrypted cloud backup

---

## 📖 Documentation

- [README_CN.md](./README_CN.md) – 中文文档
- [plan.md](./plan.md) – Detailed implementation plan
- [desktop-app.md](./docs/desktop-app.md) – Desktop app packaging guide