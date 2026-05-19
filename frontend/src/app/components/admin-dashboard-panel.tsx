'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import '../styles/admin-dashboard-panel.css';

type IconProps = React.SVGProps<SVGSVGElement>;

const Icons = {
  Users: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  TrendingUp: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
  ),
  Bell: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  ),
  AlertTriangle: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  History: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  Upload: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
  ),
  Settings: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  ),
  Pin: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
  ),
  Home: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  LogOut: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
  ),
  Eye: (props: IconProps) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
};

const navItems = [
  { id: 1, label: 'Inicio',                icon: 'Home',          path: '/top-of-page' },
  { id: 2, label: 'Gestión Docente',       icon: 'Users',         path: '/user-management' },
  { id: 3, label: 'Ranking Institucional', icon: 'TrendingUp',    path: '/institutional-ranking' },
  { id: 4, label: 'Observaciones',         icon: 'Eye',           path: '/observations' },
  { id: 5, label: 'Alertas de Desempeño',  icon: 'AlertTriangle', path: '/performance-alert' },
  { id: 6, label: 'Cursos Históricos',     icon: 'History',       path: '/history-view' },
  { id: 7, label: 'Carga Masiva',          icon: 'Upload',        path: '/bulk-upload' },
];

interface AdminDashboardPanelProps {
  userName?: string;
  activePath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
}

const AdminDashboardPanel: React.FC<AdminDashboardPanelProps> = ({
  activePath: propActivePath,
  onNavigate,
  onLogout,
}) => {
  const { signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const activePath = propActivePath || pathname;

  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);

  const isExpanded = isHovered || isPinned;

  useEffect(() => {
    setIsMounted(true);
    const fetchVaultIdentity = async () => {
      if (!clerkUser) return;
      
      const email = clerkUser.emailAddresses[0]?.email_address || '';
      const fullName = clerkUser.fullName || '';

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/access-vault/identity/`, {
          headers: { 
            'X-Clerk-ID': clerkUser.id,
            'X-Clerk-Email': email,
            'X-Clerk-Name': fullName
          }
        });
        if (res.ok) {
          const data = await res.json();
          setVaultData(data);
        }
      } catch (e) { 
        console.error("Error fetching vault identity:", e); 
      }
    };
    
    if (clerkUser) {
      fetchVaultIdentity();
    }
  }, [clerkUser]);

  const handleNavigation = (path: string) => {
    setIsHovered(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      onLogout?.();
      router.push('/sign-in');
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      router.push('/sign-in');
    }
  };

  if (!isMounted) return null;

  const displayName = vaultData?.identity?.full_identity_name || clerkUser?.fullName || 'Usuario';
  const roleMap: Record<string, string> = {
    'GATEKEEPER_ADMIN': 'Administrador',
    'STAFF_COORDINATOR': 'Coordinador'
  };
  const displayRole = roleMap[vaultData?.identity?.access_level] || 'Cargando rol...';
  const displayFaculty = vaultData?.profile?.org_unit || 'Facultad no asignada';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      <div className={`adp-layout-spacer ${isPinned ? 'adp-spacer--pinned' : 'adp-spacer--collapsed'}`} />

      <nav
        className={`adp-pill-container ${isExpanded ? 'adp-pill--expanded' : 'adp-pill--collapsed'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="adp-header">
          <div className={`adp-logo-wrapper adp-text ${isExpanded ? 'adp-text--visible' : ''}`}>
            <img
              src="/icon.png"
              alt="Logo Landívar"
              className="adp-institutional-logo"
            />
          </div>

          <div className="adp-brand-card">
            <div className="adp-profile-area">
              <div className="adp-user-profile">
                <div className="adp-avatar">
                  <span>{initials}</span>
                </div>
                <div className={`adp-user-details adp-text ${isExpanded ? 'adp-text--visible' : ''}`}>
                  <span className="adp-user-name">{displayName}</span>
                  <span className="adp-user-role">{displayRole}</span>
                  <span className="adp-faculty-tag">{displayFaculty}</span>
                </div>
              </div>

              <div className={`adp-profile-actions adp-text ${isExpanded ? 'adp-text--visible' : ''}`}>
                <button
                  className={`adp-pin-btn ${isPinned ? 'adp-pin-btn--active' : ''}`}
                  onClick={() => setIsPinned(!isPinned)}
                >
                  <Icons.Pin />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="adp-nav-list">
          {navItems.map((item) => {
            const Icon = Icons[item.icon as keyof typeof Icons];
            const isActive = activePath === item.path;
            return (
              <button
                key={item.id}
                className={`adp-item ${isActive ? 'adp-item--active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="adp-item-icon"><Icon /></span>
                <span className={`adp-text ${isExpanded ? 'adp-text--visible' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="adp-actions-bottom">
          <button
            className={`adp-item adp-hide-mobile ${activePath === '/settings' ? 'adp-item--active' : ''}`}
            onClick={() => handleNavigation('/settings')}
          >
            <span className="adp-item-icon"><Icons.Settings /></span>
            <span className={`adp-text ${isExpanded ? 'adp-text--visible' : ''}`}>Configuración</span>
          </button>

          <div className="adp-divider adp-hide-mobile" />

          <button className="adp-item adp-item-logout adp-hide-mobile" onClick={handleLogout}>
            <span className="adp-item-icon"><Icons.LogOut /></span>
            <span className={`adp-text ${isExpanded ? 'adp-text--visible' : ''}`}>Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default AdminDashboardPanel;
