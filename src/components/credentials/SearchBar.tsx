import { useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredentialStore } from '@/stores/credentialStore';

export default function SearchBar() {
  const {
    searchQuery,
    selectedCategory,
    selectedTag,
    categories,
    tags,
    setSearchQuery,
    setSelectedCategory,
    setSelectedTag,
    clearFilters,
  } = useCredentialStore();

  const hasActiveFilters =
    searchQuery || selectedCategory || selectedTag;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedCategory(e.target.value || null);
    },
    [setSelectedCategory]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      setSelectedTag(selectedTag === tag ? null : tag);
    },
    [selectedTag, setSelectedTag]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* 搜索行 */}
      <div className="flex items-center gap-2">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索凭证..."
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 分类筛选 */}
        <select
          value={selectedCategory || ''}
          onChange={handleCategoryChange}
          className={cn(
            'shrink-0 rounded-lg border bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            'dark:bg-gray-800',
            selectedCategory
              ? 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300'
              : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
          )}
        >
          <option value="">全部分类</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 标签行 */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  selectedTag === tag
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
