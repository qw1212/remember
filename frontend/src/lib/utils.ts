/**
 * 工具函数
 */

/**
 * 合并CSS类名（用于Tailwind CSS）
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成唯一设备ID
 */
export function generateDeviceId(): string {
  const stored = localStorage.getItem('remember_device_id');
  if (stored) return stored;
  
  const id = crypto.randomUUID();
  localStorage.setItem('remember_device_id', id);
  return id;
}

/**
 * 格式化日期
 */
export function formatDate(date: string | number): string {
  const d = typeof date === 'number' ? new Date(date) : new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 截断文本，超出长度时添加省略号
 */
export function truncateText(text: string, maxLen: number = 100): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

/**
 * HTML 转义
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 高亮关键词（返回 HTML 字符串，需配合 {@html} 使用）
 */
export function highlightText(text: string, keyword: string): string {
  if (!keyword) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedKeyword = escapeHtml(keyword);
  const regex = new RegExp(escapedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return escaped.replace(regex, (match) => `<mark>${match}</mark>`);
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
