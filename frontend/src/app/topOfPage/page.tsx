'use client';

import { useState } from 'react';
import SidebarDropDown from '../components/sidebar-drop-down';
import DashboardCard from '../components/dashboard-card';
import styles from '../styles/topOfPage.module.css';

type IconType = 'teachers' | 'ranking' | 'alerts' | 'history' | 'upload';

const cards: { id: string; icon: IconType; iconColor: 'blue' | 'yellow'; title: string; description: string; href: string }[] = [
  {
    id: 'teachers',
    icon: 'teachers',
    iconColor: 'blue',
    title: 'Gestión de Docentes',
    description: 'CRUD (Crear, Leer, Actualizar, Borrar) de Docentes. Crear docentes para tener acceso rápido a sus demás funciones como carga masiva.',
    href: '/teachers',
  },
  {
    id: 'ranking',
    icon: 'ranking',
    iconColor: 'blue',
    title: 'Ranking Institucional',
    description: 'Vista para directivos sobre los docentes mejor evaluados.',
    href: '/ranking',
  },
  {
    id: 'alerts',
    icon: 'alerts',
    iconColor: 'yellow',
    title: 'Alertas de Desempeño',
    description: 'Notificaciones automáticas cuando un docente baja de cierto puntaje.',
    href: '/alerts',
  },
  {
    id: 'history',
    icon: 'history',
    iconColor: 'blue',
    title: 'Cursos Históricos',
    description: 'Acceso completo al historial académico de cada docente. Consulta cursos impartidos, evaluaciones previas, evolución del desempeño y trayectoria completa a lo largo de los años.',
    href: '/history',
  },
  {
    id: 'upload',
    icon: 'upload',
    iconColor: 'yellow',
    title: 'Carga Masiva de Datos',
    description: 'Interfaz para subir archivos Excel/CSV con las de títulos, méritos y evaluación docente.',
    href: '/upload',
  },
];

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.menuButton}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <span className={styles.menuIcon} />
        <span className={styles.menuIcon} />
        <span className={styles.menuIcon} />
      </button>

      <SidebarDropDown open={sidebarOpen} onClose={() => setSidebarOpen(false)}>{null}</SidebarDropDown>

      <main className={styles.main}>
        <div className={styles.grid}>
          {cards.map((card) => (
            <DashboardCard key={card.id} {...card} />
          ))}
        </div>
      </main>

      <span className={styles.brand}>polaris</span>
    </div>
  );
}