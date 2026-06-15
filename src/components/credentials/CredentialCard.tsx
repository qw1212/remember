import { useState, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Pencil,
  Trash2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Credential } from '@/lib/types';
import { cn, copyToClipboard, formatDate } from '@/lib/utils';
import { useCredentialStore } from '@/stores/credentialStore';

interface CredentialCardProps {
  credential: Credential;
  onEdit: (credential: Credential) => void;
  onDelete: (id: string) => void;
}

export default function CredentialCard({
  credential,
  onEdit,
  onDelete,
}: CredentialCardProps) {
  const { decryptPassword } = useCredentialStore();

  const [showPassword, setShowPassword] = useState(false);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(
    null
  );
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleTogglePassword = useCallback(async () => {
    if (!showPassword && !decryptedPassword) {
      const password = await decryptPassword(credential.password);
      setDecryptedPassword(password);
    }
    setShowPassword((prev) => !prev);
  }, [showPassword, decryptedPassword, credential.password, decryptPassword]);

  const handleCopyPassword = useCallback(async () => {
    let password = decryptedPassword;
    if (!password) {
      password = await decryptPassword(credential.password);
      setDecryptedPassword(password);
    }
    const success = await copyToClipboard(password);
    if (success) {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  }, [decryptedPassword, credential.password, decryptPassword]);

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4',
        'transition-shadow duration-200 hover:shadow-md',
        'dark:border-gray-700 dark:bg-gray-800'
      )}
    >
      {/* 头部：标题 + 操作按钮 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
          {credential.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(credential)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => credential.id && onDelete(credential.id)}
            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 用户名 */}
      {credential.username && (
        <p className="truncate text-sm text-gray-600 dark:text-gray-400">
          {credential.username}
        </p>
      )}

      {/* URL */}
      {credential.url && (
        <a
          href={credential.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 truncate text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{credential.url}</span>
        </a>
      )}

      {/* 密码行 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 truncate rounded-md bg-gray-50 px-3 py-1.5 font-mono text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {showPassword && decryptedPassword ? decryptedPassword : '••••••••'}
        </div>
        <button
          onClick={handleTogglePassword}
          className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title={showPassword ? '隐藏密码' : '显示密码'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={handleCopyPassword}
          className={cn(
            'shrink-0 rounded-md p-1.5 transition-colors',
            copyFeedback
              ? 'text-green-500'
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
          )}
          title={copyFeedback ? '已复制' : '复制密码'}
        >
          {copyFeedback ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 底部：分类 + 标签 */}
      <div className="flex flex-wrap items-center gap-1.5">
        {credential.category && (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {credential.category}
          </span>
        )}
        {credential.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 更新时间 */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        更新于 {formatDate(credential.updatedAt)}
      </p>
    </div>
  );
}
