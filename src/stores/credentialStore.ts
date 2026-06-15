import { create } from 'zustand';
import { Credential } from '../lib/types';
import { CredentialService } from '../lib/database';
import { cryptoManager } from '../lib/crypto';

interface CredentialState {
    credentials: Credential[];
    filteredCredentials: Credential[];
    categories: string[];
    tags: string[];
    selectedCategory: string | null;
    selectedTag: string | null;
    searchQuery: string;
    isLoading: boolean;
    error: string | null;

    // 操作
    loadCredentials: () => Promise<void>;
    addCredential: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateCredential: (id: string, data: Partial<Credential>) => Promise<void>;
    deleteCredential: (id: string) => Promise<void>;
    decryptPassword: (encryptedPassword: string) => Promise<string>;
    decryptNotes: (encryptedNotes: string) => Promise<string>;
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: string | null) => void;
    setSelectedTag: (tag: string | null) => void;
    clearFilters: () => void;
    clearError: () => void;
    applyFilters: () => void;
}

export const useCredentialStore = create<CredentialState>((set, get) => ({
    credentials: [],
    filteredCredentials: [],
    categories: [],
    tags: [],
    selectedCategory: null,
    selectedTag: null,
    searchQuery: '',
    isLoading: false,
    error: null,

    loadCredentials: async () => {
        set({ isLoading: true, error: null });

        try {
            const credentials = await CredentialService.getAll();
            const categories = await CredentialService.getCategories();
            const tags = await CredentialService.getTags();

            set({
                credentials,
                filteredCredentials: credentials,
                categories,
                tags,
                isLoading: false
            });
        } catch {
            set({ error: '加载凭证失败', isLoading: false });
        }
    },

    addCredential: async (credential) => {
        set({ isLoading: true, error: null });

        try {
            // 加密密码和备注
            const encryptedPassword = await cryptoManager.encrypt(credential.password);
            const encryptedNotes = credential.notes
                ? await cryptoManager.encrypt(credential.notes)
                : undefined;

            await CredentialService.add({
                ...credential,
                password: JSON.stringify(encryptedPassword),
                notes: encryptedNotes ? JSON.stringify(encryptedNotes) : undefined
            });

            // 重新加载凭证
            await get().loadCredentials();
        } catch {
            set({ error: '添加凭证失败', isLoading: false });
        }
    },

    updateCredential: async (id, data) => {
        set({ isLoading: true, error: null });

        try {
            // 如果更新了密码，需要加密
            const updateData = { ...data };
            if (data.password) {
                const encryptedPassword = await cryptoManager.encrypt(data.password);
                updateData.password = JSON.stringify(encryptedPassword);
            }

            // 如果更新了备注，需要加密
            if (data.notes) {
                const encryptedNotes = await cryptoManager.encrypt(data.notes);
                updateData.notes = JSON.stringify(encryptedNotes);
            }

            await CredentialService.update(id, updateData);

            // 重新加载凭证
            await get().loadCredentials();
        } catch {
            set({ error: '更新凭证失败', isLoading: false });
        }
    },

    deleteCredential: async (id) => {
        set({ isLoading: true, error: null });

        try {
            await CredentialService.delete(id);

            // 重新加载凭证
            await get().loadCredentials();
        } catch {
            set({ error: '删除凭证失败', isLoading: false });
        }
    },

    decryptPassword: async (encryptedPassword: string) => {
        try {
            const encryptedData = JSON.parse(encryptedPassword);
            return await cryptoManager.decrypt(encryptedData);
        } catch {
            return '解密失败';
        }
    },

    decryptNotes: async (encryptedNotes: string) => {
        try {
            const encryptedData = JSON.parse(encryptedNotes);
            return await cryptoManager.decrypt(encryptedData);
        } catch {
            return '解密失败';
        }
    },

    setSearchQuery: (query) => {
        set({ searchQuery: query });
        get().applyFilters();
    },

    setSelectedCategory: (category) => {
        set({ selectedCategory: category });
        get().applyFilters();
    },

    setSelectedTag: (tag) => {
        set({ selectedTag: tag });
        get().applyFilters();
    },

    clearFilters: () => {
        set({
            searchQuery: '',
            selectedCategory: null,
            selectedTag: null,
            filteredCredentials: get().credentials
        });
    },

    clearError: () => {
        set({ error: null });
    },

    // 内部方法：应用筛选
    applyFilters: () => {
        const { credentials, searchQuery, selectedCategory, selectedTag } = get();

        let filtered = [...credentials];

        // 按搜索词筛选
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(cred =>
                cred.title.toLowerCase().includes(lowerQuery) ||
                cred.username?.toLowerCase().includes(lowerQuery) ||
                cred.url?.toLowerCase().includes(lowerQuery)
            );
        }

        // 按分类筛选
        if (selectedCategory) {
            filtered = filtered.filter(cred => cred.category === selectedCategory);
        }

        // 按标签筛选
        if (selectedTag) {
            filtered = filtered.filter(cred => cred.tags.includes(selectedTag));
        }

        set({ filteredCredentials: filtered });
    }
}));
