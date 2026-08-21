import React, { useRef } from 'react';
import NavBar from '@/components/NavBar';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/components/Toast';

export default function Settings() {
  const { settings, updateSettings, exportSettings, importSettings } = useSettings();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importSettings(file);
        toast('配置导入成功', 'success');
      } catch (err: any) {
        toast(err.message, 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">应用设置</h1>
            <p className="text-xs text-gray-500 mt-1">配置 AI 接口与应用偏好</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportSettings}
              className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              备份配置
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              恢复配置
            </button>
            <input ref={fileRef} type="file" className="hidden" accept=".json" onChange={handleImport} />
          </div>
        </div>

        <section className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <h2 className="text-sm font-semibold text-gray-900">AI 智能引擎配置</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">模型服务商</label>
              <div className="flex gap-2">
                {['gemini', 'openai', 'deepseek'].map((p) => (
                  <button
                    key={p}
                    onClick={() => updateSettings({ ai: { ...settings.ai, provider: p as any } })}
                    className={`px-4 py-2 text-xs rounded-xl border transition-all ${
                      settings.ai.provider === p
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {settings.ai.provider !== 'gemini' && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">API Base URL</label>
                <input
                  type="text"
                  placeholder={settings.ai.provider === 'deepseek' ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1'}
                  value={settings.ai.baseUrl || ''}
                  onChange={(e) => updateSettings({ ai: { ...settings.ai, baseUrl: e.target.value } })}
                  className="w-full h-10 px-4 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">API Key</label>
              <input
                type="password"
                placeholder="在此输入您的 API 密钥..."
                value={settings.ai.apiKey}
                onChange={(e) => updateSettings({ ai: { ...settings.ai, apiKey: e.target.value } })}
                className="w-full h-10 px-4 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">模型名称</label>
              <input
                type="text"
                placeholder={settings.ai.provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-3.5-turbo'}
                value={settings.ai.model}
                onChange={(e) => updateSettings({ ai: { ...settings.ai, model: e.target.value } })}
                className="w-full h-10 px-4 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </section>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
          <div className="shrink-0 text-amber-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-[11px] text-amber-800 leading-relaxed">
            <strong>隐私提示：</strong>您的 API 密钥仅存储在浏览器本地（LocalStorage），不会上传到任何服务器。清除浏览器缓存或切换浏览器会导致配置丢失，请定期备份配置。
          </div>
        </div>
      </main>
    </div>
  );
}
