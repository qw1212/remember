import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import { Credential } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCredentialStore } from '@/stores/credentialStore';
import SearchBar from '@/components/credentials/SearchBar';
import CredentialCard from '@/components/credentials/CredentialCard';
import CredentialForm from '@/components/credentials/CredentialForm';

export default function DashboardPage() {
  const {
    filteredCredentials,
    isLoading,
    error,
    loadCredentials,
    deleteCredential,
    clearError,
  } = useCredentialStore();

  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] =
    useState<Credential | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 加载凭证
  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // 错误自动清除
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleAdd = useCallback(() => {
    setEditingCredential(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((credential: Credential) => {
    setEditingCredential(credential);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteConfirmId) {
      await deleteCredential(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteCredential]);

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setEditingCredential(null);
  }, []);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 搜索栏 + 添加按钮 */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <SearchBar />
          </div>
          <button
            onClick={handleAdd}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-medium text-white',
              'bg-blue-600 hover:bg-blue-700',
              'dark:bg-blue-500 dark:hover:bg-blue-600'
            )}
          >
            <Plus className="h-4 w-4" />
            添加凭证
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && filteredCredentials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              加载中...
            </p>
          </div>
        )}

        {/* 空状态 */}
        {!isLoading && filteredCredentials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <ShieldAlert className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-gray-100">
              暂无凭证
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              点击"添加凭证"开始管理你的密码
            </p>
            <button
              onClick={handleAdd}
              className={cn(
                'mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white',
                'bg-blue-600 hover:bg-blue-700',
                'dark:bg-blue-500 dark:hover:bg-blue-600'
              )}
            >
              <Plus className="h-4 w-4" />
              添加凭证
            </button>
          </div>
        )}

        {/* 凭证列表 - 网格布局 */}
        {filteredCredentials.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCredentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* 凭证表单弹窗 */}
      {showForm && (
        <CredentialForm
          credential={editingCredential}
          onClose={handleFormClose}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  确认删除
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  删除后无法恢复，确定要删除此凭证吗？
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
