<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './lib/components/Login.svelte';
  import CredentialList from './lib/components/CredentialList.svelte';
  import CredentialForm from './lib/components/CredentialForm.svelte';
  import MemoirPanel from './lib/components/memoir/MemoirPanel.svelte';
  import type { Credential } from './lib/api';
  
  let isLoggedIn = false;
  let showForm = false;
  let editingCredential: Credential | null = null;
  let activeTab = 'credentials';
  
  // 监听登录成功事件
  if (typeof window !== 'undefined') {
    window.addEventListener('login-success', () => {
      isLoggedIn = true;
    });
    
    // 监听添加凭证事件
    window.addEventListener('show-add-form', () => {
      editingCredential = null;
      showForm = true;
    });
    
    // 监听编辑凭证事件
    window.addEventListener('edit-credential', ((e: CustomEvent) => {
      editingCredential = e.detail;
      showForm = true;
    }) as EventListener);
  }
  
  function handleFormClose() {
    showForm = false;
    editingCredential = null;
  }
  
  function handleFormSave() {
    // 触发凭证列表刷新
    window.dispatchEvent(new Event('refresh-credentials'));
  }
</script>

<main>
  {#if !isLoggedIn}
    <Login />
  {:else}
    <div class="app-container">
      <header class="app-header">
        <h1>🔐 Remember</h1>
        <p class="subtitle">您的安全数字档案库</p>
      </header>
      
      <nav class="app-nav">
        <button 
          class="nav-btn" 
          class:active={activeTab === 'credentials'}
          on:click={() => activeTab = 'credentials'}
        >
          🔑 密码管理
        </button>
        <button 
          class="nav-btn"
          class:active={activeTab === 'memoir'}
          on:click={() => activeTab = 'memoir'}
        >
          📖 回忆录
        </button>
        <button 
          class="nav-btn"
          class:active={activeTab === 'settings'}
          on:click={() => activeTab = 'settings'}
        >
          ⚙️ 设置
        </button>
      </nav>
      
      <main class="app-content">
        {#if activeTab === 'credentials'}
          <CredentialList />
        {:else if activeTab === 'memoir'}
          <MemoirPanel />
        {:else if activeTab === 'settings'}
          <div class="coming-soon">
            <h2>⚙️ 设置</h2>
            <p>即将推出...</p>
          </div>
        {/if}
      </main>
      
      {#if showForm}
        <CredentialForm 
          credential={editingCredential}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      {/if}
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
  }
  
  .app-container {
    min-height: 100vh;
  }
  
  .app-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
  }
  
  .app-header h1 {
    margin: 0;
    font-size: 2rem;
  }
  
  .subtitle {
    margin: 0.5rem 0 0 0;
    opacity: 0.9;
  }
  
  .app-nav {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .nav-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    background: #f0f0f0;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }
  
  .nav-btn:hover {
    background: #e0e0e0;
  }
  
  .nav-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .app-content {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .welcome-card {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  
  .welcome-card h2 {
    color: #333;
    margin-top: 0;
  }
  
  .security-badges {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
  }
  
  .badge {
    background: #e8f4f8;
    color: #0066cc;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-size: 0.9rem;
  }
  
  .coming-soon {
    background: white;
    padding: 3rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  
  .coming-soon h2 {
    color: #333;
    margin-top: 0;
  }
  
  .coming-soon p {
    color: #666;
  }
</style>
