<script lang="ts">
  import { onMount } from 'svelte';
  import { getCredentials, deleteCredential, type Credential } from '../api';
  
  let credentials: Credential[] = [];
  let isLoading = true;
  let error = '';
  let searchQuery = '';
  let selectedCategory = 'all';
  
  // 加载凭证
  async function loadCredentials() {
    isLoading = true;
    error = '';
    try {
      const result = await getCredentials();
      if (result.success && result.data) {
        credentials = result.data;
      } else {
        error = result.error || '加载失败';
      }
    } catch (e) {
      error = `加载失败: ${e}`;
    } finally {
      isLoading = false;
    }
  }
  
  // 删除凭证
  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个凭证吗？')) return;
    
    try {
      const result = await deleteCredential(id);
      if (result.success) {
        credentials = credentials.filter(c => c.id !== id);
      } else {
        error = result.error || '删除失败';
      }
    } catch (e) {
      error = `删除失败: ${e}`;
    }
  }
  
  // 复制到剪贴板
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
    } catch {
      alert('复制失败');
    }
  }
  
  // 过滤凭证
  $: filteredCredentials = credentials.filter(c => {
    const matchesSearch = searchQuery === '' || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.url?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // 获取所有分类
  $: categories = ['all', ...new Set(credentials.map(c => c.category))];
  
  onMount(() => {
    loadCredentials();
    
    // 监听刷新事件
    window.addEventListener('refresh-credentials', loadCredentials);
    return () => {
      window.removeEventListener('refresh-credentials', loadCredentials);
    };
  });
</script>

<div class="credential-list">
  <div class="list-header">
    <h2>密码管理</h2>
    <button class="add-btn" on:click={() => window.dispatchEvent(new CustomEvent('show-add-form'))}>
      + 添加凭证
    </button>
  </div>
  
  <div class="filters">
    <input
      type="text"
      placeholder="搜索凭证..."
      bind:value={searchQuery}
      class="search-input"
    />
    
    <select bind:value={selectedCategory} class="category-select">
      {#each categories as category}
        <option value={category}>
          {category === 'all' ? '全部分类' : category}
        </option>
      {/each}
    </select>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if filteredCredentials.length === 0}
    <div class="empty-state">
      <p>暂无凭证</p>
      <p class="hint">点击"添加凭证"开始使用</p>
    </div>
  {:else}
    <div class="credentials-grid">
      {#each filteredCredentials as credential}
        <div class="credential-card">
          <div class="card-header">
            <h3>{credential.title}</h3>
            {#if credential.is_favorite}
              <span class="favorite">★</span>
            {/if}
          </div>
          
          {#if credential.username}
            <div class="card-field">
              <span class="field-label">用户名</span>
              <div class="field-value">
                <span>{credential.username}</span>
                <button class="copy-btn" on:click={() => copyToClipboard(credential.username || '')}>
                  复制
                </button>
              </div>
            </div>
          {/if}
          
          <div class="card-field">
            <span class="field-label">密码</span>
            <div class="field-value">
              <span class="password">••••••••</span>
              <button class="copy-btn" on:click={() => copyToClipboard(credential.password)}>
                复制
              </button>
            </div>
          </div>
          
          {#if credential.url}
            <div class="card-field">
              <span class="field-label">网址</span>
              <div class="field-value">
                <a href={credential.url} target="_blank" rel="noopener noreferrer">
                  {credential.url}
                </a>
              </div>
            </div>
          {/if}
          
          <div class="card-meta">
            <span class="category">{credential.category}</span>
            <span class="date">更新于 {new Date(credential.updated_at).toLocaleDateString('zh-CN')}</span>
          </div>
          
          <div class="card-actions">
            <button class="edit-btn" on:click={() => window.dispatchEvent(new CustomEvent('edit-credential', { detail: credential }))}>
              编辑
            </button>
            <button class="delete-btn" on:click={() => handleDelete(credential.id)}>
              删除
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .credential-list {
    padding: 1rem;
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .list-header h2 {
    margin: 0;
    color: #333;
  }
  
  .add-btn {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.2s;
  }
  
  .add-btn:hover {
    transform: translateY(-2px);
  }
  
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .search-input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 0.5rem;
    font-size: 1rem;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .category-select {
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 0.5rem;
    font-size: 1rem;
    background: white;
  }
  
  .error-message {
    color: #e74c3c;
    background: #fdeaea;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }
  
  .hint {
    font-size: 0.9rem;
    color: #999;
  }
  
  .credentials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }
  
  .credential-card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .credential-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .card-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
  }
  
  .favorite {
    color: #f59e0b;
    font-size: 1.2rem;
  }
  
  .card-field {
    margin-bottom: 0.75rem;
  }
  
  .field-label {
    display: block;
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 0.25rem;
  }
  
  .field-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .password {
    font-family: monospace;
    color: #666;
  }
  
  .copy-btn {
    padding: 0.25rem 0.5rem;
    background: #f0f0f0;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.8rem;
    color: #666;
  }
  
  .copy-btn:hover {
    background: #e0e0e0;
  }
  
  .card-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #eee;
    font-size: 0.8rem;
    color: #888;
  }
  
  .category {
    background: #e8f4f8;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    color: #0066cc;
  }
  
  .card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .edit-btn, .delete-btn {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .edit-btn {
    background: #e8f4f8;
    color: #0066cc;
  }
  
  .edit-btn:hover {
    background: #d0e8f0;
  }
  
  .delete-btn {
    background: #fdeaea;
    color: #e74c3c;
  }
  
  .delete-btn:hover {
    background: #fcd0d0;
  }
  
  a {
    color: #667eea;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
</style>
