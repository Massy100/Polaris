'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import './audit.css';

type ActionType = 'create' | 'update' | 'delete' | 'restore' | 'login';

interface AuditLog {
  id: number;
  action: ActionType;
  title: string;
  detail: string;
  user: string;
  timestamp: string;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  initials: string;
  active: boolean;
}

const MOCK_LOGS: AuditLog[] = [
  { id: 1,  action: 'create',  title: 'Pensum cargado',              detail: 'Se importaron 120 asignaturas del ciclo 2025-I',   user: 'Admin Institucional', timestamp: 'Hace 2 h' },
  { id: 2,  action: 'update',  title: 'Parámetros de evaluación',    detail: 'Peso "Encuesta estudiantil" modificado a 35 %',    user: 'Admin Institucional', timestamp: 'Hace 5 h' },
  { id: 3,  action: 'login',   title: 'Inicio de sesión',            detail: 'Acceso desde Guatemala City, GT',                  user: 'Admin Institucional', timestamp: 'Ayer, 14:22' },
  { id: 4,  action: 'delete',  title: 'Docente eliminado',           detail: 'Registro de Carlos Morales removido del sistema',  user: 'Admin Institucional', timestamp: 'Ayer, 11:05' },
  { id: 5,  action: 'update',  title: 'Alerta de desempeño',         detail: 'Umbral crítico actualizado a 55 puntos',           user: 'Admin Institucional', timestamp: '15 abr, 09:30' },
  { id: 6,  action: 'create',  title: 'Ciclo académico creado',      detail: '2025-II habilitado con 18 semanas',                user: 'Admin Institucional', timestamp: '10 abr, 08:00' },
  { id: 7,  action: 'restore', title: 'Pensum restablecido',         detail: 'Base de datos de estructura académica reseteada',  user: 'Admin Institucional', timestamp: '08 abr, 16:45' },
  { id: 8,  action: 'update',  title: 'Perfil actualizado',          detail: 'Correo electrónico modificado',                   user: 'Admin Institucional', timestamp: '02 abr, 12:10' },
  { id: 9,  action: 'create',  title: 'Nuevo administrador',         detail: 'María López agregada con rol Editor',             user: 'Admin Institucional', timestamp: '28 mar, 10:00' },
  { id: 10, action: 'delete',  title: 'Ciclo eliminado',             detail: '2024-II eliminado por error de configuración',    user: 'Admin Institucional', timestamp: '20 mar, 17:30' },
  { id: 11, action: 'login',   title: 'Inicio de sesión',            detail: 'Acceso desde Guatemala City, GT',                  user: 'María López',         timestamp: '18 mar, 09:14' },
  { id: 12, action: 'update',  title: 'Parámetros de evaluación',    detail: 'Peso "Publicaciones" ajustado a 10 %',            user: 'María López',         timestamp: '15 mar, 15:00' },
];

const MOCK_TEAM: TeamMember[] = [
  { id: 1, name: 'Admin Institucional', email: 'admin@polaris.edu.gt',  role: 'Superadmin', initials: 'AI', active: true },
  { id: 2, name: 'María López',          email: 'mlopez@polaris.edu.gt', role: 'Editor',     initials: 'ML', active: true },
  { id: 3, name: 'Juan Pérez',           email: 'jperez@polaris.edu.gt', role: 'Viewer',     initials: 'JP', active: false },
];

const PAGE_SIZE = 8;

