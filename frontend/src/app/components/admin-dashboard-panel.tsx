'use client';

import { useState, useEffect } from 'react';
import '../styles/admin-dashboard-panel.css';

type IconProps = React.SVGProps<SVGSVGElement>;

const Icons: Record<string, React.FC<IconProps>> = {
  Users: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  TrendingUp: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Bell: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  History: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Upload: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Menu: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  X: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  LogOut: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Settings: (props) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

type IconName = keyof typeof Icons;

interface QuickAccessItem {
  id: number;
  label: string;
  icon: IconName;
  path: string;
}

interface AdminDashboardPanelProps {
  userName?: string;
  activePath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const quickAccessItems: QuickAccessItem[] = [
  { id: 1, label: 'Gestión Docente',      icon: 'Users',      path: '/user-management'   },
  { id: 2, label: 'Ranking Institucional', icon: 'TrendingUp', path: '/institutional-ranking'},
  { id: 3, label: 'Alerta de Desempeño',  icon: 'Bell',       path: '/performance-alert'},
  { id: 4, label: 'Cursos Históricos',    icon: 'History',    path: '/history-view' },
  { id: 5, label: 'Carga Masiva',         icon: 'Upload',     path: '/bulk-upload'      },
];

const AdminDashboardPanel: React.FC<AdminDashboardPanelProps> = ({
  userName = 'Usuario Admin',
  activePath = '',
  onNavigate,
  onLogout,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleItemClick = (item: QuickAccessItem): void => {
    try {
      onNavigate?.(item.path);
    } catch (error) {
      console.error(error);
    } finally {
      setOpen(false);
    }
  };

  const handleLogout = (): void => {
    try {
      onLogout?.();
    } catch (error) {
      console.error(error);
    } finally {
      setOpen(false);
    }
  };

  if (!isMounted) {
    return null;
  };

  const handleSettings = (): void => {
    setOpen(false);
    onNavigate?.('/notifications');
  };

  const handleNotifications = (): void => {
    setOpen(false);
    onNavigate?.('/weights-config');
  };

  return (
    <>
      <button
        className={`adp-toggle ${open ? 'adp-toggle--hidden' : ''}`}
        onClick={() => setOpen(true)}
      >
        <Icons.Menu />
      </button>

      <div
        className={`adp-overlay ${open ? 'adp-overlay--visible' : ''}`}
        onClick={() => setOpen(false)}
      />

      <div className={`adp-container ${open ? 'adp-container--open' : ''}`}>
        <div className="adp-header">
          <button className="adp-icon-btn" onClick={() => setOpen(false)}>
            <Icons.X />
          </button>
          <div className="adp-header-actions">
            <button className="adp-icon-btn"
            onClick = {handleSettings}>
              <Icons.Bell />
            </button>
            <button className="adp-icon-btn"
            onClick = {handleNotifications}>
              <Icons.Settings />
            </button>
          </div>
        </div>

        <h1 className="adp-username">{userName}</h1>

        <div className="adp-quick-access">
          <span className="adp-section-label">Acceso Rápido</span>
          <div className="adp-items-list">
            {quickAccessItems.map((item) => {
              const Icon = Icons[item.icon];
              return (
                <button
                  key={item.id}
                  className={`adp-item ${activePath === item.path ? 'adp-item--active' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <span className="adp-item-icon"><Icon /></span>
                  <span className="adp-item-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="adp-footer">
          <button className="adp-logout-btn" onClick={handleLogout}>
            <Icons.LogOut />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPanel;