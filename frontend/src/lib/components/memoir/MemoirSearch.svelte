<script lang="ts">
  import { onMount } from 'svelte';
  import type { Memoir, AiConfig } from '../../api';
  import { searchMemoirs, getMemoirs, aiChat } from '../../api';
  
  export let onSelect: (memoir: Memoir) => void = () => {};
  
  let searchQuery = '';
  let searchResults: Memoir[] = [];
  let allMemoirs: Memoir[] = [];
  let isLoading = false;
  let error = '';
  let searchMode: 'keyword' | 'ai' = 'keyword';
  let aiExplanation = '';
  
  // AI 配置
  let aiConfig: AiConfig = {
    provider: localStorage.getItem('ai_provider') || 'ollama',
    api_url: localStorage.getItem('ai_api_url') || 'http://localhost:11434',
    api_key: localStorage.getItem('ai_api_key') || undefined,
    model: localStorage.getItem('ai_model') || 'qwen2.5:7b'
  };
  
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
  
  onMount(() => {
    loadAllMemoirs();
  });
  
  async function loadAllMemoirs() {
    try {
      const response = await getMemoirs();
      if (response.success && response.data) {
        allMemoirs = response.data;
      }
    } catch (e) {
      console.error('加载回忆列表失败:', e);
    }
  }
  
  async function handleSearch() {
    if (!searchQuery.trim()) {
      searchResults = [];
      aiExplanation = '';
      return;
    }
    
    isLoading = true;
    error = '';
    aiExplanation = '';
    
    if (searchMode === 'keyword') {
      await keywordSearch();
    } else {
      await aiSearch();
    }
    
    isLoading = false;
  }
  
  async function keywordSearch() {
    try {
      const response = await searchMemoirs(searchQuery);
      if (response.success && response.data) {
        searchResults = response.data;
      } else {
        error = response.error || '搜索失败';
      }
    } catch (e) {
      error = '搜索失败';
    }
  }
  
  async function aiSearch() {
    // 使用 AI 进行语义搜索
    const prompt = `你是一个回忆搜索助手。用户想搜索回忆，查询是："${searchQuery}"

以下是所有回忆的列表（JSON格式）：
${JSON.stringify(allMemoirs.map(m => ({
  id: m.id,
  title: m.title,
  summary: m.summary,
  tags: m.tags,
  people: m.people,
  location: m.location,
  category: m.category,
  emotion: m.emotion
})), null, 2)}

请根据用户的查询，从列表中找出最相关的回忆（最多5个）。
返回格式：
{
  "relevant_ids": ["id1", "id2", ...],
  "explanation": "为什么这些回忆相关"
}

只返回JSON，不要其他文字。`;

    try {
      const messages = [
        { role: 'system', content: '你是回忆搜索助手。' },
        { role: 'user', content: prompt }
      ];
      
      const response = await aiChat(aiConfig, messages);
      if (response.success && response.content) {
        const result = JSON.parse(response.content);
        searchResults = allMemoirs.filter(m => result.relevant_ids?.includes(m.id));
        aiExplanation = result.explanation || '';
      } else {
        // 降级到关键词搜索
        await keywordSearch();
      }
    } catch (e) {
      // 降级到关键词搜索
      await keywordSearch();
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  }
  
  function truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  function highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
</script>

<div class="smart-search">
  <div class="search-header">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        bind:value={searchQuery}
        on:keydown={handleKeyDown}
        placeholder={searchMode === 'keyword' ? '搜索回忆...' : '用自然语言描述你想找的回忆...'}
        class="search-input"
      />
      <button class="search-btn" on:click={handleSearch} disabled={isLoading || !searchQuery.trim()}>
        {isLoading ? '搜索中...' : '搜索'}
      </button>
    </div>
    
    <div class="search-mode">
      <button 
        class="mode-btn" 
        class:active={searchMode === 'keyword'}
        on:click={() => searchMode = 'keyword'}
      >
        关键词
      </button>
      <button 
        class="mode-btn" 
        class:active={searchMode === 'ai'}
        on:click={() => searchMode = 'ai'}
      >
        🤖 AI 语义
      </button>
    </div>
  </div>
  
  {#if searchMode === 'ai'}
    <div class="ai-hint">
      <p>💡 AI 语义搜索支持自然语言，如"那年夏天在海边的事"、"和家人一起的旅行"</p>
    </div>
  {/if}
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if aiExplanation}
    <div class="ai-explanation">
      <p>🤖 {aiExplanation}</p>
    </div>
  {/if}
  
  {#if searchResults.length > 0}
    <div class="search-results">
      <p class="results-count">找到 {searchResults.length} 条相关回忆</p>
      
      {#each searchResults as memoir}
        <div class="result-card" on:click={() => onSelect(memoir)}>
          <div class="card-header">
            <span class="category">{categoryLabels[memoir.category] || memoir.category}</span>
            {#if memoir.emotion}
              <span class="emotion">{emotionEmojis[memoir.emotion] || ''}</span>
            {/if}
          </div>
          
          <h4 class="card-title">{@html highlightText(memoir.title, searchQuery)}</h4>
          
          {#if memoir.summary}
            <p class="card-summary">{@html highlightText(memoir.summary, searchQuery)}</p>
          {:else}
            <p class="card-content">{@html highlightText(truncateText(memoir.content), searchQuery)}</p>
          {/if}
          
          <div class="card-meta">
            {#if memoir.event_date}
              <span>📅 {memoir.event_date}</span>
            {/if}
            {#if memoir.location}
              <span>📍 {memoir.location}</span>
            {/if}
          </div>
          
          {#if memoir.tags.length > 0}
            <div class="card-tags">
              {#each memoir.tags.slice(0, 5) as tag}
                <span class="tag">#{tag}</span>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else if searchQuery && !isLoading}
    <div class="empty-results">
      <p>😔</p>
      <p>未找到相关回忆</p>
      <p class="hint">试试其他关键词，或使用 AI 语义搜索</p>
    </div>
  {/if}
</div>

<style>
  .smart-search {
    width: 100%;
  }
  
  .search-header {
    margin-bottom: 1rem;
  }
  
  .search-box {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #ddd;
    border-radius: 10px;
    padding: 0 0.75rem;
    margin-bottom: 0.75rem;
  }
  
  .search-icon {
    font-size: 1.1rem;
    margin-right: 0.5rem;
  }
  
  .search-input {
    flex: 1;
    border: none;
    padding: 0.85rem 0;
    font-size: 1rem;
    outline: none;
    background: transparent;
  }
  
  .search-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .search-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  .search-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .search-mode {
    display: flex;
    gap: 0.5rem;
  }
  
  .mode-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }
  
  .mode-btn:hover {
    background: #f0f0f0;
  }
  
  .mode-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
  }
  
  .ai-hint {
    background: #f0f0ff;
    color: #444;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.85rem;
  }
  
  .ai-hint p {
    margin: 0;
  }
  
  .error-message {
    background: #fee;
    color: #c00;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .ai-explanation {
    background: #e8f4f8;
    color: #0066cc;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .ai-explanation p {
    margin: 0;
  }
  
  .results-count {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }
  
  .search-results {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .result-card {
    background: white;
    border-radius: 10px;
    padding: 1.25rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .result-card:hover {
    transform: translateY(-2px);
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
    padding: 0.2rem 0.6rem;
    border-radius: 1rem;
    font-size: 0.75rem;
  }
  
  .emotion {
    font-size: 1.1rem;
  }
  
  .card-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.05rem;
    color: #333;
  }
  
  .card-title :global(mark) {
    background: #fff3cd;
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
  }
  
  .card-summary {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
    font-style: italic;
  }
  
  .card-summary :global(mark) {
    background: #fff3cd;
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
  }
  
  .card-content {
    color: #444;
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
    line-height: 1.5;
  }
  
  .card-content :global(mark) {
    background: #fff3cd;
    padding: 0.1rem 0.2rem;
    border-radius: 2px;
  }
  
  .card-meta {
    display: flex;
    gap: 1rem;
    color: #888;
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
  }
  
  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  
  .tag {
    color: #667eea;
    font-size: 0.8rem;
  }
  
  .empty-results {
    text-align: center;
    padding: 3rem;
    color: #666;
    background: white;
    border-radius: 12px;
  }
  
  .empty-results p:first-child {
    font-size: 2.5rem;
    margin: 0 0 0.75rem 0;
  }
  
  .empty-results p {
    margin: 0.5rem 0;
  }
  
  .hint {
    font-size: 0.9rem;
    color: #999;
  }
</style>
