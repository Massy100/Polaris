'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

const typeStyles: Record<string, { bg: string; border: string; icon: string; dot: string }> = {
  warning: { bg: '#fffbeb', border: '#fcd34d', icon: '#d97706', dot: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: '#2563eb', dot: '#3b82f6' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', dot: '#ef4444' },
};

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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="url-page-bg flex-1">
      <style>{`
        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          cursor: default;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
          position: relative;
        }
        .notif-item:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .notif-item.unread {
          background: #fafbff;
          border-color: #dbeafe;
        }
        .notif-dot {
          position: absolute;
          top: 18px;
          right: 18px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: opacity 0.3s ease;
        }
        .notif-item:hover .notif-dot {
          opacity: 0;
        }
        .notif-read-hint {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 11px;
          color: #9ca3af;
          opacity: 0;
          transition: opacity 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .notif-item.unread:hover .notif-read-hint {
          opacity: 1;
        }
        .notif-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .notif-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px;
        }
        .notif-msg {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 6px;
          line-height: 1.5;
          padding-right: 60px;
        }
        .notif-time {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }
        .notif-read-badge {
          font-size: 11px;
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px 60px' }}>
        <header style={{ marginBottom: '32px' }}>
          <button
            onClick={() => router.push('/top-of-page')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', color: '#4b5563',
              cursor: 'pointer', marginBottom: '20px', fontWeight: 500,
              fontSize: '14px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Regresar al menú principal
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Notificaciones
                {unreadCount > 0 && (
                  <span style={{
                    marginLeft: '10px', fontSize: '13px', fontWeight: 600,
                    background: '#3b82f6', color: '#fff', borderRadius: '20px',
                    padding: '2px 10px', verticalAlign: 'middle',
                  }}>
                    {unreadCount} nuevas
                  </span>
                )}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Pasa el cursor sobre una notificación para marcarla como leída.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  fontSize: '13px', fontWeight: 500, color: '#2563eb',
                  background: 'none', border: '1px solid #bfdbfe',
                  borderRadius: '8px', padding: '7px 14px', cursor: 'pointer',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map(n => {
            const s = typeStyles[n.type];
            return (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onMouseEnter={() => !n.read && markAsRead(n.id)}
              >
                <div
                  className="notif-icon-wrap"
                  style={{ background: s.bg, borderColor: s.border, color: s.icon }}
                >
                  <TypeIcon type={n.type} />
                </div>

                <div style={{ flex: 1 }}>
                  <p className="notif-title" style={{ opacity: n.read ? 0.6 : 1 }}>{n.title}</p>
                  <p className="notif-msg">{n.message}</p>
                  <span className="notif-time">{n.time}</span>
                  {n.read && <span className="notif-read-badge" style={{ marginLeft: '10px' }}>· leída</span>}
                </div>

                {!n.read && (
                  <>
                    <div className="notif-dot" style={{ background: s.dot }} />
                    <div className="notif-read-hint">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      marcar leída
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {notifications.every(n => n.read) && (
          <div style={{
            textAlign: 'center', padding: '48px 0',
            color: '#9ca3af', fontSize: '14px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Todo al día. No tienes notificaciones pendientes.
          </div>
        )}
      </main>
    </div>
  );
}