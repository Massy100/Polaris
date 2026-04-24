'use client';

import { useRouter } from 'next/navigation';
import './settings.css';

export default function SettingsPage() {
  const router = useRouter();

  const CATEGORIES = [
    {
      label: 'Cuenta',
      description: 'Gestión de tu identidad y seguridad personal.',
      items: [
        {
          id: 'profile',
          title: 'Mi Perfil',
          description: 'Información personal, foto y preferencias de contacto.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          ),
          path: '/settings/profile'
        }
      ]
    },
    {
      label: 'Académico',
      description: 'Configuración de la estructura y reglas del sistema.',
      items: [
        {
          id: 'data-import',
          title: 'Gestión de Importaciones',
          description: 'Carga masiva de pensum y plantillas de encuestas vía Excel.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
            </svg>
          ),
          path: '/settings/data-import'
        },
        {
          id: 'weights',
          title: 'Pesos y Fórmulas',
          description: 'Configura los porcentajes y criterios para la evaluación final del docente.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          ),
          path: '/weights-config'
        },
        {
          id: 'alerts',
          title: 'Reglas de Notificación',
          description: 'Define qué eventos disparan alertas para docentes y administradores.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          ),
          path: '/settings/alert-config'
        }
      ]
    },
    {
      label: 'Sistema',
      description: 'Auditoría, equipo y mantenimiento global.',
      items: [
        {
          id: 'audit',
          title: 'Auditoría y Equipo',
          description: 'Historial de cambios y gestión de administradores del sistema.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
          path: '/settings/audit'
        }
      ]
    }
  ];

  return (
    <div className="url-page-bg flex-1">
      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <header className="settings-header">
          <div className="settings-eyebrow">
            Configuración General
          </div>
          <h1 className="settings-title">Ajustes del Sistema</h1>
          <p className="settings-subtitle">Administra los parámetros críticos de Polaris y las preferencias de tu cuenta institucional.</p>
        </header>

        <div className="settings-categories">
          {CATEGORIES.map((cat) => (
            <div key={cat.label} className="settings-category-block">
              <div className="settings-category-header">
                <div className="settings-category-label">
                  <div className="settings-category-dot" />
                  {cat.label}
                </div>
                <p className="settings-category-desc">{cat.description}</p>
              </div>

              <div className="settings-grid">
                {cat.items.map((item) => (
                  <button 
                    key={item.id} 
                    className="settings-card"
                    onClick={() => router.push(item.path)}
                  >
                    <div className="settings-card-icon">
                      {item.icon}
                    </div>
                    <div className="settings-card-content">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <div className="settings-card-arrow">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}