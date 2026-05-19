'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import './profile.css';

const NAV_ITEMS = [
  { id: 'personal', label: 'Identidad Digital', icon: 'ID' },
  { id: 'access_control', label: 'Control de Acceso', icon: 'Lock', adminOnly: true },
];

export default function ProfilePage() {
  const { user: clerkUser } = useAuth() as any;
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [vaultData, setVaultData] = useState<any>(null);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/access-vault/identity/`, {
          headers: { 'X-Clerk-ID': clerkUser?.id || '' }
        });
        if (res.ok) setVaultData(await res.json());
      } catch (e) { console.error(e); }
    };
    if (clerkUser?.id) fetchData();
  }, [clerkUser?.id]);

  useEffect(() => {
    if (activeSection === 'access_control') fetchAccessRequests();
  }, [activeSection, activeTab]);

  const fetchAccessRequests = async () => {
    const flow = activeTab === 'pending' ? 'WAITING' : activeTab === 'rejected' ? 'DENIED' : 'APPROVED';
    const endpoint = activeTab === 'active' 
      ? `${API_URL}/access-vault/gatekeeper/active-vault-users/`
      : `${API_URL}/access-vault/gatekeeper/?flow=${flow}`;
    
    try {
      const res = await fetch(endpoint);
      if (res.ok) setAccessRequests(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleAction = async (id: number, action: string, role?: string) => {
    try {
      const res = await fetch(`${API_URL}/access-vault/gatekeeper/${id}/${action}/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Vault-ID': vaultData?.identity?.vault_id?.toString() || ''
        },
        body: JSON.stringify({ assigned_role: role })
      });
      if (res.ok) {
        toast('Operación exitosa');
        fetchAccessRequests();
      }
    } catch (e) { toast('Error en el servidor'); }
  };

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isAdmin = vaultData?.identity?.access_level === 'GATEKEEPER_ADMIN';

  return (
    <div className="url-page-bg flex-1">
      {showToast && <div className="profile-toast">{toastMsg}</div>}
      <main className="url-container url-page-main">
        <header style={{ marginBottom: '32px' }}>
          <button onClick={() => router.push('/settings')} className="url-back-btn">← Configuración</button>
          <h1 className="url-page-title">Mi Bóveda de Identidad</h1>
          <p className="url-page-sub">Gestione su perfil digital y permisos de acceso al sistema Polaris.</p>
        </header>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar-hero">
              <div className="profile-avatar">{vaultData?.identity?.full_identity_name?.[0] || 'U'}</div>
              <p className="profile-sidebar-name">{vaultData?.identity?.full_identity_name || 'Cargando...'}</p>
              <p className="profile-sidebar-role">{vaultData?.identity?.access_level}</p>
            </div>
            <nav className="profile-sidebar-nav">
              {NAV_ITEMS.filter(i => !i.adminOnly || isAdmin).map(item => (
                <button 
                  key={item.id} 
                  className={`profile-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="profile-main">
            {activeSection === 'personal' && (
              <div className="profile-panel">
                <div className="profile-panel-header"><h2>Información Personal</h2></div>
                <div className="profile-panel-body">
                  <div className="profile-form-grid">
                    <div className="profile-field full-width">
                      <label>Nombre Completo (Sincronizado con Clerk)</label>
                      <input className="url-input" value={vaultData?.identity?.full_identity_name || ''} disabled />
                    </div>
                    <div className="profile-field full-width">
                      <label>Correo Electrónico</label>
                      <input className="url-input" value={vaultData?.identity?.email || ''} disabled />
                    </div>
                    <div className="profile-field">
                      <label>Teléfono de Contacto</label>
                      <input className="url-input" value={vaultData?.profile?.contact_phone || ''} readOnly />
                    </div>
                    <div className="profile-field">
                      <label>Unidad Organizativa</label>
                      <input className="url-input" value={vaultData?.profile?.org_unit || ''} readOnly />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'access_control' && isAdmin && (
              <div className="profile-panel">
                <div className="profile-panel-header">
                  <div className="access-tabs">
                    <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>Solicitudes</button>
                    <button className={activeTab === 'rejected' ? 'active' : ''} onClick={() => setActiveTab('rejected')}>Rechazadas</button>
                    <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Cuentas Activas</button>
                  </div>
                </div>
                <div className="profile-panel-body">
                  <table className="url-table">
                    <thead>
                      <tr>
                        <th>Identidad</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessRequests.map((req: any) => (
                        <tr key={req.vault_id}>
                          <td>{req.full_identity_name}</td>
                          <td>{req.email}</td>
                          <td>{req.access_level}</td>
                          <td>
                            {activeTab === 'pending' && (
                              <div className="action-btns">
                                <button className="url-btn-sm url-btn-primary" onClick={() => handleAction(req.vault_id, 'grant-entry', 'STAFF_COORDINATOR')}>Aceptar</button>
                                <button className="url-btn-sm url-btn-danger" onClick={() => handleAction(req.vault_id, 'deny-entry')}>Rechazar</button>
                              </div>
                            )}
                            {activeTab === 'rejected' && (
                              <button className="url-btn-sm url-btn-secondary" onClick={() => handleAction(req.vault_id, 're-evaluate')}>Reactivar</button>
                            )}
                            {activeTab === 'active' && <span>Activo</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
