'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './notifications.css';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'info' | 'error';
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Alerta de desempeño', message: 'El docente Juan Pérez tiene un índice por debajo del umbral mínimo.', time: 'Hace 10 min', type: 'warning', read: false },
  { id: 2, title: 'Carga completada', message: 'El pensum del ciclo 2025-1 fue cargado exitosamente.', time: 'Hace 1 hora', type: 'info', read: false },
  { id: 3, title: 'Error en sincronización', message: 'No se pudo sincronizar con el sistema académico. Intente nuevamente.', time: 'Hace 3 horas', type: 'error', read: false },
  { id: 4, title: 'Ranking actualizado', message: 'El ranking institucional del período actual fue recalculado.', time: 'Ayer', type: 'info', read: true },
  { id: 5, title: 'Nuevo docente registrado', message: 'María García fue añadida al sistema de gestión docente.', time: 'Hace 2 días', type: 'info', read: true },
];

// --- Íconos ---
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
  if (type === 'warning') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
  if (type === 'error') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingIds(prev => [...prev, id]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setDeletingIds(prev => prev.filter(delId => delId !== id));
    }, 300);
  };

  const deleteAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setDeletingIds(allIds);
    setTimeout(() => {
      setNotifications([]);
      setDeletingIds([]);
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
            {notifications.map(n => {
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
                      <h3 className="nc-item-title">{n.title}</h3>
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
            })}

            {/* ESTADO: NOTIFICACIONES AL DÍA */}
            {notifications.length === 0 && (
              <div className="nc-empty">
                <div className="nc-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3>Notificaciones al día</h3>
                <p>No tienes alertas ni mensajes pendientes en tu bandeja.</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}