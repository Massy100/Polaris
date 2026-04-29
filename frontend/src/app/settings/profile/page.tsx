'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

function getPasswordStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: '' };
  if (password.length < 6) return { level: 1, label: 'Débil' };
  if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return { level: 2, label: 'Media' };
  return { level: 3, label: 'Fuerte' };
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('personal');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
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

  const strength = getPasswordStrength(securityForm.newPassword);
  const passwordsMatch =
    securityForm.newPassword &&
    securityForm.confirmPassword &&
    securityForm.newPassword === securityForm.confirmPassword;

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadCoordinators = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/profile/list/', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const text = await res.text();
      if (!text) return;
      setCoordinators(JSON.parse(text));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadCoordinators();
  }, []);

  useEffect(() => {
    if (selectedProfileId === 'new') {
      setPersonalForm({
        first_name: '', last_name: '', email: '', phone: '', role: 'Coordinador', department: ''
      });
      setPrefs({ email_notifications: true, system_alerts: true, weekly_report: false, two_factor: false });
      setActiveSection('personal');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const endpoint = selectedProfileId === 'me' 
          ? 'http://localhost:8000/api/profile/' 
          : `http://localhost:8000/api/profile/${selectedProfileId}/`;
          
        const res = await fetch(endpoint, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) return;
        const text = await res.text();
        if (!text) return;
        
        const data = JSON.parse(text);
        
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
        if (data && data.preferences) {
          setPrefs({
            email_notifications: data.preferences.email_notifications ?? true,
            system_alerts: data.preferences.system_alerts ?? true,
            weekly_report: data.preferences.weekly_report ?? false,
            two_factor: data.preferences.two_factor ?? false,
          });
        }
        
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfileData();
  }, [selectedProfileId]);

  const handleSavePersonal = async () => {
    try {
      const isNew = selectedProfileId === 'new';
      const endpoint = isNew 
        ? 'http://localhost:8000/api/profile/create/' 
        : selectedProfileId === 'me' 
          ? 'http://localhost:8000/api/profile/personal/' 
          : `http://localhost:8000/api/profile/${selectedProfileId}/personal/`;

      const res = await fetch(endpoint, {
        method: isNew ? 'POST' : 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(personalForm),
      });

      if (res.ok) {
        const data = await res.json();
        toast(isNew ? 'Perfil creado exitosamente' : 'Información personal actualizada');
        if (isNew) {
          await loadCoordinators();
          if (data.coordinator_id) {
            setSelectedProfileId(data.coordinator_id.toString());
          }
        }
      } else {
        const errData = await res.json();
        toast(errData.error || errData.email?.[0] || 'Error al guardar la información');
      }
    } catch (error) {
      toast('Error de conexión con el servidor');
    }
  };

  const handleSavePassword = async () => {
    if (selectedProfileId === 'new') return toast('Primero debes guardar la información personal');
    if (!passwordsMatch) return;
    
    try {
      const endpoint = selectedProfileId === 'me' 
        ? 'http://localhost:8000/api/profile/change-password/' 
        : `http://localhost:8000/api/profile/${selectedProfileId}/change-password/`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: securityForm.currentPassword,
          new_password: securityForm.newPassword,
        }),
      });

      if (res.ok) {
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast('Contraseña actualizada correctamente');
      } else {
        toast('Error al actualizar contraseña. Verifica tu contraseña actual.');
      }
    } catch (error) {
      toast('Error de conexión');
    }
  };

  const handleSavePrefs = async () => {
    if (selectedProfileId === 'new') return toast('Primero debes guardar la información personal');
    
    try {
      const endpoint = selectedProfileId === 'me' 
        ? 'http://localhost:8000/api/profile/preferences/' 
        : `http://localhost:8000/api/profile/${selectedProfileId}/preferences/`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(prefs),
      });

      if (res.ok) toast('Preferencias guardadas');
      else toast('Error al guardar preferencias');
    } catch (error) {
      toast('Error de conexión');
    }
  };

  const strengthBarClass = (index: number) => {
    if (strength.level === 0) return '';
    if (strength.level === 1) return index < 1 ? 'active-weak' : '';
    if (strength.level === 2) return index < 2 ? 'active-medium' : '';
    return 'active-strong';
  };

  return (
    <div className="url-page-bg flex-1">
      {showToast && (
        <div className="profile-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toastMsg}
        </div>
      )}

      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <header className="settings-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button onClick={() => router.push('/settings')} className="settings-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Configuración
            </button>
            <h1 className="url-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Mi Perfil</h1>
            <p className="settings-subtitle">Gestiona tu información personal, credenciales y preferencias del sistema.</p>
          </div>
          
          <div className="profile-selector" style={{ minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--url-text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Seleccionar Perfil a Editar
            </label>
            <select 
              className="url-input" 
              value={selectedProfileId} 
              onChange={(e) => setSelectedProfileId(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="me">Mi Perfil (Sesión Actual)</option>
              <option value="new">+ Crear Nuevo Perfil</option>
              {coordinators.map((coord) => (
                <option key={coord.coordinator_id} value={coord.coordinator_id.toString()}>
                  {coord.first_name || ''} {coord.last_name || ''} ({coord.department || 'Sin Depto'})
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar-hero">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {getInitials(selectedProfileId === 'new' ? 'Nuevo Perfil' : `${personalForm.first_name || ''} ${personalForm.last_name || ''}`)}
                </div>
                <button className="profile-avatar-edit" title="Cambiar foto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
              <p className="profile-sidebar-name">
                {selectedProfileId === 'new' ? 'Nuevo Coordinador' : `${personalForm.first_name || ''} ${personalForm.last_name || ''}`}
              </p>
              <p className="profile-sidebar-role">{personalForm.role || 'Rol no asignado'} · {personalForm.department || 'Sin departamento'}</p>
            </div>

            <nav className="profile-sidebar-nav">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`profile-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <item.icon />
                  {item.label}
                </button>
              ))}
              <div className="profile-nav-divider" />
              <button
                className="profile-nav-item"
                onClick={() => router.push('/settings')}
                style={{ color: 'var(--url-text-faint)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Cerrar sesión
              </button>
            </nav>
          </aside>

          <div className="profile-main">
            {activeSection === 'personal' && (
              <div className="profile-panel">
                <div className="profile-panel-header">
                  <div className="profile-panel-title">
                    <div className="url-icon-chip url-icon-chip--navy">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <h2>{selectedProfileId === 'new' ? 'Crear Nuevo Perfil' : 'Información Personal'}</h2>
                      <p>Datos que aparecen en reportes y notificaciones del sistema.</p>
                    </div>
                  </div>
                  <span className="url-badge url-badge-navy">{personalForm.role || 'Usuario'}</span>
                </div>

                <div className="profile-panel-body">
                  <div className="profile-form-grid">
                    <div className="profile-field">
                      <label>Nombre</label>
                      <input
                        className="url-input"
                        value={personalForm.first_name || ''}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, first_name: e.target.value }))}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Apellido</label>
                      <input
                        className="url-input"
                        value={personalForm.last_name || ''}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, last_name: e.target.value }))}
                      />
                    </div>
                    <div className="profile-field full-width">
                      <label>Correo electrónico (Obligatorio)</label>
                      <input
                        className="url-input"
                        type="email"
                        value={personalForm.email || ''}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, email: e.target.value }))}
                      />
                      <span className="profile-field-hint">
                        {selectedProfileId === 'new' 
                          ? 'Se generará una cuenta con contraseña temporal: PolarisPassword123!' 
                          : 'Se usará para notificaciones y recuperación de cuenta.'}
                      </span>
                    </div>
                    <div className="profile-field">
                      <label>Teléfono</label>
                      <input
                        className="url-input"
                        placeholder="+502 0000-0000"
                        value={personalForm.phone || ''}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div className="profile-field">
                      <label>Departamento</label>
                      <input
                        className="url-input"
                        value={personalForm.department || ''}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, department: e.target.value }))}
                      />
                    </div>
                    <div className="profile-field full-width">
                      <label>Rol en el sistema</label>
                      <input
                        className="url-input"
                        value={personalForm.role || ''}
                        onChange={(e) => setPersonalForm((p) => ({ ...p, role: e.target.value }))}
                        disabled={selectedProfileId !== 'new'}
                      />
                      <span className="profile-field-hint">
                        {selectedProfileId === 'new' ? 'Define el rol inicial' : 'El rol es asignado por el superadministrador.'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-panel-footer">
                  <button 
                    className="url-btn url-btn-primary url-btn-sm" 
                    onClick={handleSavePersonal}
                    disabled={selectedProfileId === 'new' && !personalForm.email}
                  >
                    {selectedProfileId === 'new' ? 'Crear Perfil' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <>
                <div className="profile-panel">
                  <div className="profile-panel-header">
                    <div className="profile-panel-title">
                      <div className="url-icon-chip url-icon-chip--navy">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <div>
                        <h2>Cambiar Contraseña</h2>
                        <p>Se recomienda usar al menos 10 caracteres con mayúsculas y números.</p>
                      </div>
                    </div>
                  </div>

                  <div className="profile-panel-body">
                    {selectedProfileId === 'new' ? (
                      <p style={{ fontSize: '13.5px', color: 'var(--url-text-muted)', textAlign: 'center', padding: '20px' }}>
                        Debes guardar la información personal para crear el perfil antes de configurar la contraseña.
                      </p>
                    ) : (
                      <div className="profile-form-grid">
                        <div className="profile-field full-width">
                          <label>Contraseña actual</label>
                          <input
                            className="url-input"
                            type="password"
                            placeholder="••••••••"
                            value={securityForm.currentPassword || ''}
                            onChange={(e) => setSecurityForm((s) => ({ ...s, currentPassword: e.target.value }))}
                          />
                        </div>
                        <div className="profile-field">
                          <label>Nueva contraseña</label>
                          <input
                            className="url-input"
                            type="password"
                            placeholder="••••••••"
                            value={securityForm.newPassword || ''}
                            onChange={(e) => setSecurityForm((s) => ({ ...s, newPassword: e.target.value }))}
                          />
                          {securityForm.newPassword && (
                            <>
                              <div className="profile-password-strength">
                                {[0, 1, 2].map((i) => (
                                  <div key={i} className={`profile-strength-bar ${strengthBarClass(i)}`} />
                                ))}
                              </div>
                              <span className="profile-strength-label">{strength.label}</span>
                            </>
                          )}
                        </div>
                        <div className="profile-field">
                          <label>Confirmar nueva contraseña</label>
                          <input
                            className="url-input"
                            type="password"
                            placeholder="••••••••"
                            value={securityForm.confirmPassword || ''}
                            onChange={(e) => setSecurityForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                            style={
                              securityForm.confirmPassword && !passwordsMatch
                                ? { borderColor: 'var(--url-danger)' }
                                : {}
                            }
                          />
                          {securityForm.confirmPassword && !passwordsMatch && (
                            <span className="profile-field-hint" style={{ color: 'var(--url-danger)' }}>
                              Las contraseñas no coinciden.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="profile-panel-footer">
                    <button
                      className="url-btn url-btn-primary url-btn-sm"
                      onClick={handleSavePassword}
                      disabled={selectedProfileId === 'new' || !passwordsMatch || !securityForm.currentPassword}
                      style={{ opacity: (selectedProfileId === 'new' || !passwordsMatch || !securityForm.currentPassword) ? 0.5 : 1 }}
                    >
                      Actualizar contraseña
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'preferences' && (
              <div className="profile-panel">
                <div className="profile-panel-header">
                  <div className="profile-panel-title">
                    <div className="url-icon-chip url-icon-chip--navy">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                      </svg>
                    </div>
                    <div>
                      <h2>Preferencias del Sistema</h2>
                      <p>Controla las notificaciones y opciones de seguridad de tu cuenta.</p>
                    </div>
                  </div>
                </div>

                <div className="profile-panel-body">
                  {selectedProfileId === 'new' ? (
                    <p style={{ fontSize: '13.5px', color: 'var(--url-text-muted)', textAlign: 'center', padding: '20px' }}>
                      Crea el perfil primero para configurar sus preferencias del sistema.
                    </p>
                  ) : (
                    [
                      { key: 'email_notifications', label: 'Notificaciones por correo', desc: 'Recibe alertas de actividad relevante en tu bandeja de entrada.' },
                      { key: 'system_alerts', label: 'Alertas del sistema', desc: 'Alertas dentro de Polaris sobre cambios en rankings y evaluaciones.' },
                      { key: 'weekly_report', label: 'Reporte semanal', desc: 'Resumen automático cada lunes con las métricas del ciclo activo.' },
                      { key: 'two_factor', label: 'Autenticación de dos factores', desc: 'Añade una capa extra de seguridad al iniciar sesión.' },
                    ].map(({ key, label, desc }) => (
                      <div className="profile-toggle-row" key={key}>
                        <div className="profile-toggle-info">
                          <h4>{label}</h4>
                          <p>{desc}</p>
                        </div>
                        <label className="profile-toggle">
                          <input
                            type="checkbox"
                            checked={prefs[key as keyof typeof prefs] || false}
                            onChange={(e) => setPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                          />
                          <span className="profile-toggle-track" />
                        </label>
                      </div>
                    ))
                  )}
                </div>

                <div className="profile-panel-footer">
                  <button 
                    className="url-btn url-btn-primary url-btn-sm" 
                    onClick={handleSavePrefs}
                    disabled={selectedProfileId === 'new'}
                    style={{ opacity: selectedProfileId === 'new' ? 0.5 : 1 }}
                  >
                    Guardar preferencias
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}