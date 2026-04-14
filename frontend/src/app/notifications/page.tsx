'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import '../styles/notifications.css';

type Notification = {
    id: number;
    type: 'danger' | 'warning';
    title: string;
    description: string;
    date: string;
    unread: boolean;
};

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: 1, type: 'danger', title: 'Profesor en bajo rendimiento', description: 'El profesor Juan Pérez tiene un rendimiento por debajo del 60%', date: '3 mar 2026', unread: true },
        { id: 2, type: 'warning', title: 'Profesor en peligro de rendimiento', description: 'La profesora María García está cerca del límite de bajo rendimiento', date: '3 mar 2026', unread: true },
        { id: 3, type: 'danger', title: 'Profesor en bajo rendimiento', description: 'El profesor Carlos López no ha cumplido con las metas del mes', date: '2 mar 2026', unread: false },
        { id: 4, type: 'warning', title: 'Profesor en peligro de rendimiento', description: 'El profesor Roberto Sánchez tiene asistencia irregular', date: '2 mar 2026', unread: true },
        { id: 5, type: 'danger', title: 'Profesor en bajo rendimiento', description: 'La profesora Ana Martínez tiene calificaciones estudiantiles bajas', date: '1 mar 2026', unread: false },
        { id: 6, type: 'warning', title: 'Profesor en peligro de rendimiento', description: 'El profesor Luis Torres necesita mejorar su puntualidad', date: '1 mar 2026', unread: true },
    ]);

    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsRead = (id: number) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, unread: false } : n)
        );
    };

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div className="notifications-container">
            <div className="notifications-card">

                <header className="notifications-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1>Notificaciones</h1>
                            <span className="notifications-count">{unreadCount} notificaciones no leídas</span>
                        </div>
                        <Link href="/top-of-page" title="Regresar al inicio" style={{ textDecoration: 'none' }}>
                            <div className='home-icon-wrapper' style={{ background: '#f0f4fa', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                                <Home size={22} color="#1a2fcc" />
                            </div>
                        </Link>
                    </div>
                </header>

                <div className="notification-list">
                    {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#667085', padding: '40px' }}>No tienes notificaciones pendientes.</p>
                    ) : (
                        notifications.map((notif) => (
                            <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>

                                <div className={`notif-icon-circle ${notif.type === 'danger' ? 'bg-danger' : 'bg-warning'}`}>
                                    {notif.type === 'danger' ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
                                </div>

                                <div className="notif-content">
                                    <span className="notif-title">{notif.title}</span>
                                    <span className="notif-desc">{notif.description}</span>
                                </div>

                                <span className="notif-date">{notif.date}</span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button
                                        className="btn-delete-notif"
                                        onClick={() => deleteNotification(notif.id)}
                                        title="Eliminar notificación"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    {notif.unread && (
                                        <div
                                            className="unread-dot"
                                            onClick={() => markAsRead(notif.id)}
                                            style={{ cursor: 'pointer' }}
                                            title="Marcar como leído"
                                        />
                                    )}
                                </div>

                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}