'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, Notification } from '../hooks/use-notifications';
import './notifications.css';

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
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
  const { notifications, loading, error, unreadCount, deleteNotification, markAsRead } = useNotifications();
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const handleDelete = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingIds(prev => [...prev, id]);
    setTimeout(() => {
      deleteNotification(id);
      setDeletingIds(prev => prev.filter(did => did !== id));
    }, 300);
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
                        onClick={(e) => handleDelete(n.id, e)}
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
