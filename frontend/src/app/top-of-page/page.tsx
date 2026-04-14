'use client';

import { useState } from 'react';
import AdminDashboardPanel from '../components/admin-dashboard-panel';
import DashboardCard from '../components/dashboard-card';
import '../styles/top-of-page.css';

type IconType = 'teachers' | 'ranking' | 'alerts' | 'history' | 'upload';

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
    id: 'ranking',
    icon: 'ranking',
    iconColor: 'blue',
    title: 'Ranking Institucional',
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
    description: 'Acceso completo al historial académico de cada docente. Consulta cursos impartidos, evaluaciones previas, evolución del desempeño y trayectoria completa a lo largo de los años.',
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
    <>
      <AdminDashboardPanel
        userName="Usuario Admin"
        activePath="/"
        onNavigate={(path) => { window.location.href = path; }}
        onLogout={() => { window.location.href = "/"; }}
      />

      <div className="wrapper">
        <main className="main">
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
        <span className="brand">polaris</span>
      </div>
    </>
  );
}