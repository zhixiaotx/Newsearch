import React from 'react';
import type { NewsArticle } from '../types';
import { exportMarkdown, exportJSON, exportCSV, exportDocx, exportPDF, downloadFile } from '../lib/export';

interface ExportMenuProps {
  articles: NewsArticle[];
  query: string;
}

export default function ExportMenu({ articles, query }: ExportMenuProps) {
  const handleExport = async (format: 'markdown' | 'json' | 'csv' | 'docx' | 'pdf') => {
    const timestamp = Date.now();
    switch (format) {
      case 'markdown': {
        const content = exportMarkdown(articles, query);
        downloadFile(content, `news-export-${timestamp}.md`, 'text/markdown;charset=utf-8');
        break;
      }
      case 'json': {
        const content = exportJSON(articles, query);
        downloadFile(content, `news-export-${timestamp}.json`, 'application/json;charset=utf-8');
        break;
      }
      case 'csv': {
        const content = exportCSV(articles);
        downloadFile(content, `news-export-${timestamp}.csv`, 'text/csv;charset=utf-8');
        break;
      }
      case 'docx': {
        const blob = await exportDocx(articles, query);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `news-export-${timestamp}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      case 'pdf': {
        const blob = exportPDF(articles, query);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `news-export-${timestamp}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
    }
  };

  if (articles.length === 0) return null;

  return (
    <div className="px-4 py-3 flex items-center justify-end gap-1 overflow-x-auto no-scrollbar">
      <span className="text-[11px] text-gray-400 mr-auto whitespace-nowrap">
        已选择 {articles.length} 条
      </span>
      {['markdown', 'docx', 'pdf', 'json', 'csv'].map((fmt) => (
        <button
          key={fmt}
          onClick={() => handleExport(fmt as any)}
          className="px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100
                     rounded-md transition-colors uppercase tracking-wider whitespace-nowrap"
        >
          {fmt === 'markdown' ? 'MD' : fmt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
