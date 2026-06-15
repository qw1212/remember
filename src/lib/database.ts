import Dexie, { Table } from 'dexie';
import { Credential, Category, Tag, AppSettings } from './types';

export class RememberDatabase extends Dexie {
    credentials!: Table<Credential, string>;
    categories!: Table<Category, string>;
    tags!: Table<Tag, string>;
    settings!: Table<AppSettings, string>;

    constructor() {
        super('remember-db');
        this.version(1).stores({
            credentials: 'id, title, username, url, category, *tags, createdAt, updatedAt',
            categories: 'id, name',
            tags: 'id, name',
            settings: 'id'
        });
    }
}

export const db = new RememberDatabase();

// 凭证服务
export class CredentialService {
    // 添加凭证
    static async add(credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const id = crypto.randomUUID();
        const now = new Date();
        await db.credentials.add({
            ...credential,
            id,
            createdAt: now,
            updatedAt: now
        });
        return id;
    }

    // 更新凭证
    static async update(id: string, data: Partial<Credential>): Promise<void> {
        await db.credentials.update(id, {
            ...data,
            updatedAt: new Date()
        });
    }

    // 删除凭证
    static async delete(id: string): Promise<void> {
        await db.credentials.delete(id);
    }

    // 获取凭证
    static async getById(id: string): Promise<Credential | undefined> {
        return db.credentials.get(id);
    }

    // 获取所有凭证
    static async getAll(): Promise<Credential[]> {
        return db.credentials.orderBy('updatedAt').reverse().toArray();
    }

    // 搜索凭证
    static async search(query: string): Promise<Credential[]> {
        const lowerQuery = query.toLowerCase();
        return db.credentials
            .filter(cred =>
                cred.title.toLowerCase().includes(lowerQuery) ||
                cred.username?.toLowerCase().includes(lowerQuery) ||
                cred.url?.toLowerCase().includes(lowerQuery) ||
                cred.category?.toLowerCase().includes(lowerQuery)
            )
            .toArray();
    }

    // 按分类筛选
    static async getByCategory(category: string): Promise<Credential[]> {
        return db.credentials.where('category').equals(category).toArray();
    }

    // 按标签筛选
    static async getByTag(tag: string): Promise<Credential[]> {
        return db.credentials.where('tags').equals(tag).toArray();
    }

    // 获取所有分类
    static async getCategories(): Promise<string[]> {
        const credentials = await db.credentials.toArray();
        const categories = new Set(credentials.map(c => c.category).filter(Boolean) as string[]);
        return Array.from(categories).sort();
    }

    // 获取所有标签
    static async getTags(): Promise<string[]> {
        const credentials = await db.credentials.toArray();
        const tags = new Set(credentials.flatMap(c => c.tags));
        return Array.from(tags).sort();
    }
}

// 设置服务
export class SettingsService {
    // 获取设置
    static async get(): Promise<AppSettings | undefined> {
        return db.settings.get('main');
    }

    // 保存设置
    static async save(settings: Omit<AppSettings, 'id'>): Promise<void> {
        await db.settings.put({ ...settings, id: 'main' });
    }

    // 更新设置
    static async update(data: Partial<AppSettings>): Promise<void> {
        await db.settings.update('main', data);
    }

    // 检查是否已初始化
    static async isInitialized(): Promise<boolean> {
        const settings = await db.settings.get('main');
        return !!settings;
    }
}

// 导入导出服务
export class ImportExportService {
    // 导出数据
    static async exportData(): Promise<string> {
        const credentials = await db.credentials.toArray();
        const categories = await db.categories.toArray();
        const tags = await db.tags.toArray();
        const settings = await SettingsService.get();

        const exportData = {
            version: '1.0.0',
            exportDate: new Date(),
            credentials,
            categories,
            tags,
            settings: settings ? {
                securityHint: settings.securityHint,
                autoLockTime: settings.autoLockTime,
                clipboardClearTime: settings.clipboardClearTime
            } : null
        };

        return JSON.stringify(exportData, null, 2);
    }

    // 导入数据
    static async importData(jsonData: string): Promise<void> {
        try {
            const data = JSON.parse(jsonData);

            // 验证数据格式
            if (!data.version || !data.credentials) {
                throw new Error('无效的备份文件格式');
            }

            // 清除现有数据
            await db.credentials.clear();
            await db.categories.clear();
            await db.tags.clear();

            // 导入凭证
            if (data.credentials && Array.isArray(data.credentials)) {
                await db.credentials.bulkAdd(data.credentials);
            }

            // 导入分类
            if (data.categories && Array.isArray(data.categories)) {
                await db.categories.bulkAdd(data.categories);
            }

            // 导入标签
            if (data.tags && Array.isArray(data.tags)) {
                await db.tags.bulkAdd(data.tags);
            }
        } catch (error) {
            throw new Error(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    // 清除所有数据
    static async clearAll(): Promise<void> {
        await db.credentials.clear();
        await db.categories.clear();
        await db.tags.clear();
        await db.settings.clear();
    }
}
