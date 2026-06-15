import { create } from 'zustand';
import { cryptoManager } from '../lib/crypto';
import { SettingsService } from '../lib/database';

interface AuthState {
    isAuthenticated: boolean;
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    securityHint: string | null;

    // 操作
    login: (password: string) => Promise<boolean>;
    setup: (password: string, hint?: string) => Promise<void>;
    logout: () => void;
    checkInitialized: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    isInitialized: false,
    isLoading: false,
    error: null,
    securityHint: null,

    login: async (password: string) => {
        set({ isLoading: true, error: null });

        try {
            const settings = await SettingsService.get();
            if (!settings) {
                set({ error: '应用未初始化', isLoading: false });
                return false;
            }

            const salt = new Uint8Array(
                atob(settings.salt).split('').map(c => c.charCodeAt(0))
            );

            const key = await cryptoManager.deriveKey(password, salt);
            cryptoManager.setKey(key);

            // 验证密码：尝试解密一个测试数据
            // 这里我们使用密码哈希来验证
            const encoder = new TextEncoder();
            const passwordHash = await crypto.subtle.digest('SHA-256', encoder.encode(password + settings.salt));
            const passwordHashBase64 = btoa(String.fromCharCode(...new Uint8Array(passwordHash)));

            if (passwordHashBase64 !== settings.masterPasswordHash) {
                cryptoManager.clearKey();
                set({ error: '密码错误', isLoading: false });
                return false;
            }

            set({ isAuthenticated: true, isLoading: false });
            return true;
        } catch {
            set({ error: '登录失败', isLoading: false });
            return false;
        }
    },

    setup: async (password: string, hint?: string) => {
        set({ isLoading: true, error: null });

        try {
            const salt = cryptoManager.generateSalt();
            const key = await cryptoManager.deriveKey(password, salt);
            cryptoManager.setKey(key);

            // 生成密码哈希
            const encoder = new TextEncoder();
            const passwordHash = await crypto.subtle.digest(
                'SHA-256',
                encoder.encode(password + btoa(String.fromCharCode(...salt))
            ));
            const passwordHashBase64 = btoa(String.fromCharCode(...new Uint8Array(passwordHash)));

            await SettingsService.save({
                masterPasswordHash: passwordHashBase64,
                salt: btoa(String.fromCharCode(...salt)),
                securityHint: hint,
                autoLockTime: 5,
                clipboardClearTime: 30
            });

            set({
                isAuthenticated: true,
                isInitialized: true,
                isLoading: false,
                securityHint: hint || null
            });
        } catch {
            set({ error: '初始化失败', isLoading: false });
        }
    },

    logout: () => {
        cryptoManager.clearKey();
        set({ isAuthenticated: false });
    },

    checkInitialized: async () => {
        try {
            const settings = await SettingsService.get();
            set({
                isInitialized: !!settings,
                securityHint: settings?.securityHint || null
            });
        } catch {
            set({ isInitialized: false });
        }
    },

    clearError: () => {
        set({ error: null });
    }
}));
