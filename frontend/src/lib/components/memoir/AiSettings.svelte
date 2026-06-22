<script lang="ts">
  import type { AiConfig } from '../../api';
  
  export let onSave: (config: AiConfig) => void = () => {};
  export let onClose: () => void = () => {};
  
  // 从统一的 ai-config JSON key 读取配置
  function loadConfig(): AiConfig {
    try {
      const saved = localStorage.getItem('ai-config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load AI config:', e);
    }
    return { provider: 'ollama', api_url: 'http://localhost:11434', api_key: undefined, model: 'qwen2.5:7b' };
  }
  
  const savedConfig = loadConfig();
  let provider = savedConfig.provider || 'ollama';
  let apiUrl = savedConfig.api_url || 'http://localhost:11434';
  let apiKey = savedConfig.api_key || '';
  let model = savedConfig.model || 'qwen2.5:7b';
  
  const ollamaModels = [
    'qwen2.5:7b',
    'qwen2.5:3b',
    'qwen2.5:1.5b',
    'llama3.2:3b',
    'llama3.2:1b',
    'phi3:mini',
    'gemma2:2b'
  ];
  
  const openaiModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ];
  
  function handleProviderChange() {
    if (provider === 'ollama') {
      apiUrl = 'http://localhost:11434';
      model = 'qwen2.5:7b';
    } else {
      apiUrl = 'https://api.openai.com';
      model = 'gpt-4o-mini';
    }
  }
  
  function handleSave() {
    const config: AiConfig = {
      provider,
      api_url: apiUrl,
      api_key: apiKey || undefined,
      model
    };
    
    // 保存到统一的 ai-config JSON key
    localStorage.setItem('ai-config', JSON.stringify(config));
    
    onSave(config);
  }
</script>

<div class="ai-settings">
  <div class="settings-header">
    <h3>🤖 AI 配置</h3>
    <button class="close-btn" on:click={onClose} aria-label="关闭">×</button>
  </div>
  
  <div class="settings-content">
    <div class="form-group">
      <label for="provider">AI 提供商</label>
      <select id="provider" bind:value={provider} on:change={handleProviderChange}>
        <option value="ollama">Ollama（本地）</option>
        <option value="openai">OpenAI（云端）</option>
      </select>
      <p class="hint">
        {#if provider === 'ollama'}
          需要先安装并运行 Ollama，详见 https://ollama.ai
        {:else}
          需要 OpenAI API Key
        {/if}
      </p>
    </div>
    
    <div class="form-group">
      <label for="api-url">API 地址</label>
      <input 
        type="text" 
        id="api-url" 
        bind:value={apiUrl}
        placeholder="http://localhost:11434"
      />
    </div>
    
    {#if provider === 'openai'}
      <div class="form-group">
        <label for="api-key">API Key</label>
        <input 
          type="password" 
          id="api-key" 
          bind:value={apiKey}
          placeholder="sk-..."
        />
      </div>
    {/if}
    
    <div class="form-group">
      <label for="model">模型</label>
      <select id="model" bind:value={model}>
        {#each (provider === 'ollama' ? ollamaModels : openaiModels) as m}
          <option value={m}>{m}</option>
        {/each}
      </select>
      <p class="hint">
        {#if provider === 'ollama'}
          推荐使用 qwen2.5:7b，中文效果好且资源占用适中
        {:else}
          gpt-4o-mini 性价比最高
        {/if}
      </p>
    </div>
  </div>
  
  <div class="settings-actions">
    <button class="cancel-btn" on:click={onClose}>取消</button>
    <button class="save-btn" on:click={handleSave}>保存</button>
  </div>
</div>

<style>
  .ai-settings {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }
  
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .settings-header h3 {
    margin: 0;
    font-size: 1.15rem;
    color: #333;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
    padding: 0;
    line-height: 1;
  }
  
  .close-btn:hover {
    color: #333;
  }
  
  .settings-content {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.25rem;
  }
  
  .form-group:last-child {
    margin-bottom: 0;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
  }
  
  .form-group select,
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.95rem;
    outline: none;
  }
  
  .form-group select:focus,
  .form-group input:focus {
    border-color: #667eea;
  }
  
  .hint {
    margin: 0.5rem 0 0 0;
    font-size: 0.8rem;
    color: #888;
  }
  
  .settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid #eee;
  }
  
  .cancel-btn {
    background: white;
    color: #666;
    border: 1px solid #ddd;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .cancel-btn:hover {
    background: #f0f0f0;
  }
  
  .save-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .save-btn:hover {
    opacity: 0.9;
  }
</style>
