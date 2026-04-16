'use client';

import { useRouter, usePathname } from 'next/navigation';
import AdminDashboardPanel from '../components/admin-dashboard-panel';
import DashboardCard from '../components/dashboard-card';
import '../styles/top-of-page.css';

type IconType = 'teachers' | 'ranking' | 'alerts' | 'history' | 'upload' | 'user' ;

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
    id: 'coordinators',
    icon: 'user',
    iconColor: 'yellow',
    title: 'Gestión de Coordinadores',
    description: 'Centro de administración de coordinadores. Permite crear, editar y gestionar los accesos y roles de los coordinadores del sistema.',
    href: '/coord-management',
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
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminDashboardPanel
        userName="Usuario Admin"
        activePath={pathname}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
      />

      <div className="wrapper flex-1">
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
    </div>
  );
}