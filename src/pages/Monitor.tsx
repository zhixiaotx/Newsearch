import React, { useState, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import NewsCard from '@/components/NewsCard';
import ExportMenu from '@/components/ExportMenu';
import SkeletonCard from '@/components/SkeletonCard';
import { useMonitor } from '@/hooks/useMonitor';
import { useCollections } from '@/hooks/useCollections';
import { useToast } from '@/components/Toast';
import type { NewsArticle, MonitorTask } from '@/types';

export default function MonitorPage() {
  const { tasks, loaded, addTask, removeTask, updateTask } = useMonitor();
  const { isSaved, save, remove: removeSaved } = useCollections();
  const { toast } = useToast();
  
  const [newQuery, setNewQuery] = useState('');
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});
  const [taskResults, setTaskResults] = useState<Record<string, NewsArticle[]>>({});
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuery.trim()) return;
    addTask(newQuery.trim(), { time: '24h', sortBy: 'publishedAt' });
    setNewQuery('');
    toast('已添加监控任务', 'success');
  };

  const toggleSelect = useCallback((url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const toggleSelectAllForTask = useCallback((taskId: string) => {
    const results = taskResults[taskId] || [];
    const allSelected = results.every((a) => selectedUrls.has(a.url));
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      results.forEach((a) => {
        if (allSelected) next.delete(a.url);
        else next.add(a.url);
      });
      return next;
    });
  }, [taskResults, selectedUrls]);

  const selectedArticles = Array.from(selectedUrls).map(url => {
    // Find article in any task result
    for (const res of Object.values(taskResults)) {
      const found = res.find(a => a.url === url);
      if (found) return found;
    }
    return null;
  }).filter(Boolean) as NewsArticle[];

  const refreshTask = async (task: MonitorTask) => {
    setLoadingTasks(prev => ({ ...prev, [task.id]: true }));
    try {
      const params = new URLSearchParams({
        q: task.query,
        time: task.filters.time,
        sortBy: task.filters.sortBy
      });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      
      if (data.articles) {
        setTaskResults(prev => ({ ...prev, [task.id]: data.articles }));
        updateTask(task.id, { 
          lastChecked: new Date().toISOString(),
          newHitsCount: data.articles.length 
        });
      }
    } catch {
      toast('刷新失败', 'error');
    } finally {
      setLoadingTasks(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const handleSave = useCallback((article: NewsArticle) => {
    save(article);
    toast('已收藏到选题库', 'success');
  }, [save, toast]);

  const handleRemove = useCallback((url: string) => {
    removeSaved(url); // This is actually removeSavedByUrl in our hook
    toast('已从选题库移除', 'info');
  }, [removeSaved, toast]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      
      <main className="max-w-2xl mx-auto pb-16">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </span>
            <h1 className="text-base font-semibold text-gray-900">关键词监控</h1>
          </div>
          <p className="text-[11px] text-gray-400">实时追踪你感兴趣的主题，不再错过任何新消息</p>
        </div>

        <div className="px-4 py-4 bg-gray-50/50">
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              placeholder="输入想要监控的主题或关键词..."
              className="flex-1 h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button
              type="submit"
              className="px-4 h-9 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              添加
            </button>
          </form>
        </div>

        <div className="mt-4 px-4 space-y-4">
          {!loaded && (
            <div className="py-20 text-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {loaded && tasks.length === 0 && (
            <div className="py-20 text-center animate-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-sm font-medium text-gray-900">还没有监控任务</h2>
              <p className="text-[11px] text-gray-400 mt-1">添加感兴趣的关键词，系统将自动帮你刷新</p>
            </div>
          )}

          {tasks.map((task) => (
            <div key={task.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm animate-in">
              <div className="px-4 py-3 flex items-center justify-between bg-gray-50/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{task.query}</h3>
                    {task.newHitsCount && task.newHitsCount > 0 ? (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded">
                        {task.newHitsCount} 条新结果
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    上次检查: {task.lastChecked ? new Date(task.lastChecked).toLocaleString() : '从不'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => refreshTask(task)}
                    disabled={loadingTasks[task.id]}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className={`w-4 h-4 ${loadingTasks[task.id] ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      activeTaskId === task.id ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeTask(task.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {activeTaskId === task.id && (
                <div className="divide-y divide-gray-50 border-t border-gray-100">
                  {taskResults[task.id] && taskResults[task.id]!.length > 0 && (
                    <div className="px-4 py-2 flex items-center justify-between border-b border-gray-50 bg-gray-50/20">
                      <button
                        onClick={() => toggleSelectAllForTask(task.id)}
                        className="flex items-center gap-2 text-[11px] font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                      >
                        <div className={`w-3.5 h-3.5 rounded border border-gray-300 flex items-center justify-center transition-colors ${taskResults[task.id]!.every(a => selectedUrls.has(a.url)) ? 'bg-indigo-600 border-indigo-600' : 'bg-white'}`}>
                          {taskResults[task.id]!.every(a => selectedUrls.has(a.url)) && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        全选
                      </button>
                      <ExportMenu 
                        articles={taskResults[task.id]!.filter(a => selectedUrls.has(a.url)).length > 0 
                          ? taskResults[task.id]!.filter(a => selectedUrls.has(a.url)) 
                          : taskResults[task.id]!} 
                        query={task.query} 
                      />
                    </div>
                  )}
                  {loadingTasks[task.id] && !taskResults[task.id] && (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                  )}
                  {taskResults[task.id]?.length === 0 && !loadingTasks[task.id] && (
                    <div className="py-8 text-center text-[11px] text-gray-400">暂无新结果</div>
                  )}
                  {taskResults[task.id]?.map((article, i) => (
                    <NewsCard
                      key={`${task.id}-${article.url}-${i}`}
                      article={article}
                      isSaved={isSaved(article.url)}
                      onSave={handleSave}
                      onRemove={() => handleRemove(article.url)}
                      selected={selectedUrls.has(article.url)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
