import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, AIConfig } from '../types';

const STORAGE_KEY = 'news-finder-settings';

const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.0-flash',
  }
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSettingsState(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    setLoaded(true);
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `news-finder-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback((file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          updateSettings(json);
          resolve();
        } catch (err) {
          reject(new Error('无效的配置文件'));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }, [updateSettings]);

  return { settings, loaded, updateSettings, exportSettings, importSettings };
}
