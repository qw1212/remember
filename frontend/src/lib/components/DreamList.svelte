<script lang="ts">
  import { onMount } from 'svelte';
  import type { Dream } from '../api';
  import { getDreams, saveDream, deleteDream, searchDreams } from '../api';

  let dreams: Dream[] = [];
  let isLoading = false;
  let showForm = false;
  let editingDream: Dream | null = null;
  let error = '';
  let searchKeyword = '';
  let filterCategory = '';
  let filterStatus = '';

  // 表单数据
  let formTitle = '';
  let formDescription = '';
  let formCategory = 'personal';
  let formTargetDate = '';
  let formProgress = 0;
  let formStatus = 'pending';
  let formSteps: string[] = [];
  let formTags = '';
  let newStep = '';

  const categoryOptions = [
    { value: 'travel', label: '旅行', emoji: '✈️' },
    { value: 'career', label: '事业', emoji: '💼' },
    { value: 'health', label: '健康', emoji: '💪' },
    { value: 'learning', label: '学习', emoji: '📚' },
    { value: 'personal', label: '个人', emoji: '🌟' },
    { value: 'other', label: '其他', emoji: '📌' },
  ];

  const statusOptions = [
    { value: 'pending', label: '待开始', color: '#8b5cf6' },
    { value: 'in_progress', label: '进行中', color: '#3b82f6' },
    { value: 'completed', label: '已完成', color: '#10b981' },
    { value: 'abandoned', label: '已放弃', color: '#6b7280' },
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
        response = await searchDreams(searchKeyword.trim());
      } else {
        response = await getDreams();
      }
      if (response.success && response.data) {
        dreams = response.data;
      }
    } catch (e) {
      error = '加载数据失败';
    } finally {
      isLoading = false;
    }
  }

  $: filteredDreams = dreams.filter(d => {
    if (filterCategory && d.category !== filterCategory) return false;
    if (filterStatus && d.status !== filterStatus) return false;
    return true;
  });

  function getCategoryEmoji(category: string): string {
    return categoryOptions.find(c => c.value === category)?.emoji || '📌';
  }

  function getCategoryLabel(category: string): string {
    return categoryOptions.find(c => c.value === category)?.label || '其他';
  }

  function getStatusLabel(status: string): string {
    return statusOptions.find(s => s.value === status)?.label || status;
  }

  function getStatusColor(status: string): string {
    return statusOptions.find(s => s.value === status)?.color || '#6b7280';
  }

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function openAddForm() {
    editingDream = null;
    formTitle = '';
    formDescription = '';
    formCategory = 'personal';
    formTargetDate = '';
    formProgress = 0;
    formStatus = 'pending';
    formSteps = [];
    formTags = '';
    newStep = '';
    showForm = true;
  }

  function openEditForm(dream: Dream) {
    editingDream = dream;
    formTitle = dream.title;
    formDescription = dream.description || '';
    formCategory = dream.category;
    formTargetDate = dream.target_date || '';
    formProgress = dream.progress;
    formStatus = dream.status;
    formSteps = [...dream.steps];
    formTags = dream.tags.join(', ');
    newStep = '';
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    editingDream = null;
  }

  function addStep() {
    if (newStep.trim()) {
      formSteps = [...formSteps, newStep.trim()];
      newStep = '';
    }
  }

  function removeStep(index: number) {
    formSteps = formSteps.filter((_, i) => i !== index);
  }

  function handleStepKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addStep();
    }
  }

  async function handleSave() {
    if (!formTitle.trim()) {
      error = '请输入梦想标题';
      return;
    }

    const now = new Date().toISOString();
    const dream: Dream = {
      id: editingDream?.id || crypto.randomUUID(),
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      target_date: formTargetDate || undefined,
      progress: formProgress,
      status: formStatus,
      steps: formSteps,
      tags: formTags.split(',').map(t => t.trim()).filter(t => t),
      created_at: editingDream?.created_at || now,
      updated_at: now,
    };

    try {
      const response = await saveDream(dream);
      if (response.success) {
        closeForm();
        await loadData();
      } else {
        error = response.error || '保存失败';
      }
    } catch (e) {
      error = '保存失败';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个梦想吗？')) return;

    try {
      const response = await deleteDream(id);
      if (response.success) {
        await loadData();
      } else {
        error = response.error || '删除失败';
      }
    } catch (e) {
      error = '删除失败';
    }
  }

  async function toggleStatus(dream: Dream) {
    const nextStatus: Record<string, string> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
      abandoned: 'pending',
    };
    const updated: Dream = {
      ...dream,
      status: nextStatus[dream.status] || 'pending',
      progress: nextStatus[dream.status] === 'completed' ? 100 : dream.progress,
      updated_at: new Date().toISOString(),
    };
    try {
      const response = await saveDream(updated);
      if (response.success) {
        await loadData();
      }
    } catch (e) {
      error = '更新状态失败';
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

<div class="dream-list">
  <div class="dream-header">
    <h2>梦想清单</h2>
    <button class="btn-add" on:click={openAddForm}>+ 添加梦想</button>
  </div>

  <div class="dream-toolbar">
    <div class="search-box">
      <input
        type="text"
        bind:value={searchKeyword}
        placeholder="搜索梦想..."
        on:keydown={handleSearchKeydown}
      />
      <button class="btn-search" on:click={handleSearch}>搜索</button>
    </div>
    <div class="filter-box">
      <select bind:value={filterCategory}>
        <option value="">全部分类</option>
        {#each categoryOptions as cat}
          <option value={cat.value}>{cat.emoji} {cat.label}</option>
        {/each}
      </select>
      <select bind:value={filterStatus}>
        <option value="">全部状态</option>
        {#each statusOptions as status}
          <option value={status.value}>{status.label}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if filteredDreams.length === 0}
    <div class="empty-state">
      <p>{searchKeyword || filterCategory || filterStatus ? '没有找到匹配的梦想' : '还没有梦想，点击上方按钮开始规划吧！'}</p>
    </div>
  {:else}
    <div class="dream-grid">
      {#each filteredDreams as dream (dream.id)}
        <div class="dream-card" class:completed={dream.status === 'completed'}>
          <div class="card-header">
            <span class="category-badge">{getCategoryEmoji(dream.category)} {getCategoryLabel(dream.category)}</span>
            <button
              class="status-badge"
              style="background: {getStatusColor(dream.status)}20; color: {getStatusColor(dream.status)}; border: 1px solid {getStatusColor(dream.status)}40"
              on:click={() => toggleStatus(dream)}
              title="点击切换状态"
            >
              {getStatusLabel(dream.status)}
            </button>
          </div>

          <h3 class="card-title">{dream.title}</h3>

          {#if dream.description}
            <p class="card-desc">{dream.description}</p>
          {/if}

          <div class="progress-section">
            <div class="progress-header">
              <span>进度</span>
              <span>{dream.progress}%</span>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                style="width: {dream.progress}%; background: {getStatusColor(dream.status)}"
              ></div>
            </div>
          </div>

          {#if dream.target_date}
            <div class="target-date">
              目标日期：{formatDate(dream.target_date)}
            </div>
          {/if}

          {#if dream.steps.length > 0}
            <div class="steps-section">
              <div class="steps-label">分解步骤：</div>
              <ul class="steps-list">
                {#each dream.steps.slice(0, 3) as step}
                  <li>{step}</li>
                {/each}
                {#if dream.steps.length > 3}
                  <li class="more-steps">还有 {dream.steps.length - 3} 个步骤...</li>
                {/if}
              </ul>
            </div>
          {/if}

          {#if dream.tags.length > 0}
            <div class="card-tags">
              {#each dream.tags.slice(0, 4) as tag}
                <span class="tag">{tag}</span>
              {/each}
              {#if dream.tags.length > 4}
                <span class="tag-more">+{dream.tags.length - 4}</span>
              {/if}
            </div>
          {/if}

          <div class="card-actions">
            <button class="btn-icon" on:click={() => openEditForm(dream)} title="编辑">✏️</button>
            <button class="btn-icon" on:click={() => handleDelete(dream.id)} title="删除">🗑️</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showForm}
  <div class="modal-overlay" role="button" tabindex="0" on:click={closeForm} on:keydown={(e) => e.key === 'Escape' && closeForm()}>
    <div class="modal" role="dialog" on:click|stopPropagation on:keydown|stopPropagation>
      <h3>{editingDream ? '编辑梦想' : '添加梦想'}</h3>

      <div class="form-group">
        <label for="dl-title">梦想标题 *</label>
        <input id="dl-title" type="text" bind:value={formTitle} placeholder="你的梦想是什么？" />
      </div>

      <div class="form-group">
        <label for="dl-desc">描述</label>
        <textarea id="dl-desc" bind:value={formDescription} placeholder="详细描述一下这个梦想..." rows="3"></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="dl-category">分类</label>
          <select id="dl-category" bind:value={formCategory}>
            {#each categoryOptions as cat}
              <option value={cat.value}>{cat.emoji} {cat.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="dl-status">状态</label>
          <select id="dl-status" bind:value={formStatus}>
            {#each statusOptions as status}
              <option value={status.value}>{status.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="dl-date">目标日期</label>
          <input id="dl-date" type="date" bind:value={formTargetDate} />
        </div>

        <div class="form-group">
          <label for="dl-progress">进度 ({formProgress}%)</label>
          <input id="dl-progress" type="range" min="0" max="100" bind:value={formProgress} />
        </div>
      </div>

      <div class="form-group">
        <label>分解步骤</label>
        <div class="step-input">
          <input
            type="text"
            bind:value={newStep}
            placeholder="添加一个步骤..."
            on:keydown={handleStepKeydown}
          />
          <button class="btn-step-add" on:click={addStep}>添加</button>
        </div>
        {#if formSteps.length > 0}
          <ul class="step-list-edit">
            {#each formSteps as step, i}
              <li>
                <span>{step}</span>
                <button class="btn-step-remove" on:click={() => removeStep(i)}>×</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="form-group">
        <label for="dl-tags">标签（逗号分隔）</label>
        <input id="dl-tags" type="text" bind:value={formTags} placeholder="标签1, 标签2" />
      </div>

      <div class="form-actions">
        <button class="btn-cancel" on:click={closeForm}>取消</button>
        <button class="btn-save" on:click={handleSave}>保存</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dream-list {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
  }

  .dream-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .dream-header h2 {
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

  .dream-toolbar {
    display: flex;
    gap: 12px;
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

  .filter-box {
    display: flex;
    gap: 8px;
  }

  .filter-box select {
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
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

  .dream-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .dream-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .dream-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .dream-card.completed {
    opacity: 0.7;
  }

  .dream-card.completed .card-title {
    text-decoration: line-through;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .category-badge {
    font-size: 13px;
    padding: 2px 8px;
    background: #f0f4ff;
    color: #4f46e5;
    border-radius: 4px;
  }

  .status-badge {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 12px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .status-badge:hover {
    transform: scale(1.05);
  }

  .card-title {
    margin: 0 0 8px;
    font-size: 18px;
    color: #333;
  }

  .card-desc {
    margin: 0 0 12px;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .progress-section {
    margin-bottom: 12px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #888;
    margin-bottom: 4px;
  }

  .progress-bar {
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .target-date {
    font-size: 13px;
    color: #888;
    margin-bottom: 8px;
  }

  .steps-section {
    margin-bottom: 12px;
  }

  .steps-label {
    font-size: 13px;
    color: #888;
    margin-bottom: 4px;
  }

  .steps-list {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: #555;
  }

  .steps-list li {
    margin-bottom: 2px;
  }

  .more-steps {
    color: #999;
    font-style: italic;
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
  .form-group textarea,
  .form-group select {
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

  .form-group input[type="range"] {
    padding: 0;
    border: none;
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .form-row .form-group {
    flex: 1;
  }

  .step-input {
    display: flex;
    gap: 8px;
  }

  .step-input input {
    flex: 1;
  }

  .btn-step-add {
    padding: 10px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    white-space: nowrap;
  }

  .step-list-edit {
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }

  .step-list-edit li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    border-radius: 6px;
    margin-bottom: 4px;
    font-size: 14px;
  }

  .btn-step-remove {
    background: none;
    border: none;
    color: #ef4444;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
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
