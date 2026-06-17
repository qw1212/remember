import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}))

import { invoke } from '@tauri-apps/api/core'
import {
  setMasterPassword,
  verifyMasterPassword,
  isMasterPasswordSet,
  generatePassword,
  saveCredential,
  getCredentials,
  deleteCredential,
  lockApp,
  isLocked,
  exportData,
  importData
} from '../api'

const mockInvoke = vi.mocked(invoke)

describe('API模块', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
  })

  describe('主密码管理', () => {
    it('setMasterPassword应该调用invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: '主密码已设置' })
      const result = await setMasterPassword('test123')
      expect(result.success).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('set_master_password', { password: 'test123' })
    })

    it('verifyMasterPassword应该调用invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: '验证成功' })
      const result = await verifyMasterPassword('test123')
      expect(result.success).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('verify_master_password', { password: 'test123' })
    })

    it('isMasterPasswordSet应该返回布尔值', async () => {
      mockInvoke.mockResolvedValue(true)
      const result = await isMasterPasswordSet()
      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('is_master_password_set')
    })
  })

  describe('密码生成', () => {
    it('generatePassword应该调用invoke', async () => {
      mockInvoke.mockResolvedValue('Abc123!@#')
      const result = await generatePassword(16, true, true, true, true)
      expect(result).toBe('Abc123!@#')
      expect(mockInvoke).toHaveBeenCalledWith('generate_password', {
        length: 16,
        useUppercase: true,
        useLowercase: true,
        useNumbers: true,
        useSymbols: true
      })
    })
  })

  describe('凭证管理', () => {
    const mockCredential = {
      id: '1',
      title: 'GitHub',
      username: 'user@example.com',
      password: 'secret123',
      url: 'https://github.com',
      notes: '',
      category: 'development',
      tags: ['dev'],
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
      is_favorite: true
    }

    it('saveCredential应该调用invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: '凭证已保存' })
      const result = await saveCredential(mockCredential)
      expect(result.success).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('save_credential', { credential: mockCredential })
    })

    it('getCredentials应该返回凭证列表', async () => {
      mockInvoke.mockResolvedValue({ success: true, data: [mockCredential] })
      const result = await getCredentials()
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].title).toBe('GitHub')
    })

    it('deleteCredential应该调用invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: '凭证已删除' })
      const result = await deleteCredential('1')
      expect(result.success).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('delete_credential', { id: '1' })
    })
  })

  describe('应用状态', () => {
    it('lockApp应该调用invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: '应用已锁定' })
      const result = await lockApp()
      expect(result.success).toBe(true)
    })

    it('isLocked应该返回布尔值', async () => {
      mockInvoke.mockResolvedValue(true)
      const result = await isLocked()
      expect(result).toBe(true)
    })
  })

  describe('导入导出', () => {
    it('exportData应该调用invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: '[]' })
      const result = await exportData()
      expect(result.success).toBe(true)
    })

    it('importData应该调用invoke', async () => {
      mockInvoke.mockResolvedValue({ success: true, message: '成功导入 1 条凭证' })
      const result = await importData('[]')
      expect(result.success).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('import_data', { data: '[]' })
    })
  })

  describe('错误处理', () => {
    it('应该处理invoke失败', async () => {
      mockInvoke.mockRejectedValue(new Error('IPC调用失败'))
      await expect(isMasterPasswordSet()).rejects.toThrow('IPC调用失败')
    })

    it('应该处理返回错误的响应', async () => {
      mockInvoke.mockResolvedValue({ success: false, error: '密码错误' })
      const result = await verifyMasterPassword('wrong')
      expect(result.success).toBe(false)
      expect(result.error).toBe('密码错误')
    })
  })
})
