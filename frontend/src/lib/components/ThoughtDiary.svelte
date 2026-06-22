<script lang="ts">
  import { onMount } from 'svelte';
  import type { Thought } from '../api';
  import {
    getThoughts,
    saveThought,
    deleteThought,
    searchThoughts,
  } from '../api';
  import { formatDate } from '../utils';

  let items: Thought[] = [];
  let isLoading = false;
  let showForm = false;
  let editingItem: Thought | null = null;
  let error = '';
  let searchKeyword = '';

  // 表单数据
  let formContent = '';
  let formMood = '';
  let formTheme = '';
  let formTags = '';
  let formIsPrivate = true;

  const moodOptions = [
    { value: '', label: '无', emoji: '' },
    { value: 'happy', label: '开心', emoji: '😊' },
    { value: 'calm', label: '平静', emoji: '😌' },
    { value: 'sad', label: '难过', emoji: '😢' },
    { value: 'anxious', label: '焦虑', emoji: '😰' },
    { value: 'angry', label: '生气', emoji: '😠' },
  ];

  const themeOptions = [
    '工作', '学习', '生活', '感情', '健康', '梦想', '反思', '感恩', '其他'
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
        response = await searchThoughts(searchKeyword.trim());
      } else {
        response = await getThoughts();
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

  function getMoodEmoji(mood: string | undefined): string {
    return moodOptions.find(m => m.value === mood)?.emoji || '';
  }

  function getMoodLabel(mood: string | undefined): string {
    return moodOptions.find(m => m.value === mood)?.label || '';
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function openAddForm() {
    editingItem = null;
    formContent = '';
    formMood = '';
    formTheme = '';
    formTags = '';
    formIsPrivate = true;
    showForm = true;
  }

  function openEditForm(item: Thought) {
    editingItem = item;
    formContent = item.content;
    formMood = item.mood || '';
    formTheme = item.theme || '';
    formTags = item.tags.join(', ');
    formIsPrivate = item.is_private;
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingItem = null;
  }

  async function handleSave() {
    if (!formContent.trim()) {
      error = '请输入内容';
      return;
    }

    const now = new Date().toISOString();
    const item: Thought = {
      id: editingItem?.id || crypto.randomUUID(),
      content: formContent.trim(),
      mood: formMood || undefined,
      theme: formTheme || undefined,
      tags: formTags.split(',').map(t => t.trim()).filter(t => t),
      is_private: formIsPrivate,
      created_at: editingItem?.created_at || now,
      updated_at: now,
    };

    try {
      const response = await saveThought(item);
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
    if (!confirm('确定要删除这篇日记吗？')) return;

    try {
      const response = await deleteThought(id);
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

<div class="thought-diary">
  <div class="diary-header">
    <h2>思想日记</h2>
    <button class="btn-add" on:click={openAddForm}>+ 写日记</button>
  </div>

  <div class="diary-toolbar">
    <div class="search-box">
      <input
        type="text"
        bind:value={searchKeyword}
        placeholder="搜索日记..."
        on:keydown={handleSearchKeydown}
      />
      <button class="btn-search" on:click={handleSearch}>搜索</button>
    </div>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if items.length === 0}
    <div class="empty-state">
      <p>{searchKeyword ? '没有找到匹配的日记' : '还没有日记，点击上方按钮开始写作吧！'}</p>
    </div>
  {:else}
    <div class="thought-list">
      {#each items as item (item.id)}
        <div class="thought-card">
          <div class="card-meta">
            <span class="date">{formatDate(item.created_at)}</span>
            <span class="time">{formatTime(item.created_at)}</span>
            {#if item.mood}
              <span class="mood">{getMoodEmoji(item.mood)} {getMoodLabel(item.mood)}</span>
            {/if}
            {#if item.theme}
              <span class="theme">{item.theme}</span>
            {/if}
            {#if item.is_private}
              <span class="private">私密</span>
            {/if}
          </div>
          <p class="card-content">{item.content}</p>
          {#if item.tags.length > 0}
            <div class="card-tags">
              {#each item.tags.slice(0, 5) as tag}
                <span class="tag">{tag}</span>
              {/each}
              {#if item.tags.length > 5}
                <span class="tag-more">+{item.tags.length - 5}</span>
              {/if}
            </div>
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
      <h3>{editingItem ? '编辑日记' : '写日记'}</h3>

      <div class="form-group">
        <label for="td-content">今天的想法 *</label>
        <textarea id="td-content" bind:value={formContent} placeholder="写下你的想法..." rows="8"></textarea>
      </div>

      <div class="form-group">
        <label for="td-mood">心情</label>
        <div class="mood-picker">
          {#each moodOptions as mood}
            <button
              class="mood-btn"
              class:selected={formMood === mood.value}
              on:click={() => formMood = mood.value}
              title={mood.label}
            >
              {#if mood.emoji}
                {mood.emoji}
              {:else}
                无
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="td-theme">主题</label>
        <div class="theme-picker">
          {#each themeOptions as theme}
            <button
              class="theme-btn"
              class:selected={formTheme === theme}
              on:click={() => formTheme = formTheme === theme ? '' : theme}
            >
              {theme}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="td-tags">标签（逗号分隔）</label>
        <input id="td-tags" type="text" bind:value={formTags} placeholder="标签1, 标签2" />
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" bind:checked={formIsPrivate} />
          私密日记
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
  .thought-diary {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  .diary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .diary-header h2 {
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

  .diary-toolbar {
    margin-bottom: 20px;
  }

  .search-box {
    display: flex;
    gap: 8px;
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

  .thought-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .thought-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .thought-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #888;
  }

  .date {
    font-weight: 500;
    color: #555;
  }

  .mood {
    padding: 2px 8px;
    background: #fef3c7;
    color: #d97706;
    border-radius: 4px;
  }

  .theme {
    padding: 2px 8px;
    background: #e0e7ff;
    color: #4f46e5;
    border-radius: 4px;
  }

  .private {
    padding: 2px 8px;
    background: #f3f4f6;
    color: #6b7280;
    border-radius: 4px;
  }

  .card-content {
    margin: 0 0 12px;
    font-size: 15px;
    color: #333;
    line-height: 1.6;
    white-space: pre-wrap;
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
    max-width: 600px;
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

  .mood-picker, .theme-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mood-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #eee;
    border-radius: 8px;
    background: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mood-btn.selected {
    border-color: #667eea;
    background: #f0f4ff;
  }

  .theme-btn {
    padding: 6px 12px;
    border: 2px solid #eee;
    border-radius: 16px;
    background: white;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .theme-btn.selected {
    border-color: #667eea;
    background: #667eea;
    color: white;
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
