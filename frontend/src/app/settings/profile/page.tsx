'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import './profile.css';

const NAV_ITEMS = [
  { id: 'personal', label: 'Identidad Digital', icon: 'ID' },
  { id: 'access_control', label: 'Control de Acceso', icon: 'Lock', adminOnly: true },
];

const ROLE_LABELS: Record<string, string> = {
  'GATEKEEPER_ADMIN': 'Administrador',
  'STAFF_COORDINATOR': 'Coordinador',
};

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [vaultData, setVaultData] = useState<any>(null);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_identity_name: '',
    contact_phone: '',
    org_unit: '',
    identification_code: '',
    start_date: '',
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/access-vault/identity/`, {
          headers: { 'X-Clerk-ID': clerkUser?.id || '' }
        });
        if (res.ok) {
          const data = await res.json();
          setVaultData(data);
          setFormData({
            full_identity_name: data.identity?.full_identity_name || '',
            contact_phone: data.profile?.contact_phone || '',
            org_unit: data.profile?.org_unit || '',
            identification_code: data.profile?.identification_code || '',
            start_date: data.profile?.start_date || '',
          });
        }
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

  const handleUpdate = async () => {
    try {
      if (clerkUser && formData.full_identity_name !== vaultData?.identity?.full_identity_name) {
        const nameParts = formData.full_identity_name.trim().split(' ');
        const fName = nameParts[0] || '';
        const lName = nameParts.slice(1).join(' ') || '';
        
        try {
          await clerkUser.update({
            firstName: fName,
            lastName: lName
          });
          console.log(">>> VAULT: Clerk identity updated");
        } catch (clerkError) {
          console.error(">>> VAULT: Error syncing with Clerk", clerkError);
        }
      }

      const res = await fetch(`${API_URL}/access-vault/identity/`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-Clerk-ID': clerkUser?.id || ''
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast('Perfil e Identidad actualizados correctamente');
        setIsEditing(false);
        const updatedProfile = await res.json();
        
        const refreshRes = await fetch(`${API_URL}/access-vault/identity/`, {
          headers: { 'X-Clerk-ID': clerkUser?.id || '' }
        });
        if (refreshRes.ok) setVaultData(await refreshRes.json());
        
      } else {
        toast('Error al actualizar el perfil local');
      }
    } catch (e) { toast('Error en el servidor'); }
  };

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const isAdmin = vaultData?.identity?.access_level === 'GATEKEEPER_ADMIN';
  const displayRole = ROLE_LABELS[vaultData?.identity?.access_level] || vaultData?.identity?.access_level;

  return (
    <div className="url-page-bg flex-1">
      {showToast && <div className="profile-toast">{toastMsg}</div>}
      <main className="url-container url-page-main">
        <button 
          onClick={() => router.push('/settings')} 
          className="url-back-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Configuración
        </button>

        <header style={{ marginBottom: '32px' }}>
          <h1 className="url-page-title">Mi Bóveda de Identidad</h1>
          <p className="url-page-sub">Gestione su perfil digital y permisos de acceso al sistema Polaris.</p>
        </header>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar-hero">
              <div className="profile-avatar">{vaultData?.identity?.full_identity_name?.[0] || 'U'}</div>
              <p className="profile-sidebar-name">{vaultData?.identity?.full_identity_name || 'Cargando...'}</p>
              <p className="profile-sidebar-role">{displayRole}</p>
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
                <div className="profile-panel-header">
                  <div className="profile-panel-title">
                    <h2>Información Personal</h2>
                    <p>Datos sincronizados y de contacto institucional.</p>
                  </div>
                  {!isEditing ? (
                    <button className="url-btn-sm url-btn-secondary" onClick={() => setIsEditing(true)}>Editar Perfil</button>
                  ) : (
                    <div className="action-btns">
                      <button className="url-btn-sm url-btn-ghost" onClick={() => setIsEditing(false)}>Cancelar</button>
                      <button className="url-btn-sm url-btn-primary" onClick={handleUpdate}>Guardar Cambios</button>
                    </div>
                  )}
                </div>
                <div className="profile-panel-body">
                  <div className="profile-form-grid">
                    <div className="profile-field full-width">
                      <label>Nombre de Usuario / Identidad</label>
                      <input 
                        className="url-input" 
                        value={formData.full_identity_name} 
                        onChange={(e) => setFormData({...formData, full_identity_name: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Nombre que se mostrará en Polaris"
                      />
                      <span className="profile-field-hint">Este nombre se utilizará en todo el sistema Polaris.</span>
                    </div>
                    <div className="profile-field full-width">
                      <label>Correo Electrónico (Solo Lectura)</label>
                      <input className="url-input" value={vaultData?.identity?.email || ''} disabled />
                    </div>
                    <div className="profile-field">
                      <label>Teléfono de Contacto</label>
                      <input 
                        className="url-input" 
                        value={formData.contact_phone} 
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                        disabled={!isEditing}
                        placeholder="+503 ...."
                      />
                    </div>
                    <div className="profile-field">
                      <label>Unidad Organizativa</label>
                      <input 
                        className="url-input" 
                        value={formData.org_unit} 
                        onChange={(e) => setFormData({...formData, org_unit: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Ej: Facultad de Ingeniería"
                      />
                    </div>
                    <div className="profile-field">
                      <label>Código de Identificación</label>
                      <input 
                        className="url-input" 
                        value={formData.identification_code} 
                        onChange={(e) => setFormData({...formData, identification_code: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Ej: COD-12345"
                      />
                    </div>
                    <div className="profile-field">
                      <label>Fecha de Inicio</label>
                      <input 
                        type="date"
                        className="url-input" 
                        value={formData.start_date} 
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="profile-panel-footer">
                    <p className="profile-field-hint" style={{ marginRight: 'auto' }}>Asegúrese de que los datos sean correctos antes de guardar.</p>
                    <button className="url-btn-sm url-btn-ghost" onClick={() => setIsEditing(false)}>Descartar</button>
                    <button className="url-btn-sm url-btn-primary" onClick={handleUpdate}>Actualizar Información</button>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'access_control' && isAdmin && (
              <div className="profile-panel">
                <div className="profile-panel-header">
                  <div className="profile-panel-title">
                    <h2>Control de Acceso</h2>
                    <p>Gestione las solicitudes de acceso al sistema.</p>
                  </div>
                </div>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--url-border-soft)' }}>
                  <div className="access-tabs">
                    <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>Solicitudes</button>
                    <button className={activeTab === 'rejected' ? 'active' : ''} onClick={() => setActiveTab('rejected')}>Rechazadas</button>
                    <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Cuentas Activas</button>
                  </div>
                </div>
                <div className="profile-panel-body">
                  {accessRequests.length === 0 ? (
                    <div className="url-empty">
                      <h3>Sin registros</h3>
                      <p>No hay solicitudes en esta categoría.</p>
                    </div>
                  ) : (
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
                            <td>{ROLE_LABELS[req.access_level] || req.access_level}</td>
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}