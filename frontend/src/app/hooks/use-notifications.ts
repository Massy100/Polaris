'use client';

import { useState, useEffect, useCallback } from 'react';

interface TeacherFromAPI {
  teacher_id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  rating?: number;
  score: number | null;
}

export interface Notification {
  id: number;
  name: string;
  score: number;
  message: string;
  time: string;
  type: 'warning' | 'error';
  read: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const DANGER_THRESHOLD = 50;
const LS_READ_IDS = 'notifications_read_ids';
const LS_DELETED_IDS = 'notifications_deleted_ids';
const SS_CACHE = 'notifications_cache';
const FETCH_INTERVAL = 20000;

function getStoredIds(key: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredIds(key: string, ids: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const rids = getStoredIds(LS_READ_IDS);
    const dids = getStoredIds(LS_DELETED_IDS);
    setReadIds(rids);
    setDeletedIds(dids);
    setMounted(true);

    const cached = sessionStorage.getItem(SS_CACHE);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Notification[];
        const filtered = parsed.filter(n => !dids.includes(n.id));
        setNotifications(filtered);
      } catch {}
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/academic-career/teachers/?page_size=15`,
        { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined }
      );

      if (!response.ok) throw new Error('Error al cargar las notificaciones');

      const data = await response.json();
      const allResults: TeacherFromAPI[] = data.results || [];
      const currentReadIds = getStoredIds(LS_READ_IDS);
      const currentDeletedIds = getStoredIds(LS_DELETED_IDS);

      const dangerTeachers: Notification[] = allResults
        .filter((teacher: TeacherFromAPI) => {
          if (currentDeletedIds.includes(teacher.teacher_id)) return false;
          if (teacher.score === null || teacher.score === undefined) return true;
          return teacher.score <= DANGER_THRESHOLD;
        })
        .slice(0, 5)
        .map((teacher: TeacherFromAPI) => {
          const scoreValue = teacher.score ?? 0;
          const isNullScore = teacher.score === null || teacher.score === undefined;
          const name =
            teacher.full_name ||
            `${teacher.first_name} ${teacher.last_name}`.trim() ||
            `Docente ${teacher.teacher_id}`;

          return {
            id: teacher.teacher_id,
            name,
            score: scoreValue,
            message: isNullScore
              ? `Sin puntuación asignada`
              : `Puntuación: ${scoreValue}%`,
            time: 'Recién detectado',
            type: isNullScore ? ('error' as const) : scoreValue <= 30 ? ('error' as const) : ('warning' as const),
            read: currentReadIds.includes(teacher.teacher_id),
          };
        });

      setNotifications(dangerTeachers);
      setError(null);
      sessionStorage.setItem(SS_CACHE, JSON.stringify(dangerTeachers));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      if (notifications.length === 0) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [notifications.length]);

  useEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(() => {
      setLoading(true);
      fetchNotifications();
    }, 100);

    const interval = setInterval(() => {
      fetchNotifications();
    }, FETCH_INTERVAL);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [mounted, fetchNotifications]);

  const deleteNotification = useCallback((id: number) => {
    setDeletedIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      saveStoredIds(LS_DELETED_IDS, next);
      return next;
    });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: number) => {
    setReadIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveStoredIds(LS_READ_IDS, next);
      return next;
    });
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    deleteNotification,
    markAsRead,
    refresh: () => fetchNotifications(),
  };
}