'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Filter, Check, Plus, ShieldAlert, RotateCcw, Info, User, BookOpen } from 'lucide-react';
import Modal from '../components/modal';
import Pagination from '../components/pagination';
import { useApi } from '../utils/api';
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

export default function CoordManagementPage() {
    const api = useApi();
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
            const response = await api.get(`/accounts/coordinators/?include_inactive=${includeInactive}`);
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
            const response = await api.patch(`/accounts/coordinators/${coord.coordinator_id}/toggle-status/`, {});
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
            const endpoint = isEditing ? `/accounts/coordinators/${selectedCoord?.coordinator_id}/` : `/accounts/coordinators/`;
            const response = isEditing 
                ? await api.put(endpoint, draft)
                : await api.post(endpoint, draft);
            
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
            const response = await api.delete(`/accounts/coordinators/${selectedCoord.coordinator_id}/`);
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
            const response = await api.post(`/accounts/coordinators/${selectedCoord.coordinator_id}/reset-password/`, {});
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
                    Administración
                </div>
                <div className="cm-title-row">
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
                                <input 
                                    type="text" 
                                    placeholder="Búsqueda por nombre..." 
                                    className="cm-search-input"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
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
                                                    Editar
                                                </button>
                                                <button className="cm-btn-delete" title="Eliminar Registro" onClick={() => { setSelectedCoord(c); setConfirmOpen(true); }}>
                                                    Eliminar
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
