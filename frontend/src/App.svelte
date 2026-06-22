<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './lib/components/Login.svelte';
  import CredentialList from './lib/components/CredentialList.svelte';
  import CredentialForm from './lib/components/CredentialForm.svelte';
  import MemoirPanel from './lib/components/memoir/MemoirPanel.svelte';
  import HabitTracker from './lib/components/HabitTracker.svelte';
  import KnowledgeBase from './lib/components/KnowledgeBase.svelte';
  import ThoughtDiary from './lib/components/ThoughtDiary.svelte';
  import DreamList from './lib/components/DreamList.svelte';
  import Settings from './lib/components/Settings.svelte';
  import type { Credential } from './lib/api';

  // Tab 配置：数据驱动渲染，避免重复的 if/else 分支
  const tabs = [
    { id: 'credentials', label: '🔑 密码管理', component: CredentialList },
    { id: 'memoir', label: '📖 回忆录', component: MemoirPanel },
    { id: 'habits', label: '🎯 习惯追踪', component: HabitTracker },
    { id: 'knowledge', label: '📚 知识库', component: KnowledgeBase },
    { id: 'thoughts', label: '💭 思想日记', component: ThoughtDiary },
    { id: 'dreams', label: '🌈 梦想清单', component: DreamList },
    { id: 'settings', label: '⚙️ 设置', component: Settings },
  ];

  let isLoggedIn = false;
  let showForm = false;
  let editingCredential: Credential | null = null;
  let activeTab = 'credentials';

  // 监听事件（onMount 中注册，销毁时自动清理）
  onMount(() => {
    const loginHandler = () => { isLoggedIn = true; };
    const addFormHandler = () => { editingCredential = null; showForm = true; };
    const editHandler = ((e: CustomEvent) => {
      editingCredential = e.detail;
      showForm = true;
    }) as EventListener;

    window.addEventListener('login-success', loginHandler);
    window.addEventListener('show-add-form', addFormHandler);
    window.addEventListener('edit-credential', editHandler);

    return () => {
      window.removeEventListener('login-success', loginHandler);
      window.removeEventListener('show-add-form', addFormHandler);
      window.removeEventListener('edit-credential', editHandler);
    };
  });

  function handleFormClose() {
    showForm = false;
    editingCredential = null;
  }

  function handleFormSave() {
    // 触发凭证列表刷新
    window.dispatchEvent(new Event('refresh-credentials'));
  }

  // 当前激活的 tab 组件
  $: activeTabConfig = tabs.find(t => t.id === activeTab);
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
        {#each tabs as tab}
          <button
            class="nav-btn"
            class:active={activeTab === tab.id}
            on:click={() => activeTab = tab.id}
          >
            {tab.label}
          </button>
        {/each}
      </nav>

      <main class="app-content">
        {#if activeTabConfig}
          <svelte:component this={activeTabConfig.component} />
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
</style>
