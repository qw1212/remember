import { EncryptedData } from './types';

export class CryptoManager {
    private key: CryptoKey | null = null;
    private encoder = new TextEncoder();
    private decoder = new TextDecoder();

    // 从主密码派生加密密钥
    async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // 设置密钥
    setKey(key: CryptoKey): void {
        this.key = key;
    }

    // 清除密钥
    clearKey(): void {
        this.key = null;
    }

    // 检查密钥是否已设置
    hasKey(): boolean {
        return this.key !== null;
    }

    // 加密数据
    async encrypt(data: string): Promise<EncryptedData> {
        if (!this.key) throw new Error('密钥未初始化');

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            this.key,
            this.encoder.encode(data)
        );

        return {
            iv: this.arrayBufferToBase64(iv),
            data: this.arrayBufferToBase64(encrypted)
        };
    }

    // 解密数据
    async decrypt(encryptedData: EncryptedData): Promise<string> {
        if (!this.key) throw new Error('密钥未初始化');

        const iv = this.base64ToArrayBuffer(encryptedData.iv);
        const data = this.base64ToArrayBuffer(encryptedData.data);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            this.key,
            data
        );

        return this.decoder.decode(decrypted);
    }

    // 生成随机盐值
    generateSalt(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    // 生成随机密码
    generatePassword(length: number = 16, options?: {
        uppercase?: boolean;
        lowercase?: boolean;
        numbers?: boolean;
        symbols?: boolean;
    }): string {
        const opts = {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            ...options
        };

        let chars = '';
        if (opts.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (opts.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (opts.numbers) chars += '0123456789';
        if (opts.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (chars.length === 0) chars = 'abcdefghijklmnopqrstuvwxyz';

        let password = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += chars[array[i] % chars.length];
        }

        return password;
    }

    // 检查密码强度
    checkPasswordStrength(password: string): { score: number; label: string; color: string } {
        let score = 0;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        const levels = [
            { score: 0, label: '非常弱', color: '#ef4444' },
            { score: 1, label: '弱', color: '#f97316' },
            { score: 2, label: '中等', color: '#eab308' },
            { score: 3, label: '强', color: '#22c55e' },
            { score: 4, label: '非常强', color: '#16a34a' }
        ];

        return levels[Math.min(score, 4)];
    }

    // 辅助函数：ArrayBuffer 转 Base64
    private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // 辅助函数：Base64 转 ArrayBuffer
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

// 导出单例实例
export const cryptoManager = new CryptoManager();
