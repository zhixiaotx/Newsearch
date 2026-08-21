import React, { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import type { HotItem } from '@/types';

const TABS = [
  { id: 'weibo', name: '微博热搜' },
  { id: 'baidu', name: '百度热榜' },
  { id: 'zhihu', name: '知乎热榜' },
  { id: 'v2ex', name: 'V2EX' },
  { id: 'it-home', name: 'IT之家' },
];

export default function Trends() {
  const [activeTab, setActiveTab] = useState('weibo');
  const [items, setItems] = useState<HotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHot = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hotlist?type=${activeTab}`);
        const data = await res.json();
        setItems(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHot();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      
      <main className="max-w-2xl mx-auto pb-16">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
              </svg>
            </span>
            <h1 className="text-base font-semibold text-gray-900">实时热点</h1>
          </div>
          <p className="text-[11px] text-gray-400">汇聚各大平台实时爆料，发现全网热点</p>
        </div>

        <div className="px-4 py-2.5 border-b border-gray-50 flex gap-1 overflow-x-auto bg-white sticky top-0 z-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white font-medium shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-gray-100 rounded shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-50 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            items.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  i < 3 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-medium text-gray-900 group-hover:text-gray-700 leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-orange-500 font-medium">{item.hot}</span>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400">{TABS.find(t => t.id === activeTab)?.name}</span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
