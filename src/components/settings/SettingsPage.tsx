import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Clipboard, Download, Upload, Trash2, Shield, Info, Loader2 } from 'lucide-react';
import { SettingsService, ImportExportService } from '@/lib/database';
import { downloadFile, readFileAsText, cn } from '@/lib/utils';
import { useCredentialStore } from '@/stores/credentialStore';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { loadCredentials } = useCredentialStore();
    const { logout } = useAuthStore();

    const [autoLockTime, setAutoLockTime] = useState(5);
    const [clipboardClearTime, setClipboardClearTime] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await SettingsService.get();
            if (settings) {
                setAutoLockTime(settings.autoLockTime);
                setClipboardClearTime(settings.clipboardClearTime);
            }
        } catch {
            // ignore
        } finally {
            setIsLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveSettings = async () => {
        try {
            await SettingsService.update({
                autoLockTime,
                clipboardClearTime
            });
            showMessage('success', '设置已保存');
        } catch {
            showMessage('error', '保存设置失败');
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await ImportExportService.exportData();
            const timestamp = new Date().toISOString().slice(0, 10);
            downloadFile(data, `remember-backup-${timestamp}.json`);
            showMessage('success', '数据导出成功');
        } catch {
            showMessage('error', '导出失败');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const content = await readFileAsText(file);
            await ImportExportService.importData(content);
            await loadCredentials();
            showMessage('success', '数据导入成功');
        } catch (err) {
            showMessage('error', err instanceof Error ? err.message : '导入失败');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClearAll = async () => {
        try {
            await ImportExportService.clearAll();
            setShowClearConfirm(false);
            showMessage('success', '所有数据已清除');
            logout();
            navigate('/');
        } catch {
            showMessage('error', '清除数据失败');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">设置</h1>
                </div>

                {message && (
                    <div
                        className={cn(
                            'mb-4 rounded-lg px-4 py-3 text-sm',
                            message.type === 'success'
                                ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        )}
                    >
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    {/* 安全设置 */}
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <Shield className="h-4 w-4 text-blue-600" />
                            安全设置
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Clock className="h-4 w-4" />
                                    自动锁定时间（分钟）
                                </label>
                                <select
                                    value={autoLockTime}
                                    onChange={(e) => setAutoLockTime(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                >
                                    <option value={1}>1 分钟</option>
                                    <option value={5}>5 分钟</option>
                                    <option value={10}>10 分钟</option>
                                    <option value={30}>30 分钟</option>
                                    <option value={60}>1 小时</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Clipboard className="h-4 w-4" />
                                    剪贴板清除时间（秒）
                                </label>
                                <select
                                    value={clipboardClearTime}
                                    onChange={(e) => setClipboardClearTime(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                >
                                    <option value={10}>10 秒</option>
                                    <option value={30}>30 秒</option>
                                    <option value={60}>60 秒</option>
                                    <option value={120}>120 秒</option>
                                </select>
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
                            >
                                保存设置
                            </button>
                        </div>
                    </section>

                    {/* 数据管理 */}
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <Download className="h-4 w-4 text-blue-600" />
                            数据管理
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {isExporting ? '导出中...' : '导出数据'}
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {isImporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                {isImporting ? '导入中...' : '导入数据'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                onClick={() => setShowClearConfirm(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/30"
                            >
                                <Trash2 className="h-4 w-4" />
                                清除所有数据
                            </button>
                        </div>
                    </section>

                    {/* 关于 */}
                    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                            <Info className="h-4 w-4 text-blue-600" />
                            关于
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <p>Remember - 本地密码管理器</p>
                            <p>版本: 1.0.0</p>
                            <p>所有数据加密存储在本地浏览器中，不会上传到任何服务器。</p>
                        </div>
                    </section>
                </div>
            </div>

            {/* 清除数据确认对话框 */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">确认清除数据</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            此操作将永久删除所有凭证数据和设置，且无法恢复。确定要继续吗？
                        </p>
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                            >
                                确认清除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
