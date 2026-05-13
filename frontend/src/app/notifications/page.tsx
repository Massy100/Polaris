'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './notifications.css';

interface TeacherFromAPI {
  teacher_id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  courses_taught: string;
  rating: number;
  score: number | null;
}

interface TeacherDanger {
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

function getStoredIds(key: string): number[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveStoredIds(key: string, ids: number[]) {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch {}
}

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const IconCheckAll = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 6 7 17 2 12"></polyline>
    <polyline points="22 10 11 21 9 19"></polyline>
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const TypeIcon = ({ type }: { type: string }) => {
  if (type === 'error') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<TeacherDanger[]>([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<number[]>(() => getStoredIds(LS_READ_IDS));
  const [deletedIds, setDeletedIds] = useState<number[]>(() => getStoredIds(LS_DELETED_IDS));

  const readIdsRef = useRef(readIds);
  readIdsRef.current = readIds;
  const deletedIdsRef = useRef(deletedIds);
  deletedIdsRef.current = deletedIds;

  const fetchAllTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let allResults: TeacherFromAPI[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('page_size', '100');

        const response = await fetch(`${API_URL}/academic-career/teachers/?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Error al cargar los docentes');

        const data = await response.json();
        allResults = allResults.concat(data.results);
        hasMore = data.next !== null;
        page++;
      }

      const currentReadIds = readIdsRef.current;
      const currentDeletedIds = deletedIdsRef.current;

      const dangerTeachers: TeacherDanger[] = allResults
        .filter((teacher: TeacherFromAPI) => {
          if (currentDeletedIds.includes(teacher.teacher_id)) return false;
          if (teacher.score === null || teacher.score === undefined) return true;
          return teacher.score <= DANGER_THRESHOLD;
        })
        .map((teacher: TeacherFromAPI) => {
          const scoreValue = teacher.score ?? 0;
          const isNullScore = teacher.score === null || teacher.score === undefined;
          const name = teacher.full_name || `${teacher.first_name} ${teacher.last_name}` || `Docente ${teacher.teacher_id}`;
          return {
            id: teacher.teacher_id,
            name,
            score: scoreValue,
            message: isNullScore
              ? `El docente ${name} no tiene una puntuación asignada.`
              : `El docente ${name} tiene una puntuación de ${scoreValue}%, por debajo del umbral mínimo.`,
            time: 'Recién detectado',
            type: isNullScore ? 'error' as const : scoreValue <= 30 ? 'error' as const : 'warning' as const,
            read: currentReadIds.includes(teacher.teacher_id),
          };
        });

      setNotifications(dangerTeachers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTeachers();
  }, [fetchAllTeachers]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReadIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      saveStoredIds(LS_READ_IDS, next);
      return next;
    });
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(prev => {
      const next = [...new Set([...prev, ...allIds])];
      saveStoredIds(LS_READ_IDS, next);
      return next;
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingIds(prev => [...prev, id]);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setDeletedIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      saveStoredIds(LS_DELETED_IDS, next);
      return next;
    });
  };

  const deleteAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setNotifications([]);
    setDeletedIds(prev => {
      const next = [...new Set([...prev, ...allIds])];
      saveStoredIds(LS_DELETED_IDS, next);
      return next;
    });
  };

  return (
    <div className="nc-wrapper">
      <div className="nc-container">
        <div className="nc-nav-area">
          <button className="nc-back-btn" onClick={() => router.push('/top-of-page')}>
            <IconBack />
            <span>Volver al inicio</span>
          </button>
        </div>

        <div className="nc-card">
          <header className="nc-header">
            <div className="nc-header-left">
              <h1 className="nc-title">Centro de Notificaciones</h1>
              {unreadCount > 0 && (
                <span className="nc-badge">{unreadCount}</span>
              )}
            </div>

            <div className="nc-header-actions">
              {unreadCount > 0 && (
                <button className="nc-btn-global nc-mark-all" onClick={markAllAsRead}>
                  <IconCheckAll />
                  <span>Marcar todas como leídas</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button className="nc-btn-global nc-delete-all" onClick={deleteAllNotifications}>
                  <IconTrash />
                  <span>Eliminar todas</span>
                </button>
              )}
            </div>
          </header>

          <div className="nc-list">
            {loading ? (
              <div className="nc-empty">
                <p>Cargando docentes en peligro...</p>
              </div>
            ) : error ? (
              <div className="nc-empty">
                <p style={{ color: 'var(--url-danger)' }}>{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="nc-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p>No hay docentes en peligro. Todos los docentes tienen un rendimiento adecuado.</p>
              </div>
            ) : (
              notifications.map(n => {
                const isDeleting = deletingIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    className={`nc-item ${!n.read ? 'nc-item-unread' : ''} ${isDeleting ? 'nc-item-deleting' : ''}`}
                    onMouseEnter={() => !n.read && markAsRead(n.id)}
                  >
                    <div className={`nc-icon-wrapper nc-icon-${n.type}`}>
                      <TypeIcon type={n.type} />
                    </div>

                    <div className="nc-content">
                      <div className="nc-content-top">
                        <h3 className="nc-item-title">Rendimiento crítico: {n.name}</h3>
                        <span className="nc-item-time">{n.time}</span>
                      </div>
                      <p className="nc-item-msg">{n.message}</p>
                    </div>

                    <div className="nc-action-area">
                      {!n.read && (
                        <button
                          className="nc-btn-action nc-btn-read"
                          onClick={(e) => markAsRead(n.id, e)}
                          title="Marcar como leída"
                        >
                          <IconCheck />
                        </button>
                      )}
                      <button
                        className="nc-btn-action nc-btn-delete"
                        onClick={(e) => deleteNotification(n.id, e)}
                        title="Eliminar notificación"
                      >
                        <IconTrash />
                      </button>

                      {!n.read && <div className="nc-unread-indicator"></div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
