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
    teacher_id: number;
    first_name: string;
    last_name: string;
    email: string;
    code: string;
    department: string;
    phone: string;
    role: string;
    since: string | null;
    status: string;
    created_at?: string;
    updated_at?: string;
    password?: string;
};

export default function CoordManagementPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
    
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const [coordinadores, setCoordinadores] = useState<Coordinador[]>([
        {
            teacher_id: 1,
            first_name: "teacher1",
            last_name: "lastname",
            email: "email@gmail.com",
            code: "123",
            department: "Sistemas",
            phone: "555-0101",
            role: "Coordinador",
            since: null,
            status: "active",
            created_at: "2024-04-14 08:07:00",
            updated_at: "2024-04-14 08:07:00",
            password: "ADMIN_PWD_2026"
        }
    ]);

    const [open, setOpen] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedCoord, setSelectedCoord] = useState<Coordinador | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState<Partial<Coordinador>>({});

    useEffect(() => { setIsMounted(true); }, []);

    const togglePasswordVisibility = (id: number) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleStatus = (coord: Coordinador) => {
        const newStatus = coord.status === 'active' ? 'inactive' : 'active';
        setCoordinadores(prev => prev.map(c => 
            c.teacher_id === coord.teacher_id ? { ...c, status: newStatus } : c
        ));
    };

    // Lógica de Paginación Local
    const filteredCoords = useMemo(() => {
        return coordinadores.filter(c => 
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [coordinadores, searchTerm]);

    const paginatedCoords = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCoords.slice(start, start + pageSize);
    }, [filteredCoords, page, pageSize]);

    const totalItems = filteredCoords.length;

    const handleOpenAdd = () => {
        setIsEditing(false);
        setViewMode(false);
        setDraft({ first_name: '', last_name: '', email: '', code: '', department: '', phone: '', role: '', status: 'active' });
        setOpen(true);
    };

    const handleOpenEdit = (coord: Coordinador) => {
        setIsEditing(true);
        setViewMode(false);
        setSelectedCoord(coord);
        setDraft({ ...coord });
        setOpen(true);
    };

    const handleViewDetails = (coord: Coordinador) => {
        setViewMode(true);
        setIsEditing(false);
        setDraft({ ...coord });
        setOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && selectedCoord) {
            setCoordinadores(prev => prev.map(c => 
                c.teacher_id === selectedCoord.teacher_id ? { ...c, ...draft } as Coordinador : c
            ));
        } else {
            const tempPass = Math.random().toString(36).slice(-8).toUpperCase();
            const newCoord: Coordinador = {
                ...(draft as Coordinador),
                teacher_id: Math.max(...coordinadores.map(c => c.teacher_id), 0) + 1,
                password: tempPass,
                created_at: new Date().toISOString()
            };
            setCoordinadores([...coordinadores, newCoord]);
            alert(`Registrado. Clave temporal: ${tempPass}`);
        }
        setOpen(false);
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
                        <button className="add-button-management" onClick={handleOpenAdd}>
                            <Plus size={20} /> Añadir Coordinador
                        </button>
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

                        <div className='user-management-table'>
                            <table>
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
                                        <tr key={c.teacher_id}>
                                            <td className="text-center">#{c.teacher_id}</td>
                                            <td className="text-center">{c.first_name} {c.last_name}</td>
                                            <td className="text-center">
                                                <div className="flex justify-center items-center py-2">
                                                    <div className="password-box">
                                                        <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
                                                            {showPasswords[c.teacher_id] ? c.password : '••••••••'}
                                                        </span>
                                                        <button 
                                                            onClick={() => togglePasswordVisibility(c.teacher_id)} 
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#2F73DF', padding: 0 }}
                                                        >
                                                            {showPasswords[c.teacher_id] ? <Lock size={16}/> : <Eye size={16}/>}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">{c.code}</td>
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

            <SidebarDropDown open={open} onClose={() => setOpen(false)} title={viewMode ? "Especificaciones" : isEditing ? "Modificar" : "Nuevo"} width={500}>
                {viewMode ? (
                    <div className="details-grid">
                        <div className="detail-item"><span className="detail-label">Nombre</span><span className="detail-value">{draft.first_name} {draft.last_name}</span></div>
                        <div className="detail-item"><span className="detail-label">Código</span><span className="detail-value">{draft.code}</span></div>
                        <div className="detail-item"><span className="detail-label">Departamento</span><span className="detail-value">{draft.department}</span></div>
                        <div className="detail-item"><span className="detail-label">Teléfono</span><span className="detail-value">{draft.phone}</span></div>
                        <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{draft.email}</span></div>
                        <div className="detail-item"><span className="detail-label">Rol</span><span className="detail-value">{draft.role}</span></div>
                        <button onClick={() => setOpen(false)} className="btn-modal-secondary w-full mt-5">Cerrar</button>
                    </div>
                ) : (
                    <form className="sdd-form-container" onSubmit={handleSubmit}>
                        <div className="sdd-form-grid">
                            <div className="sdd-field-group">
                                <label className="sdd-label">Nombre</label>
                                <input type="text" className="sdd-input-underline" value={draft.first_name} onChange={(e) => setDraft({...draft, first_name: e.target.value})} required />
                            </div>
                            <div className="sdd-field-group">
                                <label className="sdd-label">Apellido</label>
                                <input type="text" className="sdd-input-underline" value={draft.last_name} onChange={(e) => setDraft({...draft, last_name: e.target.value})} required />
                            </div>
                            <div className="sdd-field-group full-width">
                                <label className="sdd-label">Correo Institucional</label>
                                <input type="email" className="sdd-input-underline" value={draft.email} onChange={(e) => setDraft({...draft, email: e.target.value})} required />
                            </div>
                            <div className="sdd-field-group">
                                <label className="sdd-label">Código</label>
                                <input type="text" className="sdd-input-underline" value={draft.code} onChange={(e) => setDraft({...draft, code: e.target.value})} required />
                            </div>
                            <div className="sdd-field-group">
                                <label className="sdd-label">Teléfono</label>
                                <input type="text" className="sdd-input-underline" value={draft.phone} onChange={(e) => setDraft({...draft, phone: e.target.value})} />
                            </div>
                            <div className="sdd-field-group full-width">
                                <label className="sdd-label">Departamento</label>
                                <input type="text" className="sdd-input-underline" value={draft.department} onChange={(e) => setDraft({...draft, department: e.target.value})} />
                            </div>
                            <div className="sdd-field-group full-width">
                                <label className="sdd-label">Rol</label>
                                <input type="text" className="sdd-input-underline" value={draft.role} onChange={(e) => setDraft({...draft, role: e.target.value})} />
                            </div>
                        </div>
                        {isEditing && (
                            <div className="security-box-draft" style={{marginTop:'20px'}}>
                                <span className="security-box-header">Reset de Seguridad</span>
                                <button type="button" className="btn-reset-password" onClick={() => alert("Nueva contraseña generada")}>
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

            <Modal open={confirmOpen} title="Eliminar" onClose={() => setConfirmOpen(false)} width={400}>
                <div className="modal-confirm-body text-center p-5">
                    <div className="modal-warning-icon mx-auto mb-4"><AlertTriangle size={40} /></div>
                    <p>¿Eliminar a <strong>{selectedCoord?.first_name}</strong>?</p>
                    <div className="modal-btn-group mt-5">
                        <button onClick={() => setConfirmOpen(false)} className="btn-modal-secondary">No</button>
                        <button onClick={() => { setCoordinadores(coordinadores.filter(c => c.teacher_id !== selectedCoord?.teacher_id)); setConfirmOpen(false); }} className="btn-modal-danger">Sí, eliminar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}