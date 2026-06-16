/**
 * 工具函数
 */

/**
 * 生成数据校验和
 * 使用SHA-256生成数据的哈希值
 */
export async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
