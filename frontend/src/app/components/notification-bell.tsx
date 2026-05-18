'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '../hooks/use-notifications';
import '../styles/notification-bell.css';

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const IconAlert = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <circle cx="12" cy="17.5" r="0.5" fill="white" />
    <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, loading, unreadCount, deleteNotification, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSeeAll = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleItemClick = (notification: any) => {
    markAsRead(notification.id);
  };

  const latestNotifications = notifications.slice(0, 5);

  return (
    <div className="nb-container">
      <button
        ref={btnRef}
        className="nb-bell-btn"
        onClick={toggleDropdown}
        aria-label="Notificaciones"
        aria-expanded={isOpen}
      >
        <IconBell />
        {unreadCount > 0 && <span className="nb-indicator" />}
      </button>

      {isOpen && (
        <div className="nb-dropdown" ref={dropdownRef}>
          <div className="nb-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="nb-unread-tag">{unreadCount}</span>
            )}
          </div>

          <div className="nb-list">
            {loading && notifications.length === 0 ? (
              <div className="nb-loading">
                <span className="nb-spinner" />
                Cargando
              </div>
            ) : notifications.length === 0 ? (
              <div className="nb-empty">Sin notificaciones</div>
            ) : (
              latestNotifications.map(n => (
                <div
                  key={n.id}
                  className={`nb-item ${!n.read ? 'nb-item-unread' : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className={`nb-item-icon nb-icon-${n.type}`}>
                    <IconAlert />
                  </div>
                  <div className="nb-item-content">
                    <p className="nb-item-msg">{n.name}</p>
                    <p className="nb-item-desc">{n.message}</p>
                    <span className="nb-item-time">{n.time}</span>
                  </div>
                  <button
                    className="nb-item-delete"
                    onClick={e => handleDelete(n.id, e)}
                    aria-label={`Eliminar notificación de ${n.name}`}
                  >
                    <IconTrash />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="nb-footer">
            <button onClick={handleSeeAll} className="nb-see-all-btn">
              Ver todas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}