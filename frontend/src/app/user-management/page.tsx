'use client';

import { useMemo, useState } from 'react';
import SidebarDropDown from '../components/sidebar-drop-down';
import Modal from '../components/modal';
import './user-management.css'




type Docente = {
    id: number;
    nombre: string;
    cursosImpartidos: string;
    seccion: string;
    correoInstitucional: string;
};

type DocenteDraft = Omit<Docente, "id">;

type ConfirmType = 'delete' | 'edit';

export default function UserManagementPage() {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"add" | "edit">("add");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmType, setConfirmType] = useState<ConfirmType>('delete');
    const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);

    const [draft, setDraft] = useState<DocenteDraft>({
        nombre: '',
        cursosImpartidos: '',
        seccion: '',
        correoInstitucional: '',
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');

    const iconSearch = (
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414 1.415l-3.85-3.85a1 1 0 010-1.415z" clipRule="evenodd"></path><path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" clipRule="evenodd"></path></svg>
    );

    // Local Data and functions
    const docentesMock = [
        {
            id: 1,
            nombre: 'Ana Pérez',
            cursosImpartidos: 'HIST-101, LIT-205',
            seccion: 'Sección A',
            correoInstitucional: 'ana.perez@universidad.edu',
        },
        {
            id: 2,
            nombre: 'Juan R. Rodríguez',
            cursosImpartidos: 'MAT-101, FIS-203',
            seccion: 'Sección B',
            correoInstitucional: 'juan.rodriguez@universidad.edu',
        },
        {
            id: 3,
            nombre: 'María García',
            cursosImpartidos: 'ARQ-103, ART-101',
            seccion: 'Sección D',
            correoInstitucional: 'maria.garcia@universidad.edu',
        },
    ];

    const [docentes, setDocentes] = useState<Docente[]>(docentesMock);

    const sections = useMemo(() => {
        const unique = Array.from(new Set(docentes.map((d) => d.seccion.trim()).filter(Boolean)));
        return unique.sort((a, b) => a.localeCompare(b, 'es'));
    }, [docentes]);

    const filteredDocentes = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return docentes.filter((d) => {
            const matchesSection = sectionFilter ? d.seccion === sectionFilter : true;

            if (!q) return matchesSection;

            const haystack = [
                d.nombre,
                d.cursosImpartidos,
                d.seccion,
                d.correoInstitucional,
            ]
                .join(' ')
                .toLowerCase();

            const matchesSearch = haystack.includes(q);

            return matchesSection && matchesSearch;
        });
    }, [docentes, searchTerm, sectionFilter]);

    const askDelete = (docente: Docente) => {
        setConfirmType('delete');
        setSelectedDocente(docente);
        setConfirmOpen(true);
    };

    const askEditConfirm = (docente: Docente) => {
        setConfirmType('edit');
        setSelectedDocente(docente);
        setConfirmOpen(true);
    };

    const handleConfirm = () => {
        if (!selectedDocente) return;

        if (confirmType === 'delete') {
            handleDelete(selectedDocente.id);
        } else {
            // confirmType === 'edit'
            handleEdit(selectedDocente);
        }

        setConfirmOpen(false);
        setSelectedDocente(null);
    };

    const handleDelete = (id: number) => {
        setDocentes((prev) => prev.filter((c) => c.id !== id));
    };

    const handleEdit = (c: Docente) => {
        setMode("edit");
        setSelectedId(c.id);
        setDraft({
            nombre: c.nombre,
            cursosImpartidos: c.cursosImpartidos,
            seccion: c.seccion,
            correoInstitucional: c.correoInstitucional,
        });
        setOpen(true);
    };

    const openAdd = () => {
        setMode("add");
        setSelectedId(null);
        setDraft({
            nombre: '',
            cursosImpartidos: '',
            seccion: '',
            correoInstitucional: '',
        });
        setOpen(true);
    };

    const closeDrawer = () => {
        setOpen(false);
        setMode("add");
        setSelectedId(null);
        setDraft({
            nombre: '',
            cursosImpartidos: '',
            seccion: '',
            correoInstitucional: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === "add") {
            const newUser: Docente = { id: Date.now(), ...draft };
            setDocentes(prev => [...prev, newUser]);
        } else {
            // mode === "edit"
            if (selectedId == null) return;
            setDocentes(prev =>
                prev.map(c => (c.id === selectedId ? { id: selectedId, ...draft } : c))
            );
        }

        setOpen(false);
    };

    return (
        <>
            <div className='container-management-general'>
                <div className='user-management-container'>

                    <div className='user-management-header'>
                        <div className='image-section-management'>
                            <div className='image-management'>
                                <img src="https://estudiantes-argentina.unir.net/wp-content/uploads/sites/33/2021/09/tres-diversos-empresarios-trabajando-juntos-colaborando-en-laptop-en-la-oficina-1.jpg_s1024x1024wisk20c1R9DvqdDbQA6pkWbcbB413PtB2FjOaEXvOm3w65Tazo-1.jpg" alt="User Management" />
                            </div>
                            <div className='tittle-management'>
                                <h1>Gestión de Usuarios</h1>
                                <h2>Coordinadores del Departamento</h2>
                            </div>
                        </div>
                        <button
                            className="btn-add-user"
                            onClick={openAdd}
                        >
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="1" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-.5.5H4a.5.5 0 010-1h3.5V4a.5.5 0 01.5-.5z" clipRule="evenodd"></path><path fillRule="evenodd" d="M7.5 8a.5.5 0 01.5-.5h4a.5.5 0 010 1H8.5V12a.5.5 0 01-1 0V8z" clipRule="evenodd"></path></svg>
                            Agregar docente
                        </button>
                    </div>

                    <div className='user-management-content'>
                        <div className='search-filter-management-section'>
                            <div className='search-section-management'>
                                {iconSearch}
                                <input
                                    type="text"
                                    placeholder="Busqueda por Nombre"
                                    className='search-management-input'
                                    value={searchTerm} onChange={(e) =>
                                        setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        className="search-clear-btn"
                                        onClick={() => setSearchTerm('')}
                                        aria-label="Limpiar búsqueda"
                                        title="Limpiar"
                                    >
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1.3em" width="1.3em" xmlns="http://www.w3.org/2000/svg"><path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path></svg>
                                    </button>
                                )}
                            </div>

                            <div className="filter-section-management">
                                <select
                                    id="filter-group"
                                    value={sectionFilter}
                                    onChange={(e) => setSectionFilter(e.target.value)}
                                >
                                    <option value="">Filtrar por Sección</option>
                                    {sections.map((sec) => (
                                        <option key={sec} value={sec}>
                                            {sec}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <p>Lista de coordinadores</p>

                        <div className='user-management-table'>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Cursos impartidos</th>
                                        <th>Sección</th>
                                        <th>Correo institucional</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocentes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 16, textAlign: 'center' }}>
                                                No hay resultados para la búsqueda/filtro
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredDocentes.map((c) => (
                                            <tr key={c.id}>
                                                <td>{c.nombre}</td>
                                                <td>{c.cursosImpartidos}</td>
                                                <td>{c.seccion}</td>
                                                <td>{c.correoInstitucional}</td>
                                                <td>
                                                    <div className="action-buttons-table">
                                                        <button
                                                            className="edit-pencil-button"
                                                            title="Editar"
                                                            onClick={() => askEditConfirm(c)}
                                                        >
                                                            <div className="edit-pencil-wrapper">
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 24 24"
                                                                    className="edit-pencil-icon"
                                                                >
                                                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l8.06-8.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" />
                                                                </svg>
                                                                <svg
                                                                    className="edit-writing-line"
                                                                    viewBox="0 0 30 10"
                                                                >
                                                                    <path
                                                                        d="M2 6 Q6 2 10 6 T18 6 T26 6"
                                                                        className="edit-writing-path"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </button>

                                                        <button
                                                            className="delete-bin-button"
                                                            title="Eliminar"
                                                            onClick={() => askDelete(c)}
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 69 14"
                                                                className="delete-bin-icon delete-bin-top"
                                                            >
                                                                <g clipPath="url(#clip-bin-top)">
                                                                    <path
                                                                        fill="black"
                                                                        d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734Z"
                                                                    />
                                                                </g>
                                                                <defs>
                                                                    <clipPath id="clip-bin-top">
                                                                        <rect fill="white" height="14" width="69" />
                                                                    </clipPath>
                                                                </defs>
                                                            </svg>

                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 69 57"
                                                                className="delete-bin-icon delete-bin-bottom"
                                                            >
                                                                <g clipPath="url(#clip-bin-bottom)">
                                                                    <path
                                                                        fill="black"
                                                                        d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"
                                                                    />
                                                                </g>
                                                                <defs>
                                                                    <clipPath id="clip-bin-bottom">
                                                                        <rect fill="white" height="57" width="69" />
                                                                    </clipPath>
                                                                </defs>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar for add/edit docente */}
            <SidebarDropDown
                open={open}
                onClose={closeDrawer}
                title={
                    mode === "edit"
                        ? "Editar docente"
                        : "Agregar docente"
                }
                width={420}
            >
                <form className="sdd-form" onSubmit={handleSubmit}>
                    <div className="sdd-field">
                        <label className="sdd-label">Nombre:</label>
                        <div className="input-underline">
                            <input
                                type="text"
                                className="input-underline-field"
                                placeholder="Nombre del docente"
                                value={draft.nombre}
                                onChange={(e) => setDraft((prev) => ({ ...prev, nombre: e.target.value }))}
                                required
                            />
                            <span className="input-underline-border"></span>
                        </div>
                    </div>

                    <div className="sdd-field">
                        <label className="sdd-label">Cursos impartidos:</label>
                        <div className="input-underline">
                            <input
                                type="text"
                                className="input-underline-field"
                                placeholder="Ej: HIST-101, LIT-205"
                                value={draft.cursosImpartidos}
                                onChange={(e) => setDraft((prev) => ({ ...prev, cursosImpartidos: e.target.value }))}
                            />
                            <span className="input-underline-border"></span>
                        </div>
                    </div>

                    <div className="sdd-field">
                        <label className="sdd-label">Sección:</label>
                        <div className="input-underline">
                            <input
                                type="text"
                                className="input-underline-field"
                                placeholder="Ej: Sección A"
                                value={draft.seccion}
                                onChange={(e) => setDraft((prev) => ({ ...prev, seccion: e.target.value }))}
                            />
                            <span className="input-underline-border"></span>
                        </div>
                    </div>

                    <div className="sdd-field">
                        <label className="sdd-label">Correo institucional:</label>
                        <div className="input-underline">
                            <input
                                type="email"
                                className="input-underline-field"
                                placeholder="ejemplo@universidad.edu"
                                value={draft.correoInstitucional}
                                onChange={(e) => setDraft((prev) => ({ ...prev, correoInstitucional: e.target.value }))}
                            />
                            <span className="input-underline-border"></span>
                        </div>
                    </div>

                    <div className="sdd-actions">
                        <button type="button" className="sdd-btn sdd-btn-ghost" onClick={closeDrawer}>
                            Cancelar
                        </button>
                        <button type="submit" className="sdd-btn sdd-btn-primary">
                            Guardar
                        </button>
                    </div>
                </form>
            </SidebarDropDown>

            {/* Modal to confirm delete/edit */}
            <Modal
                open={confirmOpen}
                title={confirmType === 'delete' ? 'Confirmar eliminación' : 'Confirmar edición'}
                onClose={() => {
                    setConfirmOpen(false);
                    setSelectedDocente(null);
                }}
                width={480}
            >
                <div className="modal-content">
                    <p className="modal-text">
                        {confirmType === 'delete' ? (
                            <>
                                ¿Seguro que deseas eliminar al docente: {' '}
                                <span className="modal-highlight">{selectedDocente?.nombre}</span>?
                            </>
                        ) : (
                            <>
                                ¿Deseas editar al docente: {' '}
                                <span className="modal-highlight">{selectedDocente?.nombre}</span>?
                            </>
                        )}
                    </p>

                    {selectedDocente && (
                        <div className="modal-meta">
                            <div><strong>Sección:</strong> {selectedDocente.seccion}</div>
                            <div><strong>Correo:</strong> {selectedDocente.correoInstitucional}</div>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            className="modal-btn modal-btn-ghost"
                            type="button"
                            onClick={() => {
                                setConfirmOpen(false);
                                setSelectedDocente(null);
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            className={`modal-btn ${confirmType === 'delete' ? 'modal-btn-danger' : 'modal-btn-primary'}`}
                            type="button"
                            onClick={handleConfirm}
                        >
                            {confirmType === 'delete' ? 'Sí, eliminar' : 'Sí, editar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
