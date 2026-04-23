'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Plus, Trash2, Edit3, Info, AlertTriangle, RotateCcw, Filter, Check } from 'lucide-react';
import SidebarDropDown from '../components/sidebar-drop-down';
import Modal from '../components/modal';
import Pagination from '../components/pagination';
import AdminDashboardPanel from '../components/admin-dashboard-panel';
import './coord-management.css';

type Coordinador = {
    coordinator_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    code?: string;
    department?: string;
    phone?: string;
    role?: string;
    since?: string | null;
    status: string;
    created_at?: string;
    updated_at?: string;
    user_id?: number;
    temp_password?: string;
};

const API_URL = 'http://localhost:8000/api/accounts';

export default function CoordManagementPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const [coordinadores, setCoordinadores] = useState<Coordinador[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Estado para el dropdown de filtro
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

        // Cerrar filtro al hacer clic fuera
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
            if (!response.ok) throw new Error(`Error ${response.status}`);
            const data = await response.json();
            
            const transformedData = data.map((item: any) => ({
                coordinator_id: item.coordinator_id,
                first_name: item.first_name || '',
                last_name: item.last_name || '',
                status: item.status || 'inactive',
                code: item.code || '',
                phone: item.phone || '',
                department: item.department || '',
                role: item.role || '',
                email: item.email || '',
                user_id: item.user_id,
                created_at: item.created_at,
                updated_at: item.updated_at
            }));
            setCoordinadores(transformedData);
        } catch (err: any) {
            setError(`Error al cargar coordinadores: ${err.message}`);
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
            coordinator_id: coord.coordinator_id,
            first_name: coord.first_name,
            last_name: coord.last_name,
            username: '',
            email: coord.email || '',
            code: coord.code || '',
            department: coord.department || '',
            phone: coord.phone || '',
            role: coord.role || '',
            status: coord.status
        });
        setOpen(true);
    };

    const handleViewDetails = (coord: Coordinador) => {
        setViewMode(true);
        setIsEditing(false);
        setDraft({
            first_name: coord.first_name,
            last_name: coord.last_name,
            username: '',
            email: coord.email || '',
            code: coord.code || '',
            department: coord.department || '',
            phone: coord.phone || '',
            role: coord.role || '',
            status: coord.status,
            created_at: coord.created_at,
            updated_at: coord.updated_at
        });
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedCoord) {
                const response = await fetch(`${API_URL}/coordinators/${selectedCoord.coordinator_id}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first_name: draft.first_name,
                        last_name: draft.last_name,
                        email: draft.email,
                        code: draft.code,
                        phone: draft.phone,
                        department: draft.department,
                        role: draft.role,
                    }),
                });
                if (!response.ok) throw new Error('Error al actualizar');
                await loadCoordinadores();
                alert('Actualizado exitosamente');
            } else {
                if (!draft.password) { alert('Ingrese contraseña temporal'); return; }
                const response = await fetch(`${API_URL}/coordinators/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(draft),
                });
                if (!response.ok) throw new Error('Error al crear');
                await loadCoordinadores();
                alert(`Creado exitosamente.`);
            }
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
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Error al eliminar');
            await loadCoordinadores();
            setConfirmOpen(false);
            alert('Desactivado exitosamente');
        } catch (err) {
            alert('Error al eliminar');
        }
    };

    const handleResetPassword = async () => {
        if (!selectedCoord) return;
        try {
            const response = await fetch(`${API_URL}/coordinators/${selectedCoord.coordinator_id}/reset-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
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
        <div className="flex min-h-screen bg-gray-50">
            <AdminDashboardPanel 
                userName="Admin Usuario"
                activePath={pathname}
                onNavigate={(path) => router.push(path)}
                onLogout={() => router.push('/')}
            />

            <div className='container-management-general flex-1'>
                <div className='user-management-container'>
                    <div className='user-management-header flex justify-between items-center'>
                        <div className="title-management">
                            <h1>Gestión de Coordinadores</h1>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="relative" ref={filterRef}>
                                <button 
                                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
                                >
                                    <Filter size={16} className={includeInactive ? "text-blue-600" : "text-gray-500"} />
                                    Filtros
                                </button>

                                {filterMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
                                        <div className="p-2 border-b border-gray-100 bg-gray-50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase px-2">Estado</span>
                                        </div>
                                        <button 
                                            onClick={() => { setIncludeInactive(false); setFilterMenuOpen(false); }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                                        >
                                            Solo Activos
                                            {!includeInactive && <Check size={14} className="text-blue-600" />}
                                        </button>
                                        <button 
                                            onClick={() => { setIncludeInactive(true); setFilterMenuOpen(false); }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                                        >
                                            Mostrar Todos
                                            {includeInactive && <Check size={14} className="text-blue-600" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button className="add-button-management" onClick={handleOpenAdd}>
                                <Plus size={20} /> Añadir Coordinador
                            </button>
                        </div>
                    </div>

                    <div className='user-management-content'>
                        <div className='search-management-section-wrapper'>
                            <div className='search-section-management'>
                                <Search size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nombre..." 
                                    className='search-management-input'
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-10"><div className="spinner"></div><p>Cargando...</p></div>
                        ) : (
                            <div className='user-management-table'>
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left pl-6">Nombre Completo</th>
                                            <th className="text-center">Código</th>
                                            <th className="text-center">Estado</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCoords.map((c) => (
                                            <tr key={c.coordinator_id} className={c.status === 'inactive' ? 'opacity-60 bg-gray-50/50' : ''}>
                                                <td className="text-left pl-6 font-medium">
                                                    {c.first_name} {c.last_name}
                                                    {c.status === 'inactive' && <span className="ml-2 text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">Inactivo</span>}
                                                </td>
                                                <td className="text-center">{c.code || '-'}</td>
                                                <td className="text-center">
                                                    <button 
                                                        className={`status-toggle-btn ${c.status === 'active' ? 'status-active-btn' : 'status-inactive-btn'}`}
                                                        onClick={() => toggleStatus(c)}
                                                    >
                                                        {c.status === 'active' ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                </td>
                                                <td className="text-center">
                                                    <div className="action-buttons-table justify-center">
                                                        <button className="action-btn-circle" title="Info" onClick={() => handleViewDetails(c)}><Info size={18}/></button>
                                                        <button className="action-btn-circle" title="Editar" onClick={() => handleOpenEdit(c)}><Edit3 size={18}/></button>
                                                        <button className="action-btn-circle delete" title="Eliminar" onClick={() => { setSelectedCoord(c); setConfirmOpen(true); }}><Trash2 size={18}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {totalItems > 0 && (
                            <Pagination 
                                page={page} 
                                pageSize={pageSize} 
                                totalItems={totalItems} 
                                onPageChange={setPage} 
                                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} 
                            />
                        )}
                    </div>
                </div>
            </div>

            <SidebarDropDown open={open} onClose={() => setOpen(false)} title={viewMode ? "Detalles" : isEditing ? "Editar" : "Nuevo Coordinador"} width={550}>
                {viewMode ? (
                    <div className="details-grid p-4">
                        <div className="detail-item"><span className="detail-label">Nombre</span><span className="detail-value">{draft.first_name} {draft.last_name}</span></div>
                        <div className="detail-item"><span className="detail-label">Código</span><span className="detail-value">{draft.code || '-'}</span></div>
                        <div className="detail-item"><span className="detail-label">Departamento</span><span className="detail-value">{draft.department || '-'}</span></div>
                        <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{draft.email || '-'}</span></div>
                        <button onClick={() => setOpen(false)} className="btn-modal-secondary w-full mt-5">Cerrar</button>
                    </div>
                ) : (
                    <form className="sdd-form-container px-6 py-4" onSubmit={handleSubmit}>
                        <div className="mb-8">
                            <h3 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs tracking-wider">Datos Personales</h3>
                            <div className="sdd-form-grid">
                                <div className="sdd-field-group">
                                    <label className="sdd-label">Nombre *</label>
                                    <input type="text" className="sdd-input-underline" value={draft.first_name || ''} onChange={(e) => setDraft({...draft, first_name: e.target.value})} required />
                                </div>
                                <div className="sdd-field-group">
                                    <label className="sdd-label">Apellido *</label>
                                    <input type="text" className="sdd-input-underline" value={draft.last_name || ''} onChange={(e) => setDraft({...draft, last_name: e.target.value})} required />
                                </div>
                                <div className="sdd-field-group full-width">
                                    <label className="sdd-label">Nombre de Usuario *</label>
                                    <input type="text" className="sdd-input-underline" value={draft.username || ''} onChange={(e) => setDraft({...draft, username: e.target.value})} required disabled={isEditing} />
                                </div>
                                {!isEditing && (
                                    <div className="sdd-field-group full-width">
                                        <label className="sdd-label">Contraseña Temporal *</label>
                                        <input type="text" className="sdd-input-underline" value={draft.password || ''} onChange={(e) => setDraft({...draft, password: e.target.value})} required placeholder="Asigne una clave inicial" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-blue-600 font-bold border-b pb-2 mb-4 uppercase text-xs tracking-wider">Información Académica y Contacto</h3>
                            <div className="sdd-form-grid">
                                <div className="sdd-field-group full-width">
                                    <label className="sdd-label">Correo Electrónico</label>
                                    <input type="email" className="sdd-input-underline" value={draft.email || ''} onChange={(e) => setDraft({...draft, email: e.target.value})} />
                                </div>
                                <div className="sdd-field-group">
                                    <label className="sdd-label">Código</label>
                                    <input type="text" className="sdd-input-underline" value={draft.code || ''} onChange={(e) => setDraft({...draft, code: e.target.value})} />
                                </div>
                                <div className="sdd-field-group">
                                    <label className="sdd-label">Teléfono</label>
                                    <input type="text" className="sdd-input-underline" value={draft.phone || ''} onChange={(e) => setDraft({...draft, phone: e.target.value})} />
                                </div>
                                <div className="sdd-field-group">
                                    <label className="sdd-label">Departamento</label>
                                    <input type="text" className="sdd-input-underline" value={draft.department || ''} onChange={(e) => setDraft({...draft, department: e.target.value})} />
                                </div>
                                <div className="sdd-field-group">
                                    <label className="sdd-label">Rol</label>
                                    <input type="text" className="sdd-input-underline" value={draft.role || ''} onChange={(e) => setDraft({...draft, role: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="security-box-draft mt-6">
                                <button type="button" className="btn-reset-password" onClick={handleResetPassword}>
                                    <RotateCcw size={14} /> Resetear Seguridad
                                </button>
                            </div>
                        )}
                        <div className="modal-btn-group mt-8">
                            <button type="button" onClick={() => setOpen(false)} className="btn-modal-secondary">Cancelar</button>
                            <button type="submit" className="add-button-management flex-1 justify-center">Guardar Cambios</button>
                        </div>
                    </form>
                )}
            </SidebarDropDown>

            <Modal open={confirmOpen} title="Desactivar" onClose={() => setConfirmOpen(false)} width={400}>
                <div className="text-center p-5">
                    <AlertTriangle size={40} className="mx-auto mb-4 text-orange-500" />
                    <p>¿Desactivar a <strong>{selectedCoord?.first_name}</strong>?</p>
                    <div className="modal-btn-group mt-5">
                        <button onClick={() => setConfirmOpen(false)} className="btn-modal-secondary">No, volver</button>
                        <button onClick={handleDelete} className="btn-modal-danger">Sí, desactivar</button>
                    </div>
                </div>
            </Modal>

            <Modal open={resetPasswordConfirm} title="Clave Generada" onClose={() => setResetPasswordConfirm(false)} width={400}>
                <div className="text-center p-5">
                    <p className="mb-3">Nueva clave:</p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-lg font-bold text-blue-600">{newPassword}</div>
                    <button onClick={() => setResetPasswordConfirm(false)} className="add-button-management w-full mt-4">Cerrar</button>
                </div>
            </Modal>
        </div>
    );
}