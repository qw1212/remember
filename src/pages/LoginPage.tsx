import { Shield } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';

export default function LoginPage() {
    const { isAuthenticated, isInitialized } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4">
            {/* 背景装饰 */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
            </div>

            {/* 登录卡片 */}
            <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:bg-gray-900/95 sm:p-10">
                {/* Logo 和标题 */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                        <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Remember
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {isInitialized ? '输入主密码解锁您的密码库' : '创建主密码以保护您的密码库'}
                        </p>
                    </div>
                </div>

                {/* 登录表单 */}
                <LoginForm />

                {/* 底部信息 */}
                <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
                    所有数据均在本地加密存储，绝不上传至服务器
                </p>
            </div>
        </div>
    );
}
