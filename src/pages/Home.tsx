import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticle, TimeFilter, SortBy, SearchFilters, HotItem } from '@/types';
import { useCollections } from '@/hooks/useCollections';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useToast } from '@/components/Toast';
import NavBar from '@/components/NavBar';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import NewsCard from '@/components/NewsCard';
import SkeletonCard from '@/components/SkeletonCard';
import SetupGuide from '@/components/SetupGuide';
import ExportMenu from '@/components/ExportMenu';

const PAGE_SIZE = 20;

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({ time: '1w', sortBy: 'publishedAt' });
  const [lastQuery, setLastQuery] = useState('');
  const [lastMode, setLastMode] = useState<'basic' | 'semantic'>('basic');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [trending, setTrending] = useState<NewsArticle[]>([]);
  const [needsConfig, setNeedsConfig] = useState(false);
  const [searchedByUser, setSearchedByUser] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const { items: savedItems, isSaved, save, remove } = useCollections();
  const { items: searchHistory, add: addHistory } = useSearchHistory();
  const { toast } = useToast();
  const initializedRef = useRef(false);
  const filterChangeRef = useRef(false);

  useEffect(() => {
    // Clear selection when articles change
    setSelectedUrls(new Set());
  }, [articles]);

  const toggleSelect = useCallback((url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedUrls.size === articles.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(articles.map((a) => a.url)));
    }
  }, [articles, selectedUrls]);

  const selectedArticles = articles.filter((a) => selectedUrls.has(a.url));

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    fetch('/api/trending')
      .then((res) => res.json())
      .then((data) => {
        if (data.needsConfig) {
          setNeedsConfig(true);
        } else if (data.articles?.length > 0) {
          setArticles(data.articles);
          setSearched(true);
          setLastQuery('AI');
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    if (!lastQuery || !searched || loading) return;
    if (!filterChangeRef.current) return;
    filterChangeRef.current = false;
    handleSearch(lastQuery, lastMode);
  }, [filters]);

  const handleSearch = useCallback(async (query: string, mode: 'basic' | 'semantic') => {
    setLoading(true);
    setError(null);
    setLastQuery(query);
    setLastMode(mode);
    setDisplayCount(PAGE_SIZE);
    setTrending([]);
    setSearchedByUser(true);
    addHistory(query, mode);

    try {
      const endpoint = mode === 'semantic' ? '/api/semantic-search' : '/api/search';
      const params = new URLSearchParams({ q: query });

      if (mode === 'basic') {
        params.set('time', filters.time);
        params.set('sortBy', filters.sortBy);
      }

      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setArticles([]);
      } else {
        setArticles(data.articles || []);
      }
    } catch {
      setError('网络请求失败，请检查网络连接');
      setArticles([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [filters, addHistory]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: TimeFilter | SortBy) => {
    filterChangeRef.current = true;
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback((article: NewsArticle) => {
    save(article);
    toast('已收藏到选题库', 'success');
  }, [save, toast]);

  const handleRemove = useCallback((url: string) => {
    const item = savedItems.find((i) => i.article.url === url);
    if (item) {
      remove(item.id);
      toast('已从选题库移除', 'info');
    }
  }, [savedItems, remove, toast]);

  const handleHistoryClick = useCallback((query: string, mode: 'basic' | 'semantic') => {
    setLastQuery(query);
    handleSearch(query, mode);
  }, [handleSearch]);

  const displayArticles = articles.slice(0, displayCount);
  const hasMore = displayCount < articles.length;

  const showTrending = !searched && !error;
  const showSearchHistory = searchHistory.length > 0 && !searched;

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <SearchBar onSearch={handleSearch} loading={loading} />

      {(searched || loading) && (
        <FilterBar
          time={filters.time}
          sortBy={filters.sortBy}
          onTimeChange={(t) => handleFilterChange('time', t)}
          onSortChange={(s) => handleFilterChange('sortBy', s)}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-8 pb-16">
        <div className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
          {loading && (
            <div className="animate-in">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

        {!loading && error && (
          <div className="px-4 py-16 text-center animate-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">搜索出错了</p>
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        )}

        {showSearchHistory && (
          <div className="px-4 pt-4 animate-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">最近搜索</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {searchHistory.map((item, i) => (
                <button
                  key={`${item.query}-${i}`}
                  onClick={() => handleHistoryClick(item.query, item.mode)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100
                             rounded-lg text-xs text-gray-600 transition-colors"
                >
                  {item.mode === 'semantic' && (
                    <svg className="w-3 h-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  )}
                  {item.query}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && showTrending && initialLoading && (
          <div className="animate-in">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && showTrending && !initialLoading && (
          <div className="animate-in">
            {needsConfig && <SetupGuide />}

            {!needsConfig && trending.length > 0 ? (
              <>
                <div className="px-4 pt-4 pb-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">热门推荐</span>
                  </div>
                </div>
                {trending.map((article, i) => (
                  <NewsCard
                    key={`trending-${article.url}-${i}`}
                    article={article}
                    isSaved={isSaved(article.url)}
                    onSave={handleSave}
                    onRemove={handleRemove}
                  />
                ))}
              </>
            ) : (
              <div className="px-4 py-20 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                </div>
                <h2 className="text-base font-medium text-gray-900 mb-1">搜索你感兴趣的新闻</h2>
                <p className="text-xs text-gray-400">
                  试试「AI 智能搜索」用大白话描述你想要的内容
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && searched && !error && articles.length === 0 && (
          <div className="px-4 py-20 text-center animate-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">没有找到相关新闻</p>
            <p className="text-xs text-gray-400 mt-1">试试更换关键词或时间范围</p>
          </div>
        )}

        {!loading && displayArticles.length > 0 && (
          <div className="animate-in">
            {!searchedByUser && lastQuery === 'AI' && (
              <div className="px-4 pt-4 pb-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-gray-900">今日 AI 资讯</span>
                  <span className="text-[10px] text-gray-400">自动为你推荐</span>
                </div>
              </div>
            )}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-50 bg-gray-50/20">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[11px] font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                <div className={`w-3.5 h-3.5 rounded border border-gray-300 flex items-center justify-center transition-colors ${selectedUrls.size === articles.length ? 'bg-indigo-600 border-indigo-600' : 'bg-white'}`}>
                  {selectedUrls.size === articles.length && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                全选
              </button>
              <ExportMenu articles={selectedArticles.length > 0 ? selectedArticles : articles} query={lastQuery} />
            </div>

            {displayArticles.map((article, i) => (
              <NewsCard
                key={`${article.url}-${i}`}
                article={article}
                isSaved={isSaved(article.url)}
                onSave={handleSave}
                onRemove={handleRemove}
                selected={selectedUrls.has(article.url)}
                onToggleSelect={toggleSelect}
              />
            ))}

            {hasMore && (
              <div className="px-4 pt-3 pb-6">
                <button
                  onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
                  className="w-full h-10 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100
                             rounded-xl transition-colors"
                >
                  加载更多 ({articles.length - displayCount} 条)
                </button>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Desktop Sidebar: Hot Trends */}
        <div className="hidden lg:block w-72 shrink-0">
          <TrendsWidget />
        </div>
      </main>
    </div>
  );
}

function TrendsWidget() {
  const [items, setItems] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hotlist?type=weibo')
      .then(res => res.json())
      .then(data => setItems((data.data || []).slice(0, 10)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="sticky top-4">
      <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-orange-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              </svg>
            </span>
            <span className="text-xs font-bold text-gray-900">微博热搜</span>
          </div>
          <Link to="/trends" className="text-[10px] text-gray-400 hover:text-gray-900 transition-colors">查看更多</Link>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="w-3 h-3 bg-gray-200 rounded shrink-0" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))
          ) : (
            items.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 group">
                <span className={`shrink-0 text-[10px] font-bold w-4 text-center mt-0.5 ${i < 3 ? 'text-red-500' : 'text-gray-300'}`}>
                  {i + 1}
                </span>
                <span className="text-[11px] text-gray-600 group-hover:text-gray-900 leading-tight transition-colors line-clamp-2">
                  {item.title}
                </span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
