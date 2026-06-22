<script lang="ts">
  import { onMount } from 'svelte';
  import type { Memoir } from '../../api';
  import { getMemoirs } from '../../api';
  import { categoryLabels, emotionEmojis } from '../../memoir/constants';
  import { truncateText } from '../../utils';
  
  export let onSelect: (memoir: Memoir) => void = () => {};
  
  let memoirs: Memoir[] = [];
  let timelineGroups: Array<{date: string, items: Memoir[]}> = [];
  let isLoading = false;
  let error = '';
  let filterYear = '';
  let filterCategory = '';
  let availableYears: string[] = [];

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
        extractYears();
        groupMemoirs();
      } else {
        error = response.error || '加载失败';
      }
    } catch (e) {
      error = '加载回忆列表失败';
    } finally {
      isLoading = false;
    }
  }
  
  function extractYears() {
    const years = new Set<string>();
    memoirs.forEach(m => {
      if (m.event_date) {
        const year = m.event_date.substring(0, 4);
        if (year.match(/^\d{4}$/)) {
          years.add(year);
        }
      }
    });
    availableYears = Array.from(years).sort((a, b) => b.localeCompare(a));
  }
  
  function groupMemoirs() {
    const filtered = memoirs.filter(m => {
      if (filterYear && (!m.event_date || !m.event_date.startsWith(filterYear))) {
        return false;
      }
      if (filterCategory && m.category !== filterCategory) {
        return false;
      }
      return true;
    });
    
    // 按日期分组
    const groups: Record<string, Memoir[]> = {};
    filtered.forEach(m => {
      const dateKey = m.event_date || '未知时间';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(m);
    });
    
    // 转换为数组并排序
    timelineGroups = Object.entries(groups)
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => {
        if (a.date === '未知时间') return 1;
        if (b.date === '未知时间') return -1;
        return b.date.localeCompare(a.date);
      });
  }
  
  function handleFilterChange() {
    groupMemoirs();
  }
</script>

<div class="timeline">
  <div class="timeline-filters">
    <select bind:value={filterYear} on:change={handleFilterChange}>
      <option value="">所有年份</option>
      {#each availableYears as year}
        <option value={year}>{year}年</option>
      {/each}
    </select>
    
    <select bind:value={filterCategory} on:change={handleFilterChange}>
      <option value="">所有分类</option>
      {#each Object.entries(categoryLabels) as [value, label]}
        <option value={value}>{label}</option>
      {/each}
    </select>
  </div>
  
  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error-message">{error}</div>
  {:else if timelineGroups.length === 0}
    <div class="empty-state">
      <p>📅</p>
      <p>暂无回忆记录</p>
      <p class="hint">通过对话记录你的第一段回忆</p>
    </div>
  {:else}
    <div class="timeline-list">
      {#each timelineGroups as group}
        <div class="timeline-group">
          <div class="timeline-date">
            <span class="date-dot"></span>
            <span class="date-text">{group.date}</span>
          </div>
          
          <div class="timeline-items">
            {#each group.items as memoir}
              <div class="timeline-card" on:click={() => onSelect(memoir)}>
                <div class="card-header">
                  <span class="category">{categoryLabels[memoir.category] || memoir.category}</span>
                  {#if memoir.emotion}
                    <span class="emotion">{emotionEmojis[memoir.emotion] || ''}</span>
                  {/if}
                </div>
                
                <h4 class="card-title">{memoir.title}</h4>
                
                {#if memoir.summary}
                  <p class="card-summary">{memoir.summary}</p>
                {:else}
                  <p class="card-content">{truncateText(memoir.content)}</p>
                {/if}
                
                {#if memoir.location}
                  <span class="location">📍 {memoir.location}</span>
                {/if}
                
                {#if memoir.people.length > 0}
                  <div class="card-people">
                    {#each memoir.people.slice(0, 3) as person}
                      <span class="person-tag">👤 {person}</span>
                    {/each}
                    {#if memoir.people.length > 3}
                      <span class="person-more">+{memoir.people.length - 3}</span>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .timeline {
    width: 100%;
  }
  
  .timeline-filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .timeline-filters select {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.95rem;
    outline: none;
    background: white;
  }
  
  .timeline-filters select:focus {
    border-color: #667eea;
  }
  
  .loading {
    text-align: center;
    padding: 3rem;
    color: #666;
  }
  
  .error-message {
    background: #fee;
    color: #c00;
    padding: 0.75rem 1rem;
    border-radius: 8px;
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
  
  .timeline-list {
    position: relative;
    padding-left: 2rem;
  }
  
  .timeline-list::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #ddd;
  }
  
  .timeline-group {
    margin-bottom: 2rem;
  }
  
  .timeline-date {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    position: relative;
  }
  
  .date-dot {
    position: absolute;
    left: -1.75rem;
    width: 12px;
    height: 12px;
    background: #667eea;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #667eea;
  }
  
  .date-text {
    font-weight: 600;
    color: #333;
    font-size: 1.1rem;
  }
  
  .timeline-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .timeline-card {
    background: white;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .timeline-card:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .category {
    background: #e8f4f8;
    color: #0066cc;
    padding: 0.15rem 0.6rem;
    border-radius: 1rem;
    font-size: 0.75rem;
  }
  
  .emotion {
    font-size: 1.1rem;
  }
  
  .card-title {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #333;
  }
  
  .card-summary {
    color: #666;
    font-size: 0.85rem;
    margin: 0 0 0.5rem 0;
    font-style: italic;
  }
  
  .card-content {
    color: #444;
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
    line-height: 1.5;
  }
  
  .location {
    color: #888;
    font-size: 0.8rem;
    display: inline-block;
    margin-bottom: 0.5rem;
  }
  
  .card-people {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
  
  .person-tag {
    background: #f0e6ff;
    color: #6b4ce6;
    padding: 0.15rem 0.5rem;
    border-radius: 1rem;
    font-size: 0.75rem;
  }
  
  .person-more {
    color: #888;
    font-size: 0.75rem;
    padding: 0.15rem 0.3rem;
  }
</style>
