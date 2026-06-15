import { useNavigate } from 'react-router-dom';
import { Shield, Settings, Lock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export default function Header() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleLock = () => {
        logout();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
                >
                    <Shield className="h-6 w-6 text-blue-600" />
                    <span>Remember</span>
                </button>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleLock}
                        className={cn(
                            'inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors',
                            'hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                        )}
                        title="锁定"
                    >
                        <Lock className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className={cn(
                            'inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors',
                            'hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                        )}
                        title="设置"
                    >
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
