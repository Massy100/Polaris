'use client';

import DashboardCard from '../components/dashboard-card';
import NotificationWrapper from '../components/notification-wrapper';
import './top-of-page.css';

type IconType = 'teachers' | 'ranking' | 'alerts' | 'history' | 'upload' | 'user' | 'observations';

const cards: { id: string; icon: IconType; iconColor: 'blue' | 'yellow'; title: string; description: string; href: string }[] = [
  {
    id: 'teachers',
    icon: 'teachers',
    iconColor: 'blue',
    title: 'Gestión de Docentes',
    description: 'CRUD (Crear, Leer, Actualizar, Borrar) de Docentes. Crear docentes para tener acceso rápido a sus demás funciones como carga masiva.',
    href: '/user-management',
  },

  {
    id: 'observations',
    icon: 'observations',
    iconColor: 'yellow',
    title: 'Gestión de Observaciones',
    description: 'Acceso directo a la evaluación docente en aula. Permite realizar observaciones en tiempo real y consultar resultados inmediatos.',
    href: '/observations',
  },

  {
    id: 'ranking',
    icon: 'ranking',
    iconColor: 'blue',
    title: 'Ponderación de IA',
    description: 'Vista para directivos sobre los docentes mejor evaluados.',
    href: '/institutional-ranking',
  },
  {
    id: 'alerts',
    icon: 'alerts',
    iconColor: 'yellow',
    title: 'Alertas de Desempeño',
    description: 'Notificaciones automáticas cuando un docente baja de cierto puntaje.',
    href: '/performance-alert',
  },
  {
    id: 'history',
    icon: 'history',
    iconColor: 'blue',
    title: 'Cursos Históricos',
    description: 'Acceso completo al historial académico de cada docente. Consulta cursos impartidos, evaluaciones previas y trayectoria completa.',
    href: '/history-view',
  },
  {
    id: 'upload',
    icon: 'upload',
    iconColor: 'yellow',
    title: 'Carga Masiva de Datos',
    description: 'Interfaz para subir archivos Excel/CSV con las de títulos, méritos y evaluación docente.',
    href: '/bulk-upload',
  },
];

export default function HomePage() {
  return (
    <div className="url-page-bg flex-1">
      <NotificationWrapper />
      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--url-navy)', marginBottom: '8px' }}>
            Sistema de Gestión Académica - Polaris
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--url-text-sec)' }}>
            Bienvenido al sistema de gestión y evaluación docente. Seleccione un módulo para comenzar.
          </p>
        </header>

        <div className="grid">
          {cards.map((card) => (
            <DashboardCard 
              key={card.id} 
              icon={card.icon}
              iconColor={card.iconColor}
              title={card.title}
              description={card.description}
              href={card.href}
              id={card.id}
            />
          ))}
        </div>
      </main>
    </div>
  );
}