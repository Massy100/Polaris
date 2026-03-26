'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import SidebarDropDown from '../components/sidebar-drop-down';
import Modal from '../components/modal';
import Pagination from '../components/pagination';
import AdminDashboardPanel from '../components/admin-dashboard-panel';
import './user-management.css';

type Docente = {
  teacher_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  cursosImpartidos: string;
  code: string;
  email: string;
  status: string;
};

type DocenteDraft = {
  first_name: string;
  last_name: string;
  code: string;
  email: string;
  courses: number[];
};

type ConfirmType = 'delete' | 'edit';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function UserManagementPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<ConfirmType>('delete');
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [draft, setDraft] = useState<DocenteDraft>({
    first_name: '',
    last_name: '',
    code: '',
    email: '',
    courses: [],
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  const iconSearch = (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" d="M10.442 10.442a1 1 0 011.415 0l3.85 3.85a1 1 0 01-1.414 1.415l-3.85-3.85a1 1 0 010-1.415z" clipRule="evenodd"></path>
      <path fillRule="evenodd" d="M6.5 12a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM13 6.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" clipRule="evenodd"></path>
    </svg>
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${API_URL}/academic-career/teachers/`;
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('page_size', pageSize.toString());
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      url += `?${queryParams.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al cargar los docentes');
      }
      
      const data = await response.json();
      
      const transformedDocentes = data.results.map((teacher: any) => ({
        teacher_id: teacher.teacher_id,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        full_name: teacher.full_name,
        cursosImpartidos: teacher.courses_taught || '',
        code: teacher.code || '',
        email: teacher.email || '',
        status: teacher.status,
      }));
      
      setDocentes(transformedDocentes);
      setTotalItems(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    if (isMounted) {
      fetchTeachers();
    }
  }, [fetchTeachers, isMounted]);

  useEffect(() => {
    if (isMounted) {
      setPage(1);
    }
  }, [searchTerm, isMounted]);

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
      handleDelete(selectedDocente.teacher_id);
    } else {
      handleEdit(selectedDocente);
    }
    setConfirmOpen(false);
    setSelectedDocente(null);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/academic-career/teachers/${id}/`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el docente');
      }
      
      fetchTeachers();
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleEdit = (c: Docente) => {
    setSelectedId(c.teacher_id);
    setDraft({
      first_name: c.first_name,
      last_name: c.last_name,
      code: c.code,
      email: c.email,
      courses: [],
    });
    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
    setSelectedId(null);
    setDraft({
      first_name: '',
      last_name: '',
      code: '',
      email: '',
      courses: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId == null) return;
    
    try {
      const response = await fetch(`${API_URL}/academic-career/teachers/${selectedId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: draft.first_name,
          last_name: draft.last_name,
          code: draft.code,
          email: draft.email,
          courses: draft.courses,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al actualizar el docente');
      }
      
      fetchTeachers();
      closeDrawer();
    } catch (err) {
      console.error('Error updating teacher:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  if (!isMounted) {
    return (
      <>
        <AdminDashboardPanel />
        <div className='container-management-general'>
          <div className='user-management-container'>
            <div className='user-management-header'>
              <div className="title-management">
                <h1>Gestión de Docentes</h1>
              </div>
            </div>
            <div className='user-management-content'>
              <div className="loading-spinner" style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '2rem' 
              }}>
                Cargando...
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminDashboardPanel />
      <div className='container-management-general'>
        {error && (
          <div className="error-message" style={{ color: 'red', padding: '1rem' }}>
            Error: {error}
          </div>
        )}
        <div className='user-management-container'>
          <div className='user-management-header'>
            <div className="title-management">
              <h1>Gestión de Docentes</h1>
            </div>
          </div>
          <div className='user-management-content'>
            <div className='search-management-section-wrapper'>
              <div className='search-section-management'>
                {iconSearch}
                <input 
                  type="text" 
                  placeholder="Búsqueda por Nombre" 
                  className='search-management-input' 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                {searchTerm && (
                  <button 
                    type="button" 
                    className="search-clear-btn" 
                    onClick={() => setSearchTerm('')} 
                    title="Limpiar"
                  >
                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1.3em" width="1.3em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M405 136.798L375.202 107 256 226.202 136.798 107 107 136.798 226.202 256 107 375.202 136.798 405 256 285.798 375.202 405 405 375.202 285.798 256z"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className='user-management-table'>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cursos impartidos</th>
                    <th>Código</th>
                    <th>Correo institucional</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 16, textAlign: 'center' }}>
                        Cargando docentes...
                      </td>
                    </tr>
                  ) : docentes.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 16, textAlign: 'center' }}>
                        No hay resultados para la búsqueda
                      </td>
                    </tr>
                  ) : (
                    docentes.map((c) => (
                      <tr key={c.teacher_id}>
                        <td>{c.full_name}</td>
                        <td>{c.cursosImpartidos}</td>
                        <td>{c.code}</td>
                        <td>{c.email}</td>
                        <td>
                          <div className="action-buttons-table">
                            <button className="edit-pencil-button" title="Editar" onClick={() => askEditConfirm(c)}>
                              <div className="edit-pencil-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="edit-pencil-icon">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.83H5v-.92l8.06-8.06.92.92L5.92 20.08zM20.71 7.04a1.003 1.003 0 000-1.42L18.37 3.29a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" />
                                </svg>
                                <svg className="edit-writing-line" viewBox="0 0 30 10">
                                  <path d="M2 6 Q6 2 10 6 T18 6 T26 6" className="edit-writing-path" />
                                </svg>
                              </div>
                            </button>
                            <button className="delete-bin-button" title="Eliminar" onClick={() => askDelete(c)}>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 14" className="delete-bin-icon delete-bin-top">
                                <g clipPath="url(#clip-bin-top)">
                                  <path fill="black" d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734Z" />
                                </g>
                                <defs>
                                  <clipPath id="clip-bin-top">
                                    <rect fill="white" height="14" width="69" />
                                  </clipPath>
                                </defs>
                              </svg>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 69 57" className="delete-bin-icon delete-bin-bottom">
                                <g clipPath="url(#clip-bin-bottom)">
                                  <path fill="black" d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z" />
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
      </div>

      <SidebarDropDown 
        open={open} 
        onClose={closeDrawer} 
        title="Editar docente" 
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
                value={draft.first_name} 
                onChange={(e) => setDraft((prev) => ({ ...prev, first_name: e.target.value }))} 
                required 
              />
              <span className="input-underline-border"></span>
            </div>
          </div>
          <div className="sdd-field">
            <label className="sdd-label">Apellido:</label>
            <div className="input-underline">
              <input 
                type="text" 
                className="input-underline-field" 
                placeholder="Apellido del docente" 
                value={draft.last_name} 
                onChange={(e) => setDraft((prev) => ({ ...prev, last_name: e.target.value }))} 
                required 
              />
              <span className="input-underline-border"></span>
            </div>
          </div>
          <div className="sdd-field">
            <label className="sdd-label">Código:</label>
            <div className="input-underline">
              <input 
                type="text" 
                className="input-underline-field" 
                placeholder="Ej: DOC001" 
                value={draft.code} 
                onChange={(e) => setDraft((prev) => ({ ...prev, code: e.target.value }))} 
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
                value={draft.email} 
                onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))} 
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
              <> ¿Seguro que deseas eliminar al docente: {' '} <span className="modal-highlight">{selectedDocente?.full_name}</span>? </>
            ) : (
              <> ¿Deseas editar al docente: {' '} <span className="modal-highlight">{selectedDocente?.full_name}</span>? </>
            )}
          </p>
          {selectedDocente && (
            <div className="modal-meta">
              <div><strong>Código:</strong> {selectedDocente.code}</div>
              <div><strong>Correo:</strong> {selectedDocente.email}</div>
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
  );
}