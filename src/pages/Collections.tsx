import React, { useCallback, useState, useEffect } from 'react';
import type { NewsArticle } from '@/types';
import NavBar from '@/components/NavBar';
import NewsCard from '@/components/NewsCard';
import ExportMenu from '@/components/ExportMenu';
import { useCollections } from '@/hooks/useCollections';
import { useToast } from '@/components/Toast';

export default function CollectionsPage() {
  const { items, loaded, isSaved, save, remove } = useCollections();
  const { toast } = useToast();
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Clear selection if items count changes significantly (optional, but keep it consistent)
    setSelectedUrls(new Set());
  }, [items.length]);

  const toggleSelect = useCallback((url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedUrls.size === items.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(items.map((i) => i.article.url)));
    }
  }, [items, selectedUrls]);

  const selectedArticles = items.filter((i) => selectedUrls.has(i.article.url)).map((i) => i.article);

  const handleSave = useCallback((article: NewsArticle) => {
    save(article);
    toast('已收藏到选题库', 'success');
  }, [save, toast]);

  const handleRemove = useCallback((id: string) => {
    remove(id);
    toast('已从选题库移除', 'info');
  }, [remove, toast]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="max-w-2xl mx-auto pb-8">
        <div className="px-4 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">我的选题库</h1>
            {loaded && (
              <p className="text-xs text-gray-400 mt-0.5">共 {items.length} 条收藏</p>
            )}
          </div>
          {loaded && items.length > 0 && (
            <ExportMenu articles={selectedArticles.length > 0 ? selectedArticles : items.map(i => i.article)} query="收藏夹" />
          )}
        </div>

        {loaded && items.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/20">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[11px] font-medium text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <div className={`w-3.5 h-3.5 rounded border border-gray-300 flex items-center justify-center transition-colors ${selectedUrls.size === items.length ? 'bg-indigo-600 border-indigo-600' : 'bg-white'}`}>
                {selectedUrls.size === items.length && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              全选
            </button>
          </div>
        )}

        {!loaded && (
          <div className="px-4 py-20 text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {loaded && items.length === 0 && (
          <div className="px-4 py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-base font-medium text-gray-900 mb-1">选题库还是空的</h2>
            <p className="text-xs text-gray-400">在搜索结果中点击书签图标即可收藏新闻</p>
          </div>
        )}

        {loaded && items.length > 0 && (
          <div className="animate-in">
            {items.map((item) => (
              <NewsCard
                key={item.id}
                article={item.article}
                isSaved={isSaved(item.article.url)}
                onSave={handleSave}
                onRemove={() => handleRemove(item.id)}
                selected={selectedUrls.has(item.article.url)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