const ACTION_META: Record<ActionType, { label: string; iconClass: string; icon: JSX.Element }> = {
  create: {
    label: 'Creación', iconClass: 'audit-log-icon--create',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  },
  update: {
    label: 'Edición', iconClass: 'audit-log-icon--update',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  delete: {
    label: 'Eliminación', iconClass: 'audit-log-icon--delete',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  },
  restore: {
    label: 'Restauración', iconClass: 'audit-log-icon--restore',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>,
  },
  login: {
    label: 'Acceso', iconClass: 'audit-log-icon--login',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  },
};

const ROLE_BADGE: Record<string, string> = {
  Superadmin: 'url-badge-navy',
  Editor:     'url-badge-gold',
  Viewer:     'url-badge-muted',
};

export default function AuditPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg]   = useState('');
  const [team, setTeam]           = useState<TeamMember[]>(MOCK_TEAM);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole]   = useState('Viewer');

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filtered = useMemo(() => {
    return MOCK_LOGS.filter((l) => {
      const matchSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.detail.toLowerCase().includes(search.toLowerCase()) ||
        l.user.toLowerCase().includes(search.toLowerCase());
      const matchAction = filterAction === 'all' || l.action === filterAction;
      return matchSearch && matchAction;
    });
  }, [search, filterAction]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return;
    const initials = newMemberEmail.slice(0, 2).toUpperCase();
    setTeam((t) => [
      ...t,
      { id: Date.now(), name: newMemberEmail, email: newMemberEmail, role: newMemberRole, initials, active: true },
    ]);
    setNewMemberEmail('');
    toast('Invitación enviada al correo registrado');
  };

  const handleToggleActive = (id: number) => {
    setTeam((t) => t.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  };

  const counts = {
    total:   MOCK_LOGS.length,
    creates: MOCK_LOGS.filter((l) => l.action === 'create').length,
    edits:   MOCK_LOGS.filter((l) => l.action === 'update').length,
    deletes: MOCK_LOGS.filter((l) => l.action === 'delete').length,
  };

  return (
    <div className="url-page-bg flex-1">
      {showToast && (
        <div className="audit-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toastMsg}
        </div>
      )}

      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <header className="settings-header" style={{ marginBottom: '28px' }}>
          <button onClick={() => router.push('/settings')} className="settings-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Configuración
          </button>
          <h1 className="url-title" style={{ fontSize: '28px', marginBottom: '4px' }}>Auditoría y Equipo</h1>
          <p className="settings-subtitle">Historial completo de cambios y gestión de permisos de administrador.</p>
        </header>

        <div className="audit-stats">
          {[
            { label: 'Eventos totales',  value: counts.total,   iconClass: 'url-icon-chip--navy',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { label: 'Creaciones',       value: counts.creates, iconClass: 'url-icon-chip--success', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
            { label: 'Ediciones',        value: counts.edits,   iconClass: 'url-icon-chip--navy',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
            { label: 'Eliminaciones',    value: counts.deletes, iconClass: 'url-icon-chip--danger',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg> },
          ].map(({ label, value, iconClass, icon }) => (
            <div key={label} className="audit-stat-card">
              <div className={`url-icon-chip ${iconClass}`}>{icon}</div>
              <div>
                <div className="url-stat-label">{label}</div>
                <div className="url-stat-value">{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="audit-layout">
          <div className="audit-panel">
            <div className="audit-panel-header">
              <div className="audit-panel-title">
                <div className="url-icon-chip url-icon-chip--navy">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <div>
                  <h2>Historial de Cambios</h2>
                  <p>Registro de todas las operaciones realizadas en el sistema.</p>
                </div>
              </div>
              <button
                className="url-btn url-btn-ghost url-btn-sm"
                onClick={() => { toast('Exportando registros…'); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exportar
              </button>
            </div>

            <div className="audit-filters">
              <div className="audit-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  placeholder="Buscar evento, usuario…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <select
                className="audit-filter-select"
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              >
                <option value="all">Todos los tipos</option>
                <option value="create">Creación</option>
                <option value="update">Edición</option>
                <option value="delete">Eliminación</option>
                <option value="restore">Restauración</option>
                <option value="login">Acceso</option>
              </select>
            </div>

            <div className="audit-table-wrap">
              {paginated.length === 0 ? (
                <div className="url-empty" style={{ padding: '40px 24px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <h3>Sin resultados</h3>
                  <p>Intenta con otros términos o ajusta los filtros.</p>
                </div>
              ) : (
                paginated.map((log) => {
                  const meta = ACTION_META[log.action];
                  return (
                    <div key={log.id} className="audit-log-row">
                      <div className={`audit-log-icon ${meta.iconClass}`}>{meta.icon}</div>
                      <div className="audit-log-body">
                        <h4>{log.title}</h4>
                        <p>{log.detail}</p>
                      </div>
                      <span className="audit-log-user">{log.user}</span>
                      <span className="audit-log-time">{log.timestamp}</span>
                    </div>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="audit-pagination">
                <span className="audit-pagination-info">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} eventos
                </span>
                <div className="audit-pagination-btns">
                  <button
                    className="audit-pagination-btn"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`audit-pagination-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="audit-pagination-btn"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="audit-panel audit-team-panel">
              <div className="audit-panel-header">
                <div className="audit-panel-title">
                  <div className="url-icon-chip url-icon-chip--navy">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h2>Equipo Admin</h2>
                    <p>{team.filter((m) => m.active).length} miembros activos</p>
                  </div>
                </div>
              </div>

              <div className="audit-team-list">
                {team.map((member) => (
                  <div key={member.id} className="audit-team-member">
                    <div
                      className="audit-member-avatar"
                      style={{ opacity: member.active ? 1 : 0.45, background: member.active ? undefined : 'var(--url-border)' }}
                    >
                      {member.initials}
                    </div>
                    <div className="audit-member-info">
                      <h4 style={{ opacity: member.active ? 1 : 0.55 }}>{member.name}</h4>
                      <p>{member.email}</p>
                    </div>
                    <div className="audit-member-actions">
                      <span className={`url-badge ${ROLE_BADGE[member.role] ?? 'url-badge-muted'}`} style={{ fontSize: '11px' }}>
                        {member.role}
                      </span>
                      {member.role !== 'Superadmin' && (
                        <button
                          className="url-btn url-btn-ghost url-btn-sm"
                          style={{ padding: '5px 9px', fontSize: '11.5px' }}
                          onClick={() => handleToggleActive(member.id)}
                          title={member.active ? 'Desactivar' : 'Activar'}
                        >
                          {member.active ? 'Desact.' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="audit-add-form">
                <h3>Invitar miembro</h3>
                <div className="audit-add-row">
                  <input
                    placeholder="correo@institución.edu"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  />
                  <select
                    className="audit-filter-select"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                  >
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <button className="url-btn url-btn-primary url-btn-sm" onClick={handleAddMember}>
                  Enviar invitación
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}