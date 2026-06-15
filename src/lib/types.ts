// 凭证接口
export interface Credential {
    id?: string;
    title: string;
    username?: string;
    password: string; // 加密存储
    url?: string;
    category?: string;
    notes?: string; // 加密存储
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

// 分类接口
export interface Category {
    id?: string;
    name: string;
    icon?: string;
}

// 标签接口
export interface Tag {
    id?: string;
    name: string;
}

// 应用设置接口
export interface AppSettings {
    id?: string;
    masterPasswordHash: string;
    salt: string;
    securityHint?: string;
    autoLockTime: number; // 分钟
    clipboardClearTime: number; // 秒
}

// 加密数据接口
export interface EncryptedData {
    iv: string;
    data: string;
}

// 导出数据接口
export interface ExportData {
    version: string;
    exportDate: Date;
    credentials: Credential[];
    categories: Category[];
    tags: Tag[];
    settings: Omit<AppSettings, 'masterPasswordHash' | 'salt'>;
}

// 密码强度接口
export interface PasswordStrength {
    score: number; // 0-4
    label: string;
    color: string;
}
