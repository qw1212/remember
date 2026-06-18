<script lang="ts">
  import { onMount } from 'svelte';
  import { exportData, importData, type AiConfig } from '../api';

  let activeSection = 'ai';
  let error = '';
  let success = '';

  // AI 配置
  let aiProvider: 'ollama' | 'openai' = 'ollama';
  let aiApiUrl = 'http://localhost:11434';
  let aiApiKey = '';
  let aiModel = 'qwen2:7b';

  // 主题设置
  let theme: 'light' | 'dark' | 'system' = 'light';

  // 数据管理
  let isExporting = false;
  let isImporting = false;

  onMount(() => {
    loadSettings();
  });

  function loadSettings() {
    // 从 localStorage 加载设置
    const savedAiConfig = localStorage.getItem('ai-config');
    if (savedAiConfig) {
      try {
        const config = JSON.parse(savedAiConfig);
        aiProvider = config.provider || 'ollama';
        aiApiUrl = config.apiUrl || 'http://localhost:11434';
        aiApiKey = config.apiKey || '';
        aiModel = config.model || 'qwen2:7b';
      } catch (e) {
        console.error('Failed to load AI config:', e);
      }
    }

    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      theme = savedTheme;
    }
  }

  function saveAiConfig() {
    const config = {
      provider: aiProvider,
      apiUrl: aiApiUrl,
      apiKey: aiApiKey,
      model: aiModel,
    };
    localStorage.setItem('ai-config', JSON.stringify(config));
    success = 'AI 配置已保存';
    setTimeout(() => success = '', 3000);
  }

  function saveTheme() {
    localStorage.setItem('theme', theme);
    applyTheme();
    success = '主题设置已保存';
    setTimeout(() => success = '', 3000);
  }

  function applyTheme() {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // 系统主题
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  async function handleExport() {
    isExporting = true;
    error = '';
    try {
      const result = await exportData();
      if (result.success && result.message) {
        // 创建下载
        const blob = new Blob([result.message], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `remember-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        success = '数据导出成功';
        setTimeout(() => success = '', 3000);
      } else {
        error = result.error || '导出失败';
      }
    } catch (e) {
      error = `导出失败: ${e}`;
    } finally {
      isExporting = false;
    }
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      isImporting = true;
      error = '';
      try {
        const text = await file.text();
        const result = await importData(text);
        if (result.success) {
          success = '数据导入成功';
          setTimeout(() => success = '', 3000);
        } else {
          error = result.error || '导入失败';
        }
      } catch (e) {
        error = `导入失败: ${e}`;
      } finally {
        isImporting = false;
      }
    };
    input.click();
  }
</script>

<div class="settings">
  <h2>设置</h2>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if success}
    <div class="success-message">{success}</div>
  {/if}

  <div class="settings-layout">
    <nav class="settings-nav">
      <button
        class="nav-item"
        class:active={activeSection === 'ai'}
        on:click={() => activeSection = 'ai'}
      >
        AI 配置
      </button>
      <button
        class="nav-item"
        class:active={activeSection === 'data'}
        on:click={() => activeSection = 'data'}
      >
        数据管理
      </button>
      <button
        class="nav-item"
        class:active={activeSection === 'theme'}
        on:click={() => activeSection = 'theme'}
      >
        主题设置
      </button>
    </nav>

    <div class="settings-content">
      {#if activeSection === 'ai'}
        <div class="section">
          <h3>AI 配置</h3>
          <p class="section-desc">配置 AI 服务用于回忆录对话、标签提取等功能</p>

          <div class="form-group">
            <label>AI 提供商</label>
            <div class="provider-options">
              <button
                class="provider-btn"
                class:selected={aiProvider === 'ollama'}
                on:click={() => { aiProvider = 'ollama'; aiApiUrl = 'http://localhost:11434'; }}
              >
                <span class="provider-icon">🦙</span>
                <span class="provider-name">Ollama</span>
                <span class="provider-desc">本地运行，隐私安全</span>
              </button>
              <button
                class="provider-btn"
                class:selected={aiProvider === 'openai'}
                on:click={() => { aiProvider = 'openai'; aiApiUrl = 'https://api.openai.com'; }}
              >
                <span class="provider-icon">🤖</span>
                <span class="provider-name">OpenAI</span>
                <span class="provider-desc">云端服务，效果更好</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="ai-url">API 地址</label>
            <input
              type="url"
              id="ai-url"
              bind:value={aiApiUrl}
              placeholder={aiProvider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com'}
            />
            {#if aiProvider === 'ollama'}
              <span class="form-hint">确保 Ollama 服务已启动</span>
            {/if}
          </div>

          {#if aiProvider === 'openai'}
            <div class="form-group">
              <label for="ai-key">API Key</label>
              <input
                type="password"
                id="ai-key"
                bind:value={aiApiKey}
                placeholder="sk-..."
              />
            </div>
          {/if}

          <div class="form-group">
            <label for="ai-model">模型名称</label>
            <input
              type="text"
              id="ai-model"
              bind:value={aiModel}
              placeholder={aiProvider === 'ollama' ? 'qwen2:7b' : 'gpt-3.5-turbo'}
            />
            {#if aiProvider === 'ollama'}
              <span class="form-hint">常用模型: qwen2:7b, llama3:8b, gemma2:9b</span>
            {/if}
          </div>

          <button class="save-btn" on:click={saveAiConfig}>保存配置</button>
        </div>

      {:else if activeSection === 'data'}
        <div class="section">
          <h3>数据管理</h3>
          <p class="section-desc">导出备份或导入恢复您的数据</p>

          <div class="data-actions">
            <div class="action-card">
              <div class="action-icon">📤</div>
              <div class="action-info">
                <h4>导出数据</h4>
                <p>将所有数据导出为 JSON 文件，用于备份</p>
              </div>
              <button
                class="action-btn"
                on:click={handleExport}
                disabled={isExporting}
              >
                {isExporting ? '导出中...' : '导出'}
              </button>
            </div>

            <div class="action-card">
              <div class="action-icon">📥</div>
              <div class="action-info">
                <h4>导入数据</h4>
                <p>从 JSON 文件导入数据，将覆盖现有数据</p>
              </div>
              <button
                class="action-btn"
                on:click={handleImport}
                disabled={isImporting}
              >
                {isImporting ? '导入中...' : '导入'}
              </button>
            </div>
          </div>

          <div class="warning-box">
            <span class="warning-icon">⚠️</span>
            <p>导入数据会覆盖当前所有数据，请谨慎操作。建议先导出备份。</p>
          </div>
        </div>

      {:else if activeSection === 'theme'}
        <div class="section">
          <h3>主题设置</h3>
          <p class="section-desc">选择您喜欢的界面主题</p>

          <div class="theme-options">
            <button
              class="theme-btn"
              class:selected={theme === 'light'}
              on:click={() => { theme = 'light'; saveTheme(); }}
            >
              <span class="theme-icon">☀️</span>
              <span class="theme-name">浅色</span>
            </button>
            <button
              class="theme-btn"
              class:selected={theme === 'dark'}
              on:click={() => { theme = 'dark'; saveTheme(); }}
            >
              <span class="theme-icon">🌙</span>
              <span class="theme-name">深色</span>
            </button>
            <button
              class="theme-btn"
              class:selected={theme === 'system'}
              on:click={() => { theme = 'system'; saveTheme(); }}
            >
              <span class="theme-icon">💻</span>
              <span class="theme-name">跟随系统</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings {
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
  }

  h2 {
    margin: 0 0 20px;
    font-size: 24px;
    color: #333;
  }

  .error-message {
    background: #fee;
    color: #c00;
    padding: 10px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .success-message {
    background: #efe;
    color: #060;
    padding: 10px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .settings-layout {
    display: flex;
    gap: 24px;
  }

  .settings-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 150px;
  }

  .nav-item {
    padding: 10px 16px;
    border: none;
    background: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    text-align: left;
    transition: all 0.2s;
  }

  .nav-item:hover {
    background: #f0f0f0;
  }

  .nav-item.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .settings-content {
    flex: 1;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .section h3 {
    margin: 0 0 8px;
    font-size: 18px;
    color: #333;
  }

  .section-desc {
    margin: 0 0 24px;
    font-size: 14px;
    color: #888;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #555;
  }

  .form-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }

  .form-hint {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: #888;
  }

  .provider-options {
    display: flex;
    gap: 12px;
  }

  .provider-btn {
    flex: 1;
    padding: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
  }

  .provider-btn:hover {
    border-color: #667eea;
  }

  .provider-btn.selected {
    border-color: #667eea;
    background: #f0f4ff;
  }

  .provider-icon {
    display: block;
    font-size: 32px;
    margin-bottom: 8px;
  }

  .provider-name {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }

  .provider-desc {
    display: block;
    font-size: 12px;
    color: #888;
  }

  .save-btn {
    padding: 10px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.2s;
  }

  .save-btn:hover {
    transform: scale(1.05);
  }

  .data-actions {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
  }

  .action-icon {
    font-size: 32px;
  }

  .action-info {
    flex: 1;
  }

  .action-info h4 {
    margin: 0 0 4px;
    font-size: 16px;
    color: #333;
  }

  .action-info p {
    margin: 0;
    font-size: 13px;
    color: #888;
  }

  .action-btn {
    padding: 8px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.2s;
  }

  .action-btn:hover {
    transform: scale(1.05);
  }

  .action-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .warning-box {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fff8e1;
    border-radius: 8px;
    border: 1px solid #ffe082;
  }

  .warning-icon {
    font-size: 20px;
  }

  .warning-box p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }

  .theme-options {
    display: flex;
    gap: 16px;
  }

  .theme-btn {
    flex: 1;
    padding: 24px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
  }

  .theme-btn:hover {
    border-color: #667eea;
  }

  .theme-btn.selected {
    border-color: #667eea;
    background: #f0f4ff;
  }

  .theme-icon {
    display: block;
    font-size: 36px;
    margin-bottom: 12px;
  }

  .theme-name {
    display: block;
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
</style>
