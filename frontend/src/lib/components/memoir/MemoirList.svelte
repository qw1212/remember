<script lang="ts">
  import { onMount } from 'svelte';
  import type { Memoir } from '../../api';
  import { getMemoirs, deleteMemoir, searchMemoirs } from '../../api';
  import MemoirCard from './MemoirCard.svelte';
  
  export let onEdit: (memoir: Memoir) => void = () => {};
  
  let memoirs: Memoir[] = [];
  let isLoading = false;
  let error = '';
  let searchKeyword = '';
  let searchTimeout: ReturnType<typeof setTimeout>;
  
  onMount(() => {
    loadMemoirs();
  });
  
  async function loadMemoirs() {
    isLoading = true;
    error = '';
    
    try {
      const response = await getMemoirs();
      if (response.success && response.data) {
        memoirs = response.data;
      } else {
        error = response.error || '加载失败';
      }
    } catch (e) {
      error = '加载回忆列表失败';
    } finally {
      isLoading = false;
    }
  }
  
  async function handleSearch() {
    if (!searchKeyword.trim()) {
      await loadMemoirs();
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const response = await searchMemoirs(searchKeyword);
      if (response.success && response.data) {
        memoirs = response.data;
      } else {
        error = response.error || '搜索失败';
      }
    } catch (e) {
      error = '搜索失败';
    } finally {
      isLoading = false;
    }
  }
  
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 300);
  }
  
  async function handleDelete(id: string) {
    if (!confirm('确定要删除这条回忆吗？')) return;
    
    try {
      const response = await deleteMemoir(id);
      if (response.success) {
        memoirs = memoirs.filter(m => m.id !== id);
      } else {
        alert(response.error || '删除失败');
      }
    } catch (e) {
      alert('删除失败');
    }
  }
  
  function handleEdit(memoir: Memoir) {
    onEdit(memoir);
  }
</script>

<div class="memoir-list">
  <div class="list-header">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        bind:value={searchKeyword}
        on:input={handleSearchInput}
        placeholder="搜索回忆..."
        class="search-input"
      />
    </div>
    <button class="refresh-btn" on:click={loadMemoirs} disabled={isLoading} aria-label="刷新">
      🔄
    </button>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if memoirs.length === 0}
    <div class="empty-state">
      <p>📖</p>
      <p>还没有回忆记录</p>
      <p class="hint">点击"开始对话"来记录你的第一段回忆</p>
    </div>
  {:else}
    <div class="memoir-grid">
      {#each memoirs as memoir (memoir.id)}
        <MemoirCard 
          {memoir} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .memoir-list {
    width: 100%;
  }
  
  .list-header {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 0 0.75rem;
  }
  
  .search-icon {
    font-size: 1rem;
    margin-right: 0.5rem;
  }
  
  .search-input {
    flex: 1;
    border: none;
    padding: 0.75rem 0;
    font-size: 0.95rem;
    outline: none;
    background: transparent;
  }
  
  .refresh-btn {
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .refresh-btn:hover:not(:disabled) {
    background: #f0f0f0;
  }
  
  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .error-message {
    background: #fee;
    color: #c00;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .loading {
    text-align: center;
    padding: 3rem;
    color: #666;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #666;
    background: white;
    border-radius: 12px;
  }
  
  .empty-state p:first-child {
    font-size: 3rem;
    margin: 0 0 1rem 0;
  }
  
  .empty-state p {
    margin: 0.5rem 0;
  }
  
  .hint {
    font-size: 0.9rem;
    color: #999;
  }
  
  .memoir-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }
  
  @media (max-width: 768px) {
    .memoir-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
