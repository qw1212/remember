import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/layout/Header';
import DashboardPage from '@/pages/DashboardPage';
import SettingsPage from '@/components/settings/SettingsPage';

function ProtectedLayout() {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}

function LoginPage() {
    const { isInitialized, isAuthenticated, login, setup, checkInitialized, error, clearError } = useAuthStore();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [hint, setHint] = useState('');
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        checkInitialized().finally(() => setIsChecking(false));
    }, [checkInitialized]);

    if (isChecking) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!isInitialized) {
            if (password !== confirmPassword) {
                return;
            }
            await setup(password, hint || undefined);
        } else {
            await login(password);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Remember</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {isInitialized ? '输入主密码以解锁' : '创建主密码以开始使用'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm text-gray-700 dark:text-gray-300">
                            主密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                            placeholder="输入主密码"
                            required
                        />
                    </div>

                    {!isInitialized && (
                        <>
                            <div>
                                <label className="mb-1.5 block text-sm text-gray-700 dark:text-gray-300">
                                    确认密码
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                    placeholder="再次输入密码"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm text-gray-700 dark:text-gray-300">
                                    密码提示（可选）
                                </label>
                                <input
                                    type="text"
                                    value={hint}
                                    onChange={(e) => setHint(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                    placeholder="设置密码提示"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}

                    {!isInitialized && password && confirmPassword && password !== confirmPassword && (
                        <p className="text-sm text-red-600 dark:text-red-400">两次输入的密码不一致</p>
                    )}

                    <button
                        type="submit"
                        disabled={!isInitialized && password !== confirmPassword}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isInitialized ? '解锁' : '创建'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
