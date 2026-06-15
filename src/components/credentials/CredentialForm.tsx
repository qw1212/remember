import { useState, useEffect, useCallback, type FormEvent } from 'react';
import {
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Loader2,
} from 'lucide-react';
import { Credential } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCredentialStore } from '@/stores/credentialStore';

interface CredentialFormProps {
  credential?: Credential | null;
  onClose: () => void;
}

interface FormData {
  title: string;
  username: string;
  password: string;
  url: string;
  category: string;
  notes: string;
  tags: string[];
}

interface FormErrors {
  title?: string;
  password?: string;
}

const PASSWORD_LENGTH = 16;
const PASSWORD_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

function generatePassword(): string {
  const array = new Uint32Array(PASSWORD_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (v) => PASSWORD_CHARS[v % PASSWORD_CHARS.length]).join('');
}

export default function CredentialForm({
  credential,
  onClose,
}: CredentialFormProps) {
  const {
    addCredential,
    updateCredential,
    decryptPassword,
    categories,
    tags: existingTags,
    isLoading,
  } = useCredentialStore();

  const isEditing = !!credential;

  const [form, setForm] = useState<FormData>({
    title: '',
    username: '',
    password: '',
    url: '',
    category: '',
    notes: '',
    tags: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 编辑模式：加载已有凭证数据
  useEffect(() => {
    if (credential) {
      const loadForm = async () => {
        let decryptedPwd = '';
        try {
          decryptedPwd = await decryptPassword(credential.password);
        } catch {
          decryptedPwd = '';
        }
        setForm({
          title: credential.title,
          username: credential.username || '',
          password: decryptedPwd,
          url: credential.url || '',
          category: credential.category || '',
          notes: credential.notes || '',
          tags: [...credential.tags],
        });
      };
      loadForm();
    }
  }, [credential, decryptPassword]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string | string[]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // 清除对应字段的错误
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleGeneratePassword = useCallback(() => {
    const pwd = generatePassword();
    setForm((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  }, [errors.password]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  }, [tagInput, form.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  }, []);

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!form.title.trim()) {
      newErrors.title = '请输入凭证标题';
    }

    if (!form.password.trim()) {
      newErrors.password = '请输入密码';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.title, form.password]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      if (!validate()) return;

      try {
        const data = {
          title: form.title.trim(),
          username: form.username.trim() || undefined,
          password: form.password,
          url: form.url.trim() || undefined,
          category: form.category || undefined,
          notes: form.notes.trim() || undefined,
          tags: form.tags,
        };

        if (isEditing && credential?.id) {
          await updateCredential(credential.id, data);
        } else {
          await addCredential(data);
        }

        onClose();
      } catch {
        setSubmitError(isEditing ? '更新凭证失败' : '添加凭证失败');
      }
    },
    [form, validate, isEditing, credential, addCredential, updateCredential, onClose]
  );

  // 获取建议标签（已有的但当前未选择的）
  const suggestedTags = existingTags.filter(
    (tag) =>
      !form.tags.includes(tag) &&
      tag.toLowerCase().includes(tagInput.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl',
          'dark:bg-gray-800'
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isEditing ? '编辑凭证' : '添加凭证'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto px-6 py-4"
        >
          <div className="flex flex-col gap-4">
            {/* 标题 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="例如：GitHub"
                className={cn(
                  'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500',
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* 用户名 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                用户名
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="例如：user@example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                密码 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="输入密码"
                    className={cn(
                      'w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      'dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500',
                      errors.password
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  title="生成随机密码"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                URL
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* 分类 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                分类
              </label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">选择分类</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 备注 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                备注
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="添加备注信息..."
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                标签
              </label>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="输入标签后按回车"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="shrink-0 rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* 标签建议 */}
              {tagInput && suggestedTags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {suggestedTags.slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          tags: [...prev.tags, tag],
                        }));
                        setTagInput('');
                      }}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 提交错误 */}
          {submitError && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {submitError}
            </div>
          )}
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white',
              'bg-blue-600 hover:bg-blue-700',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-blue-500 dark:hover:bg-blue-600'
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? '保存' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
