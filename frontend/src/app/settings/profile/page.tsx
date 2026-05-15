'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useApi } from '../../utils/api';
import './profile.css';

const NAV_ITEMS = [
  {
    id: 'personal',
    label: 'Información Personal',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    id: 'preferences',
    label: 'Preferencias',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
      </svg>
    ),
  },
  {
    id: 'access',
    label: 'Cuentas de Acceso',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

function getInitials(name: string) {
  if (!name || !name.trim()) return 'US';
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const api = useApi();
  const { isSignedIn } = useAuth();
  
  const [activeSection, setActiveSection] = useState('personal');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('me');

  const [personalForm, setPersonalForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [prefs, setPrefs] = useState({
    email_notifications: true,
    system_alerts: true,
    weekly_report: false,
    two_factor: false,
  });

  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [accessStats, setAccessStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [selectedAccessTab, setSelectedAccessTab] = useState('pending');

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await api.get('/accounts/users/me/');
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          setIsSuperAdmin(user.role === 'super_admin');
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    };

    if (isSignedIn) {
      loadCurrentUser();
    }
  }, [isSignedIn, api]);

  useEffect(() => {
    if (!isSuperAdmin || activeSection !== 'access') return;

    if (selectedAccessTab === 'directory') {
      loadFullDirectory();
    } else {
      loadAccessRequests();
    }
    loadAccessStats();
  }, [isSuperAdmin, activeSection, selectedAccessTab]);

  const loadAccessRequests = async () => {
    try {
      const res = await api.get(`/accounts/access-requests/?status=${selectedAccessTab}`);
      if (res.ok) {
        const data = await res.json();
        setAccessRequests(data.results || data);
      }
    } catch (error) {
      console.error('Error loading access requests:', error);
    }
  };

  const loadFullDirectory = async () => {
    try {
      const res = await api.get('/accounts/coordinators/?include_inactive=true');
      if (res.ok) {
        const data = await res.json();
        setCoordinators(data);
      }
    } catch (error) {
      console.error('Error loading coordinators directory:', error);
    }
  };

  const loadAccessStats = async () => {
    try {
      const res = await api.get('/accounts/access-requests/stats/');
      if (res.ok) {
        setAccessStats(await res.json());
      }
    } catch (error) {
      console.error('Error loading access stats:', error);
    }
  };

  const handleApproveAccess = async (requestId: number) => {
    try {
      const res = await api.post(`/accounts/access-requests/${requestId}/approve/`, {});
      if (res.ok) {
        toast('Solicitud aprobada correctamente');
        loadAccessRequests();
        loadAccessStats();
      }
    } catch (error) {
      console.error('Error approving access:', error);
      toast('Error al aprobar solicitud');
    }
  };

  const handleRejectAccess = async (requestId: number) => {
    try {
      const res = await api.post(`/accounts/access-requests/${requestId}/reject/`, {});
      if (res.ok) {
        toast('Solicitud rechazada');
        loadAccessRequests();
        loadAccessStats();
      }
    } catch (error) {
      console.error('Error rejecting access:', error);
      toast('Error al rechazar solicitud');
    }
  };

  const toggleCoordStatus = async (coordId: number) => {
    try {
      const res = await api.patch(`/accounts/coordinators/${coordId}/toggle-status/`, {});
      if (res.ok) {
        toast('Estado actualizado');
        loadFullDirectory();
      }
    } catch (error) {
      toast('Error al cambiar estado');
    }
  };

  const deleteCoordinator = async (coordId: number) => {
    if (!confirm('¿Seguro que desea eliminar este coordinador?')) return;
    try {
      const res = await api.delete(`/accounts/coordinators/${coordId}/`);
      if (res.ok) {
        toast('Coordinador eliminado');
        loadFullDirectory();
      }
    } catch (error) {
      toast('Error al eliminar');
    }
  };

  const handleSavePersonal = async () => {
    try {
      const endpoint = selectedProfileId === 'me'
        ? '/accounts/profile/personal/'
        : `/accounts/profile/${selectedProfileId}/personal/`;

      const res = await api.patch(endpoint, personalForm);
      if (res.ok) {
        toast('Perfil actualizado exitosamente');
      } else {
        const error = await res.json();
        toast(`Error: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      toast('Error al guardar el perfil');
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const endpoint = selectedProfileId === 'me' ? '/accounts/profile/' : `/accounts/profile/${selectedProfileId}/`;
        const res = await api.get(endpoint);
        if (!res.ok) return;
        const data = await res.json();

        if (data && data.personal) {
          setPersonalForm({
            first_name: data.personal.first_name || '',
            last_name: data.personal.last_name || '',
            email: data.personal.email || '',
            phone: data.personal.phone || '',
            role: data.personal.role || '',
            department: data.personal.department || '',
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    if (isSignedIn) fetchProfileData();
  }, [selectedProfileId, isSignedIn, api]);

  return (
    <div className="profile-layout">
      <aside className="profile-sidebar">
        <div className="profile-sidebar-hero">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {clerkUser?.firstName ? getInitials(`${clerkUser.firstName} ${clerkUser.lastName}`) : 'US'}
            </div>
          </div>
          <div className="profile-sidebar-name">{clerkUser?.firstName} {clerkUser?.lastName}</div>
          <div className="profile-sidebar-role">{isSuperAdmin ? 'Super Administrador' : 'Coordinador'}</div>
        </div>

        <nav className="profile-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            if (item.id === 'access' && !isSuperAdmin) return null;
            return (
              <button key={item.id} className={`profile-nav-item ${activeSection === item.id ? 'active' : ''}`} onClick={() => setActiveSection(item.id)}>
                <item.icon /> {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="profile-main">
        {activeSection === 'personal' && (
          <div className="profile-panel">
            <div className="profile-panel-header">
              <h2>Información Personal</h2>
              <p>Gestiona tus datos básicos de perfil.</p>
            </div>
            <div className="profile-panel-body">
              <div className="profile-form-grid">
                <div className="profile-field"><label>Nombre</label><input className="url-input" value={personalForm.first_name} onChange={(e) => setPersonalForm({...personalForm, first_name: e.target.value})} /></div>
                <div className="profile-field"><label>Apellido</label><input className="url-input" value={personalForm.last_name} onChange={(e) => setPersonalForm({...personalForm, last_name: e.target.value})} /></div>
                <div className="profile-field full-width"><label>Email</label><input className="url-input" type="email" value={personalForm.email} onChange={(e) => setPersonalForm({...personalForm, email: e.target.value})} /></div>
              </div>
            </div>
            <div className="profile-panel-footer">
              <button className="url-btn url-btn-primary" onClick={handleSavePersonal}>Guardar cambios</button>
            </div>
          </div>
        )}

        {activeSection === 'access' && isSuperAdmin && (
          <div className="profile-panel">
            <div className="profile-panel-header">
              <h2>Gestión de Acceso y Coordinadores</h2>
              <p>Administra las solicitudes y el directorio institucional.</p>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--url-border-soft)' }}>
              {['pending', 'approved', 'rejected', 'directory'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedAccessTab(tab)}
                  style={{
                    flex: 1, padding: '16px', border: 'none', cursor: 'pointer',
                    background: selectedAccessTab === tab ? 'var(--url-surface)' : 'transparent',
                    borderBottom: selectedAccessTab === tab ? '2px solid var(--url-navy)' : 'none',
                    fontWeight: selectedAccessTab === tab ? '600' : '400',
                    color: selectedAccessTab === tab ? 'var(--url-navy)' : 'var(--url-text-muted)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab === 'pending' && `Pendientes (${accessStats.pending})`}
                  {tab === 'approved' && `Aprobadas (${accessStats.approved})`}
                  {tab === 'rejected' && `Rechazadas (${accessStats.rejected})`}
                  {tab === 'directory' && `Directorio`}
                </button>
              ))}
            </div>

            <div className="profile-panel-body">
              {selectedAccessTab === 'directory' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {coordinators.map(c => (
                    <div key={c.coordinator_id} style={{ padding: '16px', border: '1px solid var(--url-border-soft)', borderRadius: 'var(--url-radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--url-surface)' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--url-navy)' }}>{c.first_name} {c.last_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--url-text-muted)', marginTop: '4px' }}>{c.email} | {c.code || 'Sin código'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                         <button onClick={() => toggleCoordStatus(c.coordinator_id)} className={`url-btn url-btn-sm ${c.status === 'active' ? 'url-btn-primary' : 'url-btn-outline'}`}>
                            {c.status === 'active' ? 'Activo' : 'Inactivo'}
                         </button>
                         <button onClick={() => deleteCoordinator(c.coordinator_id)} className="url-btn url-btn-sm" style={{ color: 'var(--url-danger)', borderColor: 'var(--url-danger-bd)', background: 'var(--url-danger-bg)' }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {accessRequests.map(req => (
                    <div key={req.request_id} style={{ padding: '16px', border: '1px solid var(--url-border-soft)', borderRadius: 'var(--url-radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--url-surface)' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--url-navy)' }}>{req.email}</div>
                        <div style={{ fontSize: '12px', color: 'var(--url-text-muted)', marginTop: '4px' }}>Solicitado: {new Date(req.created_at).toLocaleDateString()}</div>
                      </div>
                      {selectedAccessTab === 'pending' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => handleApproveAccess(req.request_id)} className="url-btn url-btn-primary url-btn-sm">Aprobar</button>
                          <button onClick={() => handleRejectAccess(req.request_id)} className="url-btn url-btn-sm url-btn-outline">Rechazar</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showToast && <div className="profile-toast">{toastMsg}</div>}
    </div>
  );
}
