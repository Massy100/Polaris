'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Filter, Check, Plus, ShieldAlert, RotateCcw, Info, User, BookOpen } from 'lucide-react';
import Modal from '../components/modal';
import Pagination from '../components/pagination';
import './coord-management.css';

type Coordinador = {
    coordinator_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    username?: string;
    code?: string;
    department?: string;
    phone?: string;
    role?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    user?: {  
        user_id: number;
        username: string;
        email: string;
        status: string;
    };
};

const API_URL = 'http://localhost:8000/api/accounts';

const IconUsersEyebrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const IconDirectoryTitle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--url-navy-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="M8 14h.01"></path>
    <path d="M12 14h.01"></path>
    <path d="M16 14h.01"></path>
    <path d="M8 18h.01"></path>
    <path d="M12 18h.01"></path>
    <path d="M16 18h.01"></path>
  </svg>
);

const IconSearch = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414 1.415l-3.85-3.85a1 1 0 010-1.415z" clipRule="evenodd"></path>
    <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" clipRule="evenodd"></path>
  </svg>
);

const IconClose = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1.3em" width="1.3em" xmlns="http://www.w3.org/2000/svg">
    <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
  </svg>
);

export default function CoordManagementPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [coordinadores, setCoordinadores] = useState<Coordinador[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [resetPasswordConfirm, setResetPasswordConfirm] = useState(false);
    const [newPassword, setNewPassword] = useState<string | null>(null);
    const [selectedCoord, setSelectedCoord] = useState<Coordinador | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<Partial<Coordinador & { username: string; password: string }>>({});

    useEffect(() => { 
        setIsMounted(true);
        loadCoordinadores();
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setFilterMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [includeInactive]);

    const loadCoordinadores = async () => {
        try {
            setLoading(true);
            setError(null);
            const url = `${API_URL}/coordinators/?include_inactive=${includeInactive}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error al cargar los coordinadores`);
            const data = await response.json();
            setCoordinadores(data);
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (coord: Coordinador) => {
        try {
            const response = await fetch(`${API_URL}/coordinators/${coord.coordinator_id}/toggle-status/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Error al cambiar estado');
            const updated = await response.json();
            setCoordinadores(prev => prev.map(c => 
                c.coordinator_id === coord.coordinator_id ? { ...c, status: updated.status } : c
            ));
        } catch (err) {
            alert('Error al cambiar estado');
        }
    };

    const filteredCoords = useMemo(() => {
        if (!searchTerm.trim()) return coordinadores;
        return coordinadores.filter(c => {
            const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
        });
    }, [coordinadores, searchTerm]);

    const paginatedCoords = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCoords.slice(start, start + pageSize);
    }, [filteredCoords, page, pageSize]);

    const totalItems = filteredCoords.length;

    const handleOpenAdd = () => {
        setIsEditing(false);
        setViewMode(false);
        setDraft({ 
            first_name: '', last_name: '', username: '', password: '',
            email: '', code: '', department: '', phone: '', role: 'Coordinador', status: 'active'
        });
        setOpen(true);
    };

    const handleOpenEdit = (coord: Coordinador) => {
        setIsEditing(true);
        setViewMode(false);
        setSelectedCoord(coord);
        setDraft({ 
            ...coord, 
            username: coord.username || '',    
            email: coord.email || '',          
            password: ''                       
        });
        setOpen(true);
    };

    const handleViewDetails = (coord: Coordinador) => {
        setViewMode(true);
        setIsEditing(false);
        setDraft({
            ...coord,
            username: coord.username || '',
            email: coord.email || ''
        });
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `${API_URL}/coordinators/${selectedCoord?.coordinator_id}/` : `${API_URL}/coordinators/`;
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draft),
            });
            if (!response.ok) throw new Error('Error en la operación');
            await loadCoordinadores();
            setOpen(false);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async () => {
        if (!selectedCoord) return;
        try {
            const response = await fetch(`${API_URL}/coordinators/${selectedCoord.coordinator_id}/`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Error al eliminar');
            await loadCoordinadores();
            setConfirmOpen(false);
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    const handleResetPassword = async () => {
        if (!selectedCoord) return;
        try {
            const response = await fetch(`${API_URL}/coordinators/${selectedCoord.coordinator_id}/reset-password/`, {
                method: 'POST',
            });
            const data = await response.json();
            setNewPassword(data.new_password);
            setResetPasswordConfirm(true);
            setOpen(false);
        } catch (err) {
            alert('Error al resetear contraseña');
        }
    };

    if (!isMounted) return null;

    return (
        <div className="cm-layout flex-1">
            {error && (
                <div className="cm-toast cm-toast--err">
                    <span>{error}</span>
                </div>
            )}

            <div className="cm-header-main">
                <div className="cm-eyebrow">
                    <IconUsersEyebrow />
                    Administración
                </div>
                <div className="cm-title-row">
                    <IconDirectoryTitle />
                    <h1>Gestión de Coordinadores</h1>
                </div>
                <div className="cm-header-actions" style={{ justifyContent: 'flex-start' }}>
                    <p className="cm-subtitle-main">
                        Administra el acceso, roles e información de los coordinadores de la institución.
                    </p>
                </div>
            </div>

            <main className="cm-main-content">
                <div className="cm-card">
                    <div className="cm-card-header">
                        <div className="cm-card-title-group">
                            <h3>Directorio Institucional</h3>
                            <p>{totalItems} {totalItems === 1 ? 'registro encontrado' : 'registros encontrados'}</p>
                        </div>
                        
                        <div className="cm-header-actions">
                            <div className="relative" ref={filterRef}>
                                <button onClick={() => setFilterMenuOpen(!filterMenuOpen)} className="cm-btn-ghost flex items-center gap-2">
                                    <Filter size={14} className={includeInactive ? "text-[var(--url-navy)]" : ""} /> Filtros
                                </button>
                                {filterMenuOpen && (
                                    <div className="cm-filter-dropdown">
                                        <div className="p-2 border-b border-gray-100 bg-[var(--url-surface)]">
                                            <span className="text-[10px] font-bold text-[var(--url-text-muted)] uppercase px-2 tracking-wider">Estado</span>
                                        </div>
                                        <button onClick={() => { setIncludeInactive(false); setFilterMenuOpen(false); }}>
                                            Solo Activos {!includeInactive && <Check size={14} className="text-[var(--url-navy)] float-right" />}
                                        </button>
                                        <button onClick={() => { setIncludeInactive(true); setFilterMenuOpen(false); }}>
                                            Mostrar Todos {includeInactive && <Check size={14} className="text-[var(--url-navy)] float-right" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="cm-search-box">
                                <IconSearch />
                                <input 
                                    type="text" 
                                    placeholder="Búsqueda por nombre..." 
                                    className="cm-search-input"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
                                {searchTerm && (
                                    <button type="button" className="cm-search-clear" onClick={() => setSearchTerm('')} title="Limpiar">
                                        <IconClose />
                                    </button>
                                )}
                            </div>

                            <button className="cm-btn-primary" onClick={handleOpenAdd}>
                                <Plus size={16} /> Añadir Coordinador
                            </button>
                        </div>
                    </div>

                    <div className="cm-table-wrap">
                        <table className="cm-table">
                            <thead>
                                <tr>
                                    <th className="cm-th">Nombre Completo</th>
                                    <th className="cm-th">Código</th>
                                    <th className="cm-th">Estado</th>
                                    <th className="cm-th text-right" style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--url-text-muted)' }}>
                                            Cargando registros...
                                        </td>
                                    </tr>
                                ) : paginatedCoords.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--url-text-muted)' }}>
                                            No hay resultados para la búsqueda
                                        </td>
                                    </tr>
                                ) : paginatedCoords.map((c) => (
                                    <tr key={c.coordinator_id} className="cm-tr">
                                        <td className="cm-td" style={{ fontWeight: 600 }}>{c.first_name} {c.last_name}</td>
                                        <td className="cm-td">{c.code || '-'}</td>
                                        <td className="cm-td">
                                            <button 
                                                className={`cm-status-pill ${c.status}`}
                                                onClick={() => toggleStatus(c)}
                                                title="Cambiar estado"
                                            >
                                                {c.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                        <td className="cm-td">
                                            <div className="cm-action-buttons">
                                                <button className="cm-btn-ghost !w-8 !h-8 !p-0 flex items-center justify-center" title="Ver Detalles" onClick={() => handleViewDetails(c)}>
                                                    <Info size={14}/>
                                                </button>
                                                <button className="cm-btn-edit" title="Modificar Registro" onClick={() => handleOpenEdit(c)}>
                                                    <div className="edit-pencil-wrapper">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="edit-pencil-icon">
                                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l8.06-8.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" />
                                                        </svg>
                                                        <svg className="edit-writing-line" viewBox="0 0 30 10">
                                                            <path d="M2 6 Q6 2 10 6 T18 6 T26 6" className="edit-writing-path" />
                                                        </svg>
                                                    </div>
                                                </button>
                                                <button className="cm-btn-delete" title="Eliminar Registro" onClick={() => { setSelectedCoord(c); setConfirmOpen(true); }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 14" className="delete-bin-icon delete-bin-top">
                                                        <g clipPath="url(#clip-bin-top)">
                                                            <path fill="currentColor" d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734Z" />
                                                        </g>
                                                        <defs><clipPath id="clip-bin-top"><rect fill="white" height="14" width="69" /></clipPath></defs>
                                                    </svg>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 57" className="delete-bin-icon delete-bin-bottom">
                                                        <g clipPath="url(#clip-bin-bottom)">
                                                            <path fill="currentColor" d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z" />
                                                        </g>
                                                        <defs><clipPath id="clip-bin-bottom"><rect fill="white" height="57" width="69" /></clipPath></defs>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="cm-card-footer">
                        {!loading && totalItems > 0 && (
                            <Pagination 
                                page={page} 
                                pageSize={pageSize} 
                                totalItems={totalItems} 
                                onPageChange={(newPage) => {
                                    const totalPages = Math.ceil(totalItems / pageSize) || 1;
                                    if (newPage < 1 || newPage > totalPages) return;
                                    setPage(newPage);
                                }} 
                                onPageSizeChange={(size) => {
                                    const safeSize = size > 0 ? size : 10;
                                    setPageSize(safeSize);
                                    setPage(1);
                                }} 
                            />
                        )}
                    </div>
                </div>
            </main>

            <Modal open={open} title={viewMode ? "Detalles del Coordinador" : isEditing ? "Actualizar Coordinador" : "Nuevo Coordinador"} onClose={() => setOpen(false)} width={viewMode ? 800 : 560}>
                {viewMode ? (
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="bg-[var(--url-surface)] p-5 rounded-lg border border-[var(--url-border-soft)]">
                                <h3 className="text-[11px] font-bold text-[var(--url-text-muted)] uppercase tracking-wider mb-4 border-b border-[var(--url-border-soft)] pb-2 flex items-center gap-2">
                                    <User size={14}/> Datos Personales
                                </h3>
                                <div className="space-y-4">
                                    <div><span className="block text-[11px] font-bold text-[var(--url-text-faint)] uppercase">Nombre Completo</span><span className="text-[13.5px] text-[var(--url-text-pri)] font-medium">{draft.first_name} {draft.last_name}</span></div>
                                    <div><span className="block text-[11px] font-bold text-[var(--url-text-faint)] uppercase">Estado</span>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${draft.status === 'active' ? 'bg-[#e6fcf5] text-[#0ca678]' : 'bg-[#fff5f5] text-[#fa5252]'}`}>
                                            {draft.status === 'active' ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[var(--url-surface)] p-5 rounded-lg border border-[var(--url-border-soft)]">
                                <h3 className="text-[11px] font-bold text-[var(--url-text-muted)] uppercase tracking-wider mb-4 border-b border-[var(--url-border-soft)] pb-2 flex items-center gap-2">
                                    <BookOpen size={14}/> Info. Académica
                                </h3>
                                <div className="space-y-4">
                                    <div><span className="block text-[11px] font-bold text-[var(--url-text-faint)] uppercase">Código</span><span className="text-[13.5px] text-[var(--url-text-pri)]">{draft.code || 'N/A'}</span></div>
                                    <div><span className="block text-[11px] font-bold text-[var(--url-text-faint)] uppercase">Departamento</span><span className="text-[13.5px] text-[var(--url-text-pri)]">{draft.department || 'N/A'}</span></div>
                                    <div><span className="block text-[11px] font-bold text-[var(--url-text-faint)] uppercase">Email</span><span className="text-[13.5px] text-[var(--url-text-pri)]">{draft.email || 'N/A'}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="cm-modal-actions">
                            <button onClick={() => setOpen(false)} className="cm-btn-primary">Cerrar Detalles</button>
                        </div>
                    </div>
                ) : (
                    <form className="cm-form px-6 py-4" onSubmit={handleSubmit}>
                        <div className="cm-form-grid">
                            <div className="cm-form-field">
                                <label className="cm-form-label">Nombres *</label>
                                <input type="text" className="cm-form-input" value={draft.first_name || ''} onChange={(e) => setDraft({...draft, first_name: e.target.value})} required />
                            </div>
                            <div className="cm-form-field">
                                <label className="cm-form-label">Apellidos *</label>
                                <input type="text" className="cm-form-input" value={draft.last_name || ''} onChange={(e) => setDraft({...draft, last_name: e.target.value})} required />
                            </div>
                            
                            <div className="cm-form-field" style={{ gridColumn: 'span 2' }}>
                                <label className="cm-form-label">Nombre de Usuario *</label>
                                <input type="text" className="cm-form-input" value={draft.username || ''} onChange={(e) => setDraft({...draft, username: e.target.value})} required disabled={isEditing} />
                            </div>

                            {isEditing && (
                                <div className="cm-form-field" style={{ gridColumn: 'span 2' }}>
                                    <label className="cm-form-label">Nombre de Usuario</label>
                                    <input 
                                        type="text" 
                                        className="cm-form-input" 
                                        value={draft.username || ''} 
                                        disabled  
                                    />
                                    <small className="text-[11px] text-[var(--url-text-muted)]">
                                        El nombre de usuario no se puede modificar
                                    </small>
                                </div>
                            )}

                            <div className="cm-form-field">
                                <label className="cm-form-label">Código</label>
                                <input type="text" className="cm-form-input" value={draft.code || ''} onChange={(e) => setDraft({...draft, code: e.target.value})} />
                            </div>
                            <div className="cm-form-field">
                                <label className="cm-form-label">Correo Institucional</label>
                                <input type="email" className="cm-form-input" value={draft.email || ''} onChange={(e) => setDraft({...draft, email: e.target.value})} />
                            </div>
                            <div className="cm-form-field">
                                <label className="cm-form-label">Departamento</label>
                                <input type="text" className="cm-form-input" value={draft.department || ''} onChange={(e) => setDraft({...draft, department: e.target.value})} />
                            </div>
                            <div className="cm-form-field">
                                <label className="cm-form-label">Rol</label>
                                <input type="text" className="cm-form-input" value={draft.role || ''} onChange={(e) => setDraft({...draft, role: e.target.value})} />
                            </div>
                        </div>

                        {isEditing && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-center justify-between mb-2 mt-4">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert size={18} className="text-red-500" />
                                    <div>
                                        <p className="text-[12px] font-bold text-red-800">Seguridad de la Cuenta</p>
                                        <p className="text-[11px] text-red-600">Restablece la contraseña si el usuario perdió acceso.</p>
                                    </div>
                                </div>
                                <button type="button" className="cm-btn-ghost !text-red-600 !border-red-200 hover:!bg-red-100 flex items-center gap-2" onClick={handleResetPassword}>
                                    <RotateCcw size={14} /> Resetear Clave
                                </button>
                            </div>
                        )}
                        <div className="cm-modal-actions mt-4">
                            <button type="button" onClick={() => setOpen(false)} className="cm-btn-ghost">Cancelar</button>
                            <button type="submit" className="cm-btn-primary">Guardar Cambios</button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal open={confirmOpen} title="Confirmar Baja de Registro" onClose={() => setConfirmOpen(false)} width={480}>
                <div className="cm-confirm-content">
                    <p className="cm-confirm-text">
                        ¿Confirma que desea dar de baja el registro del coordinador{' '}
                        <span style={{ fontWeight: 700, color: 'var(--url-navy)' }}>{selectedCoord?.first_name} {selectedCoord?.last_name}</span>?
                        Esta acción desactivará su cuenta.
                    </p>
                    {selectedCoord && (
                        <div className="cm-confirm-meta">
                            <div><strong>Código:</strong> {selectedCoord.code || 'N/A'}</div>
                            <div><strong>Correo:</strong> {selectedCoord.email || 'N/A'}</div>
                        </div>
                    )}
                    <div className="cm-modal-actions">
                        <button className="cm-btn-ghost" onClick={() => setConfirmOpen(false)}>Cancelar</button>
                        <button className="cm-btn-danger" onClick={handleDelete}>Confirmar Baja</button>
                    </div>
                </div>
            </Modal>

            <Modal open={resetPasswordConfirm} title="Clave Generada" onClose={() => setResetPasswordConfirm(false)} width={400}>
                <div className="px-6 py-6 text-center">
                    <p className="text-[13px] text-[var(--url-text-sec)] mb-3">Se ha generado una nueva contraseña temporal:</p>
                    <div className="bg-[var(--url-surface)] border border-[var(--url-border)] p-4 rounded-lg font-mono text-xl tracking-widest font-bold text-[var(--url-navy)] mb-6">
                        {newPassword}
                    </div>
                    <p className="text-[11.5px] text-[var(--url-text-muted)] mb-6">Por favor, copia esta clave y compártela de forma segura.</p>
                    <button onClick={() => setResetPasswordConfirm(false)} className="cm-btn-primary w-full">Cerrar</button>
                </div>
            </Modal>
        </div>
    );
}