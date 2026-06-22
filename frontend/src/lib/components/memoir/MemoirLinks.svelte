<script lang="ts">
  import { onMount } from 'svelte';
  import type { Memoir, MemoirLink, AiConfig } from '../../api';
  import { getMemoirLinks, getMemoirs, saveMemoirLink, deleteMemoirLink, aiFindRelated } from '../../api';
  
  export let memoir: Memoir;
  export let onSelect: (memoir: Memoir) => void = () => {};
  export let aiConfig: AiConfig | undefined = undefined;

  let links: MemoirLink[] = [];
  let linkedMemoirs: Array<{link: MemoirLink, memoir: Memoir | null}> = [];
  let allMemoirs: Memoir[] = [];
  let isLoading = false;
  let isAnalyzing = false;
  let error = '';

  // AI 配置（外部未传入时回退到 localStorage）
  const localAiConfig: AiConfig = (() => {
    try {
      const saved = localStorage.getItem('ai-config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load AI config:', e);
    }
    return { provider: 'ollama', api_url: 'http://localhost:11434', api_key: undefined, model: 'qwen2.5:7b' };
  })();
  $: effectiveAiConfig = aiConfig || localAiConfig;

  onMount(() => {
    loadData();
  });
  
  async function loadData() {
    isLoading = true;
    error = '';
    
    try {
      // 并行加载关联和所有回忆
      const [linksResponse, memoirsResponse] = await Promise.all([
        getMemoirLinks(memoir.id),
        getMemoirs()
      ]);
      
      if (linksResponse.success && linksResponse.data) {
        links = linksResponse.data;
      }
      
      if (memoirsResponse.success && memoirsResponse.data) {
        allMemoirs = memoirsResponse.data;
      }
      
      // 关联回忆详情
      linkedMemoirs = links.map(link => ({
        link,
        memoir: allMemoirs.find(m => m.id === (link.from_id === memoir.id ? link.to_id : link.from_id)) || null
      }));
    } catch (e) {
      error = '加载关联失败';
    } finally {
      isLoading = false;
    }
  }
  
  async function handleAnalyze() {
    if (!effectiveAiConfig) {
      error = '请先配置 AI';
      return;
    }

    isAnalyzing = true;
    error = '';

    try {
      const response = await aiFindRelated(
        effectiveAiConfig,
        memoir.id,
        memoir.title,
        memoir.content,
        allMemoirs
      );

      if (response.success && response.content) {
        const result = JSON.parse(response.content);

        if (result.related && Array.isArray(result.related)) {
          // 保存新发现的关联
          for (const item of result.related) {
            if (!item.memoir_id || !item.relation) continue;

            // 检查是否已存在
            const exists = links.some(l =>
              (l.from_id === memoir.id && l.to_id === item.memoir_id) ||
              (l.from_id === item.memoir_id && l.to_id === memoir.id)
            );

            if (!exists) {
              const newLink: MemoirLink = {
                id: crypto.randomUUID(),
                from_id: memoir.id,
                to_id: item.memoir_id,
                relation: item.relation,
                created_at: new Date().toISOString()
              };

              await saveMemoirLink(newLink);
            }
          }

          // 重新加载
          await loadData();
        }
      } else {
        error = response.error || 'AI 分析失败';
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        error = 'AI 返回格式异常，请重试';
      } else {
        error = 'AI 分析失败，请检查配置';
      }
    } finally {
      isAnalyzing = false;
    }
  }
  
  async function handleDeleteLink(linkId: string) {
    try {
      const response = await deleteMemoirLink(linkId);
      if (response.success) {
        await loadData();
      } else {
        error = response.error || '删除失败';
      }
    } catch (e) {
      error = '删除失败';
    }
  }
</script>

<div class="memoir-links">
  <div class="links-header">
    <h4>🔗 关联回忆</h4>
    <button 
      class="analyze-btn" 
      on:click={handleAnalyze}
      disabled={isAnalyzing || allMemoirs.length < 2}
    >
      {isAnalyzing ? '分析中...' : '🤖 AI 发现关联'}
    </button>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if isLoading}
    <div class="loading">加载中...</div>
  {:else if linkedMemoirs.length === 0}
    <div class="empty-state">
      <p>暂无关联回忆</p>
      <p class="hint">点击"AI 发现关联"自动分析</p>
    </div>
  {:else}
    <div class="links-list">
      {#each linkedMemoirs as item}
        {#if item.memoir}
          <div class="link-card">
            <button
              type="button"
              class="link-content"
              on:click={() => item.memoir && onSelect(item.memoir)}
            >
              <div class="link-relation">{item.link.relation}</div>
              <div class="linked-memoir">
                <span class="memoir-title">{item.memoir.title}</span>
                {#if item.memoir.summary}
                  <span class="memoir-summary">{item.memoir.summary}</span>
                {/if}
              </div>
            </button>
            <button
              type="button"
              class="delete-btn"
              on:click={() => handleDeleteLink(item.link.id)}
              title="删除关联"
            >
              ×
            </button>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .memoir-links {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }
  
  .links-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .links-header h4 {
    margin: 0;
    font-size: 1rem;
    color: #333;
  }
  
  .analyze-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: opacity 0.2s;
  }
  
  .analyze-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  .analyze-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .loading {
    text-align: center;
    padding: 1rem;
    color: #666;
  }
  
  .error-message {
    background: #fee;
    color: #c00;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 1.5rem;
    color: #666;
    background: #f9f9f9;
    border-radius: 8px;
  }
  
  .empty-state p {
    margin: 0.25rem 0;
  }
  
  .hint {
    font-size: 0.8rem;
    color: #999;
  }
  
  .links-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .link-card {
    display: flex;
    align-items: stretch;
    background: white;
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .link-content {
    flex: 1;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.2s;
    background: none;
    border: none;
    text-align: left;
    font: inherit;
    color: inherit;
  }

  .link-content:hover {
    background: #f5f5ff;
  }
  
  .link-relation {
    font-size: 0.85rem;
    color: #667eea;
    margin-bottom: 0.5rem;
    font-style: italic;
  }
  
  .linked-memoir {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .memoir-title {
    font-weight: 500;
    color: #333;
  }
  
  .memoir-summary {
    font-size: 0.8rem;
    color: #666;
  }
  
  .delete-btn {
    background: #fee;
    border: none;
    padding: 0 0.75rem;
    cursor: pointer;
    font-size: 1.2rem;
    color: #c00;
    transition: background 0.2s;
  }
  
  .delete-btn:hover {
    background: #fdd;
  }
</style>
