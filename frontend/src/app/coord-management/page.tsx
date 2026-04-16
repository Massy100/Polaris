'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Plus, Trash2, Edit3, Info, AlertTriangle, RotateCcw, Eye, Lock } from 'lucide-react';
import SidebarDropDown from '../components/sidebar-drop-down';
import Modal from '../components/modal';
import Pagination from '../components/pagination';
import AdminDashboardPanel from '../components/admin-dashboard-panel';
import '../styles/coord-management.css';

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
    const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const [coordinadores, setCoordinadores] = useState<Coordinador[]>([]);
    const [includeInactive, setIncludeInactive] = useState(false);

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
    }, [includeInactive]);

    const loadCoordinadores = async () => {
        try {
            setLoading(true);
            setError(null);
            const url = `${API_URL}/coordinators/?include_inactive=${includeInactive}`;
            
            console.log('Fetching desde:', url);
            
            // Fetch simple sin autenticación
            const response = await fetch(url);
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Datos recibidos:', data);
            
            if (!Array.isArray(data)) {
                console.error('La respuesta no es un array:', data);
                setCoordinadores([]);
                return;
            }
            
            // Transformar datos según la estructura que devuelve tu backend
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
            
            console.log('Datos transformados:', transformedData);
            setCoordinadores(transformedData);
            
        } catch (err: any) {
            console.error('Error detallado:', err);
            setError(`Error al cargar coordinadores: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (id: number) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleStatus = async (coord: Coordinador) => {
        try {
            const response = await fetch(`${API_URL}/coordinators/${coord.coordinator_id}/toggle-status/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Error al cambiar estado');
            }
            
            const updated = await response.json();
            setCoordinadores(prev => prev.map(c => 
                c.coordinator_id === coord.coordinator_id 
                    ? { ...c, status: updated.status }
                    : c
            ));
            alert('Estado actualizado exitosamente');
        } catch (err) {
            alert('Error al cambiar estado del coordinador');
            console.error(err);
        }
    };

    const filteredCoords = useMemo(() => {
        if (!searchTerm.trim()) return coordinadores;
        
        return coordinadores.filter(c => {
            const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
            const search = searchTerm.toLowerCase();
            return fullName.includes(search);
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
            first_name: '', 
            last_name: '', 
            username: '',
            password: '',
            email: '', 
            code: '', 
            department: '', 
            phone: '', 
            role: 'Coordinador',
            status: 'active'
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
                    headers: {
                        'Content-Type': 'application/json',
                    },
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
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al actualizar coordinador');
                }
                
                await loadCoordinadores();
                alert('Coordinador actualizado exitosamente');
            } else {
                if (!draft.password) {
                    alert('Por favor ingrese una contraseña temporal');
                    return;
                }
                
                const response = await fetch(`${API_URL}/coordinators/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        first_name: draft.first_name,
                        last_name: draft.last_name,
                        username: draft.username,
                        password: draft.password,
                        email: draft.email,
                        code: draft.code,
                        phone: draft.phone,
                        department: draft.department,
                        role: draft.role,
                    }),
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al crear coordinador');
                }
                
                const newCoord = await response.json();
                alert(`Coordinador creado exitosamente. Contraseña temporal: ${draft.password}`);
                await loadCoordinadores();
            }
            setOpen(false);
        } catch (err: any) {
            alert(err.message || 'Error al guardar coordinador');
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!selectedCoord) return;
        
        try {
            const response = await fetch(`${API_URL}/coordinators/${selectedCoord.coordinator_id}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error('Error al eliminar coordinador');
            }
            
            await loadCoordinadores();
            setConfirmOpen(false);
            alert('Coordinador desactivado exitosamente');
        } catch (err) {
            alert('Error al eliminar coordinador');
            console.error(err);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedCoord) return;
        try {
            const response = await fetch(`${API_URL}/coordinators/${selectedCoord.coordinator_id}/reset-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                throw new Error('Error al resetear contraseña');
            }
            
            const data = await response.json();
            setNewPassword(data.new_password);
            setResetPasswordConfirm(true);
            setOpen(false);
        } catch (err) {
            alert('Error al resetear contraseña');
            console.error(err);
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
                    <div className='user-management-header'>
                        <div className="title-management">
                            <h1>Gestión de Coordinadores</h1>
                        </div>
                        <div className="flex gap-3">
                            
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
                            <div className="text-center py-10">
                                <div className="spinner"></div>
                                <p>Cargando coordinadores...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 text-red-500">
                                <p>{error}</p>
                                <button onClick={loadCoordinadores} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded">
                                    Reintentar
                                </button>
                            </div>
                        ) : coordinadores.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <p>No hay coordinadores registrados</p>
                                <button onClick={handleOpenAdd} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded">
                                    Crear primer coordinador
                                </button>
                            </div>
                        ) : (
                            <div className='user-management-table'>
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-center">ID</th>
                                            <th className="text-center">Nombre Completo</th>
                                            <th className="text-center">Contraseña</th>
                                            <th className="text-center">Código</th>
                                            <th className="text-center">Estado</th>
                                            <th className="text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedCoords.map((c) => (
                                            <tr key={c.coordinator_id} className={c.status === 'inactive' ? 'opacity-60' : ''}>
                                                <td className="text-center">#{c.coordinator_id}</td>
                                                <td className="text-center">{c.first_name} {c.last_name}</td>
                                                <td className="text-center">
                                                    <div className="flex justify-center items-center py-2">
                                                        <div className="password-box">
                                                            <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
                                                                {showPasswords[c.coordinator_id] ? '********' : '••••••••'}
                                                            </span>
                                                            <button 
                                                                onClick={() => togglePasswordVisibility(c.coordinator_id)} 
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#2F73DF', padding: 0 }}
                                                            >
                                                                {showPasswords[c.coordinator_id] ? <Lock size={16}/> : <Eye size={16}/>}
                                                            </button>
                                                        </div>
                                                    </div>
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

            {/* Modal de formulario */}
            <SidebarDropDown open={open} onClose={() => setOpen(false)} title={viewMode ? "Detalles del Coordinador" : isEditing ? "Editar Coordinador" : "Nuevo Coordinador"} width={500}>
                {viewMode ? (
                    <div className="details-grid">
                        <div className="detail-item"><span className="detail-label">Nombre</span><span className="detail-value">{draft.first_name} {draft.last_name}</span></div>
                        <div className="detail-item"><span className="detail-label">Usuario</span><span className="detail-value">{draft.username}</span></div>
                        <div className="detail-item"><span className="detail-label">Código</span><span className="detail-value">{draft.code || '-'}</span></div>
                        <div className="detail-item"><span className="detail-label">Departamento</span><span className="detail-value">{draft.department || '-'}</span></div>
                        <div className="detail-item"><span className="detail-label">Teléfono</span><span className="detail-value">{draft.phone || '-'}</span></div>
                        <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{draft.email || '-'}</span></div>
                        <div className="detail-item"><span className="detail-label">Rol</span><span className="detail-value">{draft.role || '-'}</span></div>
                        <div className="detail-item"><span className="detail-label">Estado</span><span className="detail-value">{draft.status === 'active' ? 'Activo' : 'Inactivo'}</span></div>
                        <div className="detail-item"><span className="detail-label">Creado</span><span className="detail-value">{draft.created_at ? new Date(draft.created_at).toLocaleDateString() : '-'}</span></div>
                        <button onClick={() => setOpen(false)} className="btn-modal-secondary w-full mt-5">Cerrar</button>
                    </div>
                ) : (
                    <form className="sdd-form-container" onSubmit={handleSubmit}>
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
                                    <input type="text" className="sdd-input-underline" value={draft.password || ''} onChange={(e) => setDraft({...draft, password: e.target.value})} required placeholder="Generar contraseña temporal" />
                                </div>
                            )}
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
                            <div className="sdd-field-group full-width">
                                <label className="sdd-label">Departamento</label>
                                <input type="text" className="sdd-input-underline" value={draft.department || ''} onChange={(e) => setDraft({...draft, department: e.target.value})} />
                            </div>
                            <div className="sdd-field-group full-width">
                                <label className="sdd-label">Rol</label>
                                <input type="text" className="sdd-input-underline" value={draft.role || ''} onChange={(e) => setDraft({...draft, role: e.target.value})} />
                            </div>
                        </div>
                        {isEditing && (
                            <div className="security-box-draft" style={{marginTop:'20px'}}>
                                <span className="security-box-header">Reset de Seguridad</span>
                                <button type="button" className="btn-reset-password" onClick={handleResetPassword}>
                                    <RotateCcw size={14} /> Generar Nueva Clave
                                </button>
                            </div>
                        )}
                        <div className="modal-btn-group mt-5">
                            <button type="button" onClick={() => setOpen(false)} className="btn-modal-secondary">Cancelar</button>
                            <button type="submit" className="add-button-management flex-1 justify-center">Guardar</button>
                        </div>
                    </form>
                )}
            </SidebarDropDown>

            {/* Modal de confirmación de eliminación */}
            <Modal open={confirmOpen} title="Desactivar Coordinador" onClose={() => setConfirmOpen(false)} width={400}>
                <div className="modal-confirm-body text-center p-5">
                    <div className="modal-warning-icon mx-auto mb-4"><AlertTriangle size={40} /></div>
                    <p>¿Desactivar a <strong>{selectedCoord?.first_name} {selectedCoord?.last_name}</strong>?</p>
                    <p className="text-sm text-gray-500 mt-2">El coordinador quedará inactivo pero sus datos se mantendrán en el sistema.</p>
                    <div className="modal-btn-group mt-5">
                        <button onClick={() => setConfirmOpen(false)} className="btn-modal-secondary">Cancelar</button>
                        <button onClick={handleDelete} className="btn-modal-danger">Desactivar</button>
                    </div>
                </div>
            </Modal>

            {/* Modal de nueva contraseña */}
            <Modal open={resetPasswordConfirm} title="Contraseña Generada" onClose={() => setResetPasswordConfirm(false)} width={400}>
                <div className="text-center p-5">
                    <p className="mb-3">Nueva contraseña generada:</p>
                    <div className="bg-gray-100 p-3 rounded font-mono text-lg font-bold">{newPassword}</div>
                    <p className="text-sm text-gray-500 mt-3">Guarda esta contraseña, no podrás volver a verla.</p>
                    <button onClick={() => setResetPasswordConfirm(false)} className="add-button-management w-full mt-4">Cerrar</button>
                </div>
            </Modal>
        </div>
    );
}