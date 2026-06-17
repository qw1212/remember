<script lang="ts">
  import type { Memoir } from '../../api';
  import { formatDate } from '../../utils';
  
  export let memoir: Memoir;
  export let onEdit: (memoir: Memoir) => void = () => {};
  export let onDelete: (id: string) => void = () => {};
  
  const categoryLabels: Record<string, string> = {
    travel: '旅行',
    family: '家庭',
    work: '工作',
    growth: '成长',
    milestone: '里程碑',
    daily: '日常',
    life: '生活'
  };
  
  const emotionEmojis: Record<string, string> = {
    '开心': '😊',
    '感动': '🥹',
    '怀念': '💭',
    '成长': '🌱',
    '感恩': '🙏',
    '遗憾': '😔',
    '温暖': '🥰',
    '激动': '🎉',
    '平静': '😌',
    '忧伤': '😢'
  };
  
  function truncateText(text: string, maxLength: number = 150): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
</script>

<div class="memoir-card">
  <div class="card-header">
    <div class="card-meta">
      <span class="category">{categoryLabels[memoir.category] || memoir.category}</span>
      {#if memoir.emotion}
        <span class="emotion">{emotionEmojis[memoir.emotion] || ''} {memoir.emotion}</span>
      {/if}
    </div>
    <div class="card-actions">
      <button class="action-btn" on:click={() => onEdit(memoir)} title="编辑">
        ✏️
      </button>
      <button class="action-btn" on:click={() => onDelete(memoir.id)} title="删除">
        🗑️
      </button>
    </div>
  </div>
  
  <h3 class="card-title">{memoir.title}</h3>
  
  {#if memoir.summary}
    <p class="card-summary">{memoir.summary}</p>
  {/if}
  
  <p class="card-content">{truncateText(memoir.content)}</p>
  
  <div class="card-footer">
    {#if memoir.event_date}
      <span class="event-date">📅 {memoir.event_date}</span>
    {/if}
    {#if memoir.location}
      <span class="location">📍 {memoir.location}</span>
    {/if}
  </div>
  
  {#if memoir.people.length > 0}
    <div class="card-people">
      {#each memoir.people as person}
        <span class="person-tag">👤 {person}</span>
      {/each}
    </div>
  {/if}
  
  {#if memoir.tags.length > 0}
    <div class="card-tags">
      {#each memoir.tags as tag}
        <span class="tag">#{tag}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .memoir-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .memoir-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }
  
  .card-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .category {
    background: #e8f4f8;
    color: #0066cc;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.8rem;
  }
  
  .emotion {
    color: #666;
    font-size: 0.85rem;
  }
  
  .card-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .memoir-card:hover .card-actions {
    opacity: 1;
  }
  
  .action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .action-btn:hover {
    background: #f0f0f0;
  }
  
  .card-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.15rem;
    color: #333;
  }
  
  .card-summary {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
    font-style: italic;
  }
  
  .card-content {
    color: #444;
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
  }
  
  .card-footer {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
    font-size: 0.85rem;
    color: #888;
  }
  
  .card-people {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .person-tag {
    background: #f0e6ff;
    color: #6b4ce6;
    padding: 0.2rem 0.6rem;
    border-radius: 1rem;
    font-size: 0.8rem;
  }
  
  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .tag {
    color: #667eea;
    font-size: 0.8rem;
  }
</style>
