<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { listen } from '@tauri-apps/api/event';
  import type { Memoir, AiConfig, ChatMessage } from '../../api';
  import { aiChatStream, saveMemoir, getMemoirPrompt } from '../../api';
  
  export let memoir: Memoir | null = null;
  export let onSave: () => void = () => {};
  export let onCancel: () => void = () => {};
  export let aiConfig: AiConfig = (() => {
    try {
      const saved = localStorage.getItem('ai-config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load AI config:', e);
    }
    return { provider: 'ollama', api_url: 'http://localhost:11434', api_key: undefined, model: 'qwen2.5:7b' };
  })();
  
  let messages: ChatMessage[] = [];
  let userInput = '';
  let isLoading = false;
  let error = '';
  let systemPrompt = '';
  let streamingContent = '';
  
  // 事件监听器取消函数
  let unlistenChunk: (() => void) | null = null;
  let unlistenDone: (() => void) | null = null;
  
  onMount(async () => {
    try {
      systemPrompt = await getMemoirPrompt();
    } catch (e) {
      systemPrompt = '你是一个温暖的回忆记录助手。';
    }
    
    // 初始化对话
    if (memoir) {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `我想编辑之前的回忆：${memoir.title}` },
        { role: 'assistant', content: `好的，让我们来完善这段回忆。当前内容是：\n\n${memoir.content}\n\n你想修改哪些部分？` }
      ];
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: '你好！我是你的回忆记录助手。让我们一起记录下那些珍贵的人生时刻吧。\n\n今天想聊聊什么？可以是一次旅行、一个人、或者一段难忘的经历...' }
      ];
    }
    
    // 设置流式事件监听
    unlistenChunk = await listen<string>('ai-stream-chunk', (event) => {
      streamingContent += event.payload;
      // 触发响应式更新
      messages = [...messages];
    });
    
    unlistenDone = await listen('ai-stream-done', () => {
      if (streamingContent) {
        // 流式完成，将内容添加到消息列表
        messages = [...messages, { role: 'assistant', content: streamingContent }];
        checkForMemoirJson(streamingContent);
        streamingContent = '';
      }
      isLoading = false;
    });
  });
  
  onDestroy(() => {
    // 清理事件监听器
    if (unlistenChunk) unlistenChunk();
    if (unlistenDone) unlistenDone();
  });
  
  async function handleSend() {
    if (!userInput.trim() || isLoading) return;
    
    const userMessage = userInput.trim();
    userInput = '';
    messages = [...messages, { role: 'user', content: userMessage }];
    isLoading = true;
    error = '';
    streamingContent = '';
    
    try {
      const response = await aiChatStream(aiConfig, messages);
      if (!response.success) {
        error = response.error || 'AI 响应失败';
        isLoading = false;
      }
      // 注意：流式数据通过事件接收，不在这里处理
    } catch (e) {
      error = 'AI 请求失败，请检查配置';
      isLoading = false;
    }
  }
  
  function checkForMemoirJson(content: string) {
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const memoirData = JSON.parse(jsonMatch[1]);
        if (memoirData.title && memoirData.content) {
          handleSaveFromJson(memoirData);
        }
      } catch (e) {
        // JSON 解析失败，忽略
      }
    }
  }
  
  async function handleSaveFromJson(data: any) {
    const now = new Date().toISOString();
    const newMemoir: Memoir = {
      id: memoir?.id || crypto.randomUUID(),
      title: data.title,
      content: data.content,
      summary: data.summary || null,
      event_date: data.event_date || null,
      location: data.location || null,
      people: data.people || [],
      tags: data.tags || [],
      category: data.category || 'life',
      emotion: data.emotion || null,
      ai_conversation: JSON.stringify(messages),
      is_private: true,
      created_at: memoir?.created_at || now,
      updated_at: now
    };
    
    try {
      const response = await saveMemoir(newMemoir);
      if (response.success) {
        onSave();
      } else {
        error = response.error || '保存失败';
      }
    } catch (e) {
      error = '保存失败';
    }
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="ai-chat">
  <div class="chat-messages">
    {#each messages as message, i}
      {#if message.role !== 'system'}
        <div class="message {message.role}">
          <div class="message-avatar">
            {message.role === 'user' ? '👤' : '🤖'}
          </div>
          <div class="message-content">
            {message.content}
          </div>
        </div>
      {/if}
    {/each}
    
    <!-- 流式内容实时显示 -->
    {#if streamingContent}
      <div class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          {streamingContent}
          <span class="cursor">|</span>
        </div>
      </div>
    {/if}
    
    {#if isLoading && !streamingContent}
      <div class="message assistant">
        <div class="message-avatar">🤖</div>
        <div class="message-content loading">
          <span class="dot">.</span>
          <span class="dot">.</span>
          <span class="dot">.</span>
        </div>
      </div>
    {/if}
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  <div class="chat-input">
    <textarea
      bind:value={userInput}
      on:keydown={handleKeyDown}
      placeholder="输入你的回忆..."
      rows="3"
      disabled={isLoading}
    ></textarea>
    <div class="input-actions">
      <button class="cancel-btn" on:click={onCancel}>取消</button>
      <button class="send-btn" on:click={handleSend} disabled={isLoading || !userInput.trim()}>
        {isLoading ? '发送中...' : '发送'}
      </button>
    </div>
  </div>
</div>

<style>
  .ai-chat {
    display: flex;
    flex-direction: column;
    height: 600px;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .message {
    display: flex;
    gap: 0.75rem;
    max-width: 80%;
  }
  
  .message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }
  
  .message-avatar {
    font-size: 1.5rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .message-content {
    padding: 0.75rem 1rem;
    border-radius: 12px;
    line-height: 1.6;
    font-size: 0.95rem;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .message.assistant .message-content {
    background: #f0f0f0;
    color: #333;
  }
  
  .message.user .message-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .message-content.loading {
    display: flex;
    gap: 0.25rem;
  }
  
  .dot {
    animation: blink 1.4s infinite both;
    font-size: 1.5rem;
    line-height: 1;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes blink {
    0%, 80%, 100% { opacity: 0; }
    40% { opacity: 1; }
  }
  
  .error-message {
    background: #fee;
    color: #c00;
    padding: 0.75rem 1rem;
    margin: 0 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  
  .chat-input {
    border-top: 1px solid #eee;
    padding: 1rem 1.5rem;
  }
  
  .chat-input textarea {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.95rem;
    resize: none;
    font-family: inherit;
    outline: none;
  }
  
  .chat-input textarea:focus {
    border-color: #667eea;
  }
  
  .input-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  
  .cancel-btn {
    background: white;
    color: #666;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .cancel-btn:hover {
    background: #f0f0f0;
  }
  
  .send-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  .send-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  .send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .cursor {
    animation: blink-cursor 0.8s infinite;
    font-weight: bold;
    color: #667eea;
  }
  
  @keyframes blink-cursor {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>
