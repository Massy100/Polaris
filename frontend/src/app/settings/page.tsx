'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './settings.css';

const settingsSections = [
  {
    id: 'profile',
    title: 'Mi Perfil',
    description: 'Gestiona tu información personal, avatar y credenciales de acceso.',
    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    path: '/settings/profile'
  },
  {
    id: 'weights',
    title: 'Parámetros de Evaluación',
    description: 'Configura los porcentajes y valores para el cálculo del ranking docente.',
    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M10 18h4"/></svg>,
    path: '/weights-config'
  },
  {
    id: 'structure',
    title: 'Estructura Académica',
    description: 'Gestión del Pensum institucional y ciclos académicos activos.',
    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    path: '/pensum-upload'
  },
  {
    id: 'notifications',
    title: 'Notificaciones y Alertas',
    description: 'Define los umbrales de desempeño y canales de comunicación.',
    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    path: '/performance-alert'
  },
  {
    id: 'audit',
    title: 'Auditoría y Equipo',
    description: 'Revisa el historial de cambios y gestiona permisos de administrador.',
    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    path: '/settings/audit'
  }
];

export default function SettingsPage() {
  const router = useRouter();
  const [isAcademicLoaded, setIsAcademicLoaded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkLoadStatus = async () => {
      try {
        const response = await fetch('/api/integrations/status-pensum');
        if (!response.ok) return;
        const text = await response.text();
        if (!text) return;
        const data = JSON.parse(text);
        setIsAcademicLoaded(data.is_loaded ?? false);
      } catch (error) {
        console.error('Error verificando carga:', error);
      }
    };
    checkLoadStatus();
  }, []);

  const handleNavigation = (section: any) => {
    if (section.id === 'structure' && isAcademicLoaded) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      return;
    }
    router.push(section.path);
  };

  return (
    <div className="url-page-bg flex-1">
      {showNotification && (
        <div className="status-notification-overlay">
          <div className="status-notification-card">
            <div className="status-notification-icon">⚠️</div>
            <div className="status-notification-text">
              <p>La carga ya se realizó en la base de datos.</p>
              <span>Para hacer una carga nueva, restablezca en Auditoria y Equipo.</span>
            </div>
          </div>
        </div>
      )}

      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <header className="settings-header">
          <button
            onClick={() => router.push('/top-of-page')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              color: '#4b5563',
              cursor: 'pointer',
              marginBottom: '20px',
              fontWeight: 500
            }}
            className="hover:text-blue-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Regresar al menú principal
          </button>

          <h1 className="url-title" style={{ fontSize: '32px' }}>Configuración</h1>
          <p className="settings-subtitle">Administra los parámetros globales de Polaris y tu perfil institucional.</p>
        </header>

        <div className="settings-grid">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              className={`settings-card ${section.id === 'structure' && isAcademicLoaded ? 'card-disabled' : ''}`}
              onClick={() => handleNavigation(section)}
            >
              <div className="settings-card-icon">
                <section.icon />
              </div>
              <div className="settings-card-content">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <div className="settings-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}