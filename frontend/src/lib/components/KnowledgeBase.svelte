<script lang="ts">
  import { onMount } from 'svelte';
  import type { Knowledge } from '../api';
  import {
    getKnowledgeList,
    saveKnowledge,
    deleteKnowledge,
    searchKnowledge,
  } from '../api';
  import { truncateText } from '../utils';

  let items: Knowledge[] = [];
  let isLoading = false;
  let showForm = false;
  let editingItem: Knowledge | null = null;
  let error = '';
  let searchKeyword = '';
  let selectedCategory = 'all';

  // 表单数据
  let formTitle = '';
  let formContent = '';
  let formCategory = 'general';
  let formTags = '';
  let formSource = '';
  let formIsImportant = false;

  const categoryOptions = [
    { value: 'general', label: '通用' },
    { value: 'tech', label: '技术' },
    { value: 'business', label: '商业' },
    { value: 'life', label: '生活' },
    { value: 'health', label: '健康' },
    { value: 'finance', label: '理财' },
    { value: 'other', label: '其他' },
  ];

  onMount(() => {
    loadData();
  });

  async function loadData() {
    isLoading = true;
    error = '';
    try {
      let response;
      if (searchKeyword.trim()) {
        response = await searchKnowledge(searchKeyword.trim());
      } else {
        response = await getKnowledgeList();
      }
      if (response.success && response.data) {
        items = response.data;
      }
    } catch (e) {
      error = `加载数据失败: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      isLoading = false;
    }
  }

  function getFilteredItems(): Knowledge[] {
    if (selectedCategory === 'all') return items;
    return items.filter(item => item.category === selectedCategory);
  }

  function getCategoryLabel(category: string): string {
    return categoryOptions.find(c => c.value === category)?.label || category;
  }

  function openAddForm() {
    editingItem = null;
    formTitle = '';
    formContent = '';
    formCategory = 'general';
    formTags = '';
    formSource = '';
    formIsImportant = false;
    showForm = true;
  }

  function openEditForm(item: Knowledge) {
    editingItem = item;
    formTitle = item.title;
    formContent = item.content;
    formCategory = item.category;
    formTags = item.tags.join(', ');
    formSource = item.source || '';
    formIsImportant = item.is_important;
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingItem = null;
  }

  async function handleSave() {
    if (!formTitle.trim()) {
      error = '请输入标题';
      return;
    }
    if (!formContent.trim()) {
      error = '请输入内容';
      return;
    }

    const now = new Date().toISOString();
    const item: Knowledge = {
      id: editingItem?.id || crypto.randomUUID(),
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      tags: formTags.split(',').map(t => t.trim()).filter(t => t),
      source: formSource.trim() || undefined,
      is_important: formIsImportant,
      created_at: editingItem?.created_at || now,
      updated_at: now,
    };

    try {
      const response = await saveKnowledge(item);
      if (response.success) {
        closeForm();
        await loadData();
      } else {
        error = response.error || '保存失败';
      }
    } catch (e) {
      error = `保存失败: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这条知识吗？')) return;

    try {
      const response = await deleteKnowledge(id);
      if (response.success) {
        await loadData();
      } else {
        error = response.error || '删除失败';
      }
    } catch (e) {
      error = `删除失败: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  async function handleSearch() {
    await loadData();
  }

  function handleSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }
</script>

<div class="knowledge-base">
  <div class="kb-header">
    <h2>知识库</h2>
    <button class="btn-add" on:click={openAddForm}>+ 新建知识</button>
  </div>

  <div class="kb-toolbar">
    <div class="search-box">
      <input
        type="text"
        bind:value={searchKeyword}
        placeholder="搜索知识..."
        on:keydown={handleSearchKeydown}
      />
      <button class="btn-search" on:click={handleSearch}>搜索</button>
    </div>
    <div class="category-filter">
      <select bind:value={selectedCategory}>
        <option value="all">全部分类</option>
        {#each categoryOptions as cat}
          <option value={cat.value}>{cat.label}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if getFilteredItems().length === 0}
    <div class="empty-state">
      <p>{searchKeyword ? '没有找到匹配的知识' : '还没有知识条目，点击上方按钮创建一个吧！'}</p>
    </div>
  {:else}
    <div class="knowledge-grid">
      {#each getFilteredItems() as item (item.id)}
        <div class="knowledge-card" class:important={item.is_important}>
          <div class="card-header">
            <span class="category-tag">{getCategoryLabel(item.category)}</span>
            {#if item.is_important}
              <span class="important-tag">重要</span>
            {/if}
          </div>
          <h3 class="card-title">{item.title}</h3>
          <p class="card-content">{truncateText(item.content)}</p>
          {#if item.tags.length > 0}
            <div class="card-tags">
              {#each item.tags.slice(0, 3) as tag}
                <span class="tag">{tag}</span>
              {/each}
              {#if item.tags.length > 3}
                <span class="tag-more">+{item.tags.length - 3}</span>
              {/if}
            </div>
          {/if}
          {#if item.source}
            <p class="card-source">来源: {item.source}</p>
          {/if}
          <div class="card-actions">
            <button class="btn-icon" on:click={() => openEditForm(item)} title="编辑" aria-label="编辑">✏️</button>
            <button class="btn-icon" on:click={() => handleDelete(item.id)} title="删除" aria-label="删除">🗑️</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showForm}
  <div class="modal-overlay" role="button" tabindex="0" on:click={closeForm} on:keydown={(e) => e.key === 'Escape' && closeForm()}>
    <div class="modal" role="dialog" on:click|stopPropagation on:keydown|stopPropagation>
      <h3>{editingItem ? '编辑知识' : '新建知识'}</h3>

      <div class="form-group">
        <label for="kb-title">标题 *</label>
        <input id="kb-title" type="text" bind:value={formTitle} placeholder="知识标题" />
      </div>

      <div class="form-group">
        <label for="kb-content">内容 *</label>
        <textarea id="kb-content" bind:value={formContent} placeholder="知识内容" rows="6"></textarea>
      </div>

      <div class="form-group">
        <label for="kb-category">分类</label>
        <select id="kb-category" bind:value={formCategory}>
          {#each categoryOptions as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="kb-tags">标签（逗号分隔）</label>
        <input id="kb-tags" type="text" bind:value={formTags} placeholder="标签1, 标签2" />
      </div>

      <div class="form-group">
        <label for="kb-source">来源</label>
        <input id="kb-source" type="text" bind:value={formSource} placeholder="可选来源" />
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" bind:checked={formIsImportant} />
          标记为重要
        </label>
      </div>

      <div class="form-actions">
        <button class="btn-cancel" on:click={closeForm}>取消</button>
        <button class="btn-save" on:click={handleSave}>保存</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .knowledge-base {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .kb-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .kb-header h2 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }

  .btn-add {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: transform 0.2s;
  }

  .btn-add:hover {
    transform: scale(1.05);
  }

  .kb-toolbar {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .search-box {
    display: flex;
    gap: 8px;
    flex: 1;
    min-width: 200px;
  }

  .search-box input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
  }

  .btn-search {
    padding: 10px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
  }

  .category-filter select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: white;
  }

  .error-message {
    background: #fee;
    color: #c00;
    padding: 10px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .loading, .empty-state {
    text-align: center;
    padding: 40px;
    color: #666;
  }

  .knowledge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .knowledge-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .knowledge-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .knowledge-card.important {
    border-left: 4px solid #f59e0b;
  }

  .card-header {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .category-tag {
    padding: 4px 8px;
    background: #e0e7ff;
    color: #4f46e5;
    border-radius: 4px;
    font-size: 12px;
  }

  .important-tag {
    padding: 4px 8px;
    background: #fef3c7;
    color: #d97706;
    border-radius: 4px;
    font-size: 12px;
  }

  .card-title {
    margin: 0 0 8px;
    font-size: 18px;
    color: #333;
  }

  .card-content {
    margin: 0 0 12px;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }

  .tag {
    padding: 2px 8px;
    background: #f0f0f0;
    color: #666;
    border-radius: 4px;
    font-size: 12px;
  }

  .tag-more {
    padding: 2px 8px;
    color: #999;
    font-size: 12px;
  }

  .card-source {
    margin: 0 0 12px;
    font-size: 12px;
    color: #999;
  }

  .card-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn-icon {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .btn-icon:hover {
    background: #f0f0f0;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal h3 {
    margin: 0 0 20px;
    font-size: 20px;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #555;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
  }

  .form-group textarea {
    resize: vertical;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .btn-cancel, .btn-save {
    padding: 10px 24px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel {
    background: #f0f0f0;
    border: none;
    color: #666;
  }

  .btn-cancel:hover {
    background: #e0e0e0;
  }

  .btn-save {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
  }

  .btn-save:hover {
    transform: scale(1.05);
  }
</style>
