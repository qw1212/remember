<script lang="ts">
  import { onMount } from 'svelte';
  import type { Memoir, AiConfig } from '../../api';
  import MemoirList from './MemoirList.svelte';
  import MemoirTimeline from './MemoirTimeline.svelte';
  import MemoirSearch from './MemoirSearch.svelte';
  import AiChat from './AiChat.svelte';
  import AiSettings from './AiSettings.svelte';
  
  let viewMode: 'list' | 'chat' | 'settings' | 'search' = 'list';
  let listDisplayMode: 'grid' | 'timeline' = 'grid';
  let editingMemoir: Memoir | null = null;
  
  // 检查是否已配置 AI
  let isAiConfigured = !!localStorage.getItem('ai-config');
  
  // AI 配置（响应式读取）
  let aiConfig: AiConfig = (() => {
    try {
      const saved = localStorage.getItem('ai-config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load AI config:', e);
    }
    return { provider: 'ollama', api_url: 'http://localhost:11434', api_key: undefined, model: 'qwen2.5:7b' };
  })();
  
  function handleEdit(memoir: Memoir) {
    editingMemoir = memoir;
    viewMode = 'chat';
  }
  
  function handleNewChat() {
    if (!isAiConfigured) {
      viewMode = 'settings';
      return;
    }
    editingMemoir = null;
    viewMode = 'chat';
  }
  
  function handleBackToList() {
    viewMode = 'list';
    editingMemoir = null;
  }
  
  function handleOpenSettings() {
    viewMode = 'settings';
  }
  
  function handleOpenSearch() {
    viewMode = 'search';
  }
  
  function handleSettingsSave(config: AiConfig) {
    isAiConfigured = true;
    aiConfig = config;
    viewMode = 'list';
  }
  
  function handleSettingsClose() {
    viewMode = 'list';
  }
  
  function handleMemoirSaved() {
    viewMode = 'list';
    editingMemoir = null;
    window.dispatchEvent(new Event('refresh-memoirs'));
  }
  
  function toggleDisplayMode() {
    listDisplayMode = listDisplayMode === 'grid' ? 'timeline' : 'grid';
  }
</script>

<div class="memoir-panel">
  <div class="panel-header">
    <h2>📖 回忆录</h2>
    <div class="header-actions">
      {#if viewMode === 'list'}
        <button class="mode-btn" on:click={toggleDisplayMode} title={listDisplayMode === 'grid' ? '切换到时间线' : '切换到卡片'} aria-label={listDisplayMode === 'grid' ? '切换到时间线' : '切换到卡片'}>
          {listDisplayMode === 'grid' ? '📅' : '📋'}
        </button>
        <button class="search-btn" on:click={handleOpenSearch} title="智能搜索" aria-label="智能搜索">
          🔍
        </button>
        <button class="settings-btn" on:click={handleOpenSettings} title="AI 设置" aria-label="AI 设置">
          ⚙️
        </button>
        <button class="new-chat-btn" on:click={handleNewChat}>
          ✨ 开始对话
        </button>
      {:else}
        <button class="back-btn" on:click={handleBackToList}>
          ← 返回列表
        </button>
      {/if}
    </div>
  </div>
  
  {#if !isAiConfigured && viewMode === 'list'}
    <div class="config-hint">
      <p>💡 首次使用请先配置 AI 设置，点击右上角 ⚙️ 按钮</p>
    </div>
  {/if}
  
  <div class="panel-content">
    {#if viewMode === 'list'}
      {#if listDisplayMode === 'grid'}
        <MemoirList onEdit={handleEdit} />
      {:else}
        <MemoirTimeline onSelect={handleEdit} />
      {/if}
    {:else if viewMode === 'search'}
      <MemoirSearch onSelect={handleEdit} {aiConfig} />
    {:else if viewMode === 'chat'}
      <AiChat 
        memoir={editingMemoir}
        onSave={handleMemoirSaved}
        onCancel={handleBackToList}
        {aiConfig}
      />
    {:else if viewMode === 'settings'}
      <AiSettings 
        onSave={handleSettingsSave}
        onClose={handleSettingsClose}
      />
    {/if}
  </div>
</div>

<style>
  .memoir-panel {
    width: 100%;
  }
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .panel-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #333;
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .settings-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .settings-btn:hover {
    background: #f0f0f0;
  }
  
  .mode-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .mode-btn:hover {
    background: #f0f0f0;
  }
  
  .search-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .search-btn:hover {
    background: #f0f0f0;
  }
  
  .new-chat-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  
  .new-chat-btn:hover {
    opacity: 0.9;
  }
  
  .back-btn {
    background: white;
    color: #667eea;
    border: 1px solid #667eea;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    background: #f0f0ff;
  }
  
  .config-hint {
    background: #fff3cd;
    color: #856404;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    text-align: center;
  }
  
  .config-hint p {
    margin: 0;
    font-size: 0.9rem;
  }
  
  .panel-content {
    min-height: 400px;
  }
</style>
