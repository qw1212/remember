import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Loader2, AlertCircle, ShieldCheck, Lightbulb } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cryptoManager } from '@/lib/crypto';
import { cn } from '@/lib/utils';

export default function LoginForm() {
    const {
        isInitialized,
        isLoading,
        error,
        securityHint,
        login,
        setup,
        clearError,
        checkInitialized,
    } = useAuthStore();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [hint, setHint] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        checkInitialized();
    }, [checkInitialized]);

    useEffect(() => {
        clearError();
    }, [isInitialized, clearError]);

    const passwordStrength = cryptoManager.checkPasswordStrength(password);
    const isSetupMode = !isInitialized;

    const canSubmit = () => {
        if (!password) return false;
        if (isLoading) return false;
        if (isSetupMode) {
            return password.length >= 8 && password === confirmPassword;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit()) return;

        if (isSetupMode) {
            await setup(password, hint || undefined);
        } else {
            await login(password);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
            {/* 安全提示 */}
            {securityHint && !isSetupMode && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>提示：{securityHint}</span>
                </div>
            )}

            {/* 错误提示 */}
            {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* 主密码输入 */}
            <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    主密码
                </label>
                <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isSetupMode ? '设置主密码（至少8位）' : '输入主密码'}
                        autoComplete="current-password"
                        className={cn(
                            'w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm',
                            'placeholder:text-gray-400',
                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                            'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                            'dark:focus:border-blue-400',
                            'transition-colors'
                        )}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                {/* 密码强度指示器（仅初始化模式） */}
                {isSetupMode && password.length > 0 && (
                    <div className="space-y-1 pt-1">
                        <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'h-1.5 flex-1 rounded-full transition-colors',
                                        i <= passwordStrength.score - 1
                                            ? ''
                                            : 'bg-gray-200 dark:bg-gray-700'
                                    )}
                                    style={
                                        i <= passwordStrength.score - 1
                                            ? { backgroundColor: passwordStrength.color }
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                        <p className="text-xs" style={{ color: passwordStrength.color }}>
                            密码强度：{passwordStrength.label}
                        </p>
                    </div>
                )}
            </div>

            {/* 确认密码（仅初始化模式） */}
            {isSetupMode && (
                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        确认密码
                    </label>
                    <div className="relative">
                        <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="再次输入密码"
                            autoComplete="new-password"
                            className={cn(
                                'w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm',
                                'placeholder:text-gray-400',
                                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                                'dark:focus:border-blue-400',
                                'transition-colors',
                                confirmPassword && password !== confirmPassword && 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500">两次输入的密码不一致</p>
                    )}
                </div>
            )}

            {/* 安全提示输入（仅初始化模式） */}
            {isSetupMode && (
                <div className="space-y-1.5">
                    <label htmlFor="hint" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        安全提示 <span className="text-gray-400">（可选）</span>
                    </label>
                    <div className="relative">
                        <Lightbulb className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            id="hint"
                            type="text"
                            value={hint}
                            onChange={(e) => setHint(e.target.value)}
                            placeholder="设置一个帮助回忆密码的提示"
                            className={cn(
                                'w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm',
                                'placeholder:text-gray-400',
                                'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
                                'dark:focus:border-blue-400',
                                'transition-colors'
                            )}
                        />
                    </div>
                </div>
            )}

            {/* 提交按钮 */}
            <button
                type="submit"
                disabled={!canSubmit()}
                className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium',
                    'bg-blue-600 text-white',
                    'hover:bg-blue-700 active:bg-blue-800',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'transition-colors'
                )}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isSetupMode ? '正在初始化...' : '正在登录...'}
                    </>
                ) : (
                    isSetupMode ? '初始化' : '解锁'
                )}
            </button>
        </form>
    );
}
