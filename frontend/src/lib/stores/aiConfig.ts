import { writable } from 'svelte/store';
import type { AiConfig } from '../api';

/// AI 配置 Store - 统一管理 AI 配置的读取和保存

function loadAiConfig(): AiConfig {
  try {
    const saved = localStorage.getItem('ai-config');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load AI config:', e);
  }
  return { provider: 'ollama', api_url: 'http://localhost:11434', api_key: undefined, model: 'qwen2.5:7b' };
}

export const aiConfigStore = writable<AiConfig>(loadAiConfig());

export function saveAiConfig(config: AiConfig): void {
  localStorage.setItem('ai-config', JSON.stringify(config));
  aiConfigStore.set(config);
}

export function isAiConfigured(): boolean {
  return !!localStorage.getItem('ai-config');
}
