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
          id: 'pensum',
          title: 'Estructura Académica',
          description: 'Carga y gestión del pensum oficial de la carrera.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          ),
          path: '/pensum'
        },
        {
          id: 'templates',
          title: 'Biblioteca de Plantillas',
          description: 'Formatos de evaluación docente y observación de aula.',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
          ),
          path: '/settings/templates'
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
        }
      ]
    },
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
