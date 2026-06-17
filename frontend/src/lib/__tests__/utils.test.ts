import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cn, copyToClipboard, formatDate, delay, generateDeviceId } from '../utils'

describe('cn - CSS类名合并', () => {
  it('应该合并多个类名', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('应该过滤false值', () => {
    expect(cn('a', false, 'b')).toBe('a b')
  })

  it('应该过滤undefined和null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })

  it('应该处理空输入', () => {
    expect(cn()).toBe('')
  })

  it('应该处理单个类名', () => {
    expect(cn('active')).toBe('active')
  })
})

describe('formatDate - 日期格式化', () => {
  it('应该格式化时间戳为中文格式', () => {
    const timestamp = new Date(2024, 0, 15, 10, 30).getTime()
    const result = formatDate(timestamp)
    expect(result).toContain('2024')
    expect(result).toContain('01')
    expect(result).toContain('15')
  })
})

describe('delay - 延迟执行', () => {
  it('应该在指定时间后resolve', async () => {
    const start = Date.now()
    await delay(100)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(80)
  })
})

describe('generateDeviceId - 设备ID生成', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('应该生成UUID格式的设备ID', () => {
    const id = generateDeviceId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('应该缓存设备ID', () => {
    const id1 = generateDeviceId()
    const id2 = generateDeviceId()
    expect(id1).toBe(id2)
  })

  it('应该将设备ID存储到localStorage', () => {
    generateDeviceId()
    expect(localStorage.getItem('remember_device_id')).not.toBeNull()
  })
})

describe('copyToClipboard - 剪贴板复制', () => {
  it('应该调用navigator.clipboard.writeText', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText }
    })

    const result = await copyToClipboard('test')
    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('test')
  })

  it('应该在失败时返回false', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.assign(navigator, {
      clipboard: { writeText }
    })

    const result = await copyToClipboard('test')
    expect(result).toBe(false)
  })
})
