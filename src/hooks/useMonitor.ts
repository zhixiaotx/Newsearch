import { useState, useEffect, useCallback } from 'react';
import type { MonitorTask, SearchFilters } from '../types';

const STORAGE_KEY = 'news-monitor-tasks';

function load(): MonitorTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useMonitor() {
  const [tasks, setTasks] = useState<MonitorTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTasks(load());
    setLoaded(true);
  }, []);

  const addTask = useCallback((query: string, filters: SearchFilters) => {
    const newTask: MonitorTask = {
      id: `${Date.now()}`,
      query,
      filters,
      lastChecked: new Date().toISOString(),
      newHitsCount: 0,
    };
    setTasks((prev) => {
      const updated = [newTask, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<MonitorTask>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { tasks, loaded, addTask, removeTask, updateTask };
}
