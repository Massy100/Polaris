'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../../components/modal';
import './maintenance.css';

export default function MaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pensumLoaded, setPensumLoaded] = useState(false);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showResetPensumModal, setShowResetPensumModal] = useState(false);
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState<number | null>(null);
  const [showRenameModal, setShowRenameModal] = useState<{ id: number; name: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pensumRes = await fetch(`${API_URL}/pensum/status/`);
      const pensumData = await pensumRes.json();
      setPensumLoaded(pensumData.is_loaded);
      setTotalCourses(pensumData.total_courses || 0);

      const batchesRes = await fetch(`${API_URL}/integrations/bulk-upload/batches/`);
      const batchesData = await batchesRes.json();
      if (batchesData.ok) {
        setTemplates(batchesData.results.filter((b: any) => b.category === 'encuestas'));
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResetPensum = async () => {
    try {
      const res = await fetch(`${API_URL}/pensum/reset/`, { method: 'POST' });
      if (res.ok) {
        showToast('Pensum restablecido correctamente');
        setPensumLoaded(false);
        setTotalCourses(0);
      } else {
        showToast('Error al restablecer el pensum', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setShowResetPensumModal(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/integrations/bulk-upload/batches/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Plantilla eliminada correctamente');
        setTemplates(templates.filter(t => t.batch_id !== id));
      } else {
        showToast('Error al eliminar la plantilla', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setShowDeleteTemplateModal(null);
    }
  };

  const handleRenameTemplate = async () => {
    if (!showRenameModal || !newName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/integrations/bulk-upload/batches/${showRenameModal.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: { batch_name: newName } })
      });
      if (res.ok) {
        showToast('Nombre actualizado correctamente');
        setTemplates(templates.map(t => t.batch_id === showRenameModal.id ? { ...t, summary: { ...t.summary, batch_name: newName } } : t));
      } else {
        showToast('Error al renombrar', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setShowRenameModal(null);
      setNewName('');
    }
  };

  return (
    <div className="url-page-bg flex-1">
      {toast && (
        <div className={`maint-toast maint-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <main className="url-container url-page-main">
        <header className="maint-header">
          <button onClick={() => router.push('/settings')} className="url-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Configuración
          </button>
          <div className="maint-title-group">
            <h1 className="url-page-title">Mantenimiento y Restauración</h1>
            <p className="url-page-sub">Panel administrativo para la gestión de la integridad de datos y limpieza de estructuras académicas.</p>
          </div>
        </header>

        <div className="maint-grid">
          {/* Sección Plantillas - AHORA ARRIBA Y ANCHA */}
          <section className="maint-card maint-card--wide">
            <div className="maint-card-header">
              <div className="maint-icon-box maint-icon-box--green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h3>Biblioteca de Plantillas de Evaluación</h3>
                <p>Formatos activos disponibles para los docentes ({templates.length})</p>
              </div>
            </div>
            <div className="maint-card-body">
              {templates.length === 0 ? (
                <div className="maint-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.5 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <p>No hay plantillas cargadas en el sistema.</p>
                </div>
              ) : (
                <div className="maint-table">
                  <div className="maint-th">
                    <div>Estructura de la Plantilla</div>
                    <div style={{ textAlign: 'right' }}>Acciones Administrativas</div>
                  </div>
                  {templates.map(t => (
                    <div key={t.batch_id} className="maint-tr">
                      <div className="maint-template-name">
                        <strong>{t.summary?.batch_name || t.source_filename}</strong>
                        <span>{t.total_rows} filas detectadas · Cargada el {new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="maint-actions">
                        <button 
                          className="maint-btn-icon" 
                          title="Renombrar"
                          onClick={() => {
                            setShowRenameModal({ id: t.batch_id, name: t.summary?.batch_name || t.source_filename });
                            setNewName(t.summary?.batch_name || t.source_filename);
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button 
                          className="maint-btn-icon maint-btn-icon--danger" 
                          title="Eliminar"
                          onClick={() => setShowDeleteTemplateModal(t.batch_id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Sección Pensum */}
          <section className="maint-card maint-card--primary">
            <div className="maint-card-header">
              <div className="maint-icon-box maint-icon-box--blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div>
                <h3>Gestión del Pensum</h3>
                <p>Estructura oficial de la carrera</p>
              </div>
              <div className={`maint-badge ${pensumLoaded ? 'maint-badge--active' : 'maint-badge--empty'}`} style={{ marginLeft: 'auto' }}>
                {pensumLoaded ? 'Activo' : 'Sin datos'}
              </div>
            </div>
            <div className="maint-card-body">
              <div className="maint-info-display">
                <div className="maint-info-item">
                  <span className="maint-info-label">Cursos registrados:</span>
                  <span className="maint-info-value">{pensumLoaded ? totalCourses : '0'}</span>
                </div>
                <div className="maint-info-item">
                  <span className="maint-info-label">Última actualización:</span>
                  <span className="maint-info-value">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <p className="maint-desc" style={{ marginTop: '16px' }}>
                La restauración del pensum eliminará todas las materias y requisitos actuales para permitir una carga limpia desde cero.
              </p>
            </div>
            <div className="maint-card-footer">
              <button 
                className="url-btn url-btn-danger url-btn-sm" 
                disabled={!pensumLoaded}
                onClick={() => setShowResetPensumModal(true)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                  <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Restaurar Pensum (Limpiar Todo)
              </button>
            </div>
          </section>

          {/* Sección Resumen de Cargas */}
          <section className="maint-card">
            <div className="maint-card-header">
              <div className="maint-icon-box maint-icon-box--gold">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h7"/><path d="M16 5V3"/><path d="M8 5V3"/><path d="M3 9h16"/><rect x="15" y="15" width="6" height="6" rx="1"/>
                </svg>
              </div>
              <div>
                <h3>Estado de Integridad</h3>
                <p>Métricas de importación activas</p>
              </div>
            </div>
            <div className="maint-card-body">
              <div className="maint-stats-list">
                <div className="maint-stat-row">
                  <span className="maint-stat-label">Autor de última carga:</span>
                  <span className="maint-stat-value">Admin Institucional</span>
                </div>
                <div className="maint-stat-row">
                  <span className="maint-stat-label">Estado de la Base:</span>
                  <span className="url-badge url-badge-success" style={{ fontSize: '10px' }}>Saludable</span>
                </div>
                <div className="maint-stat-row">
                  <span className="maint-stat-label">Sincronización:</span>
                  <span className="maint-stat-value">Automática</span>
                </div>
              </div>
            </div>
            <div className="maint-card-footer">
               <span style={{ fontSize: '12px', color: 'var(--url-text-faint)', fontStyle: 'italic' }}>Motor de integraciones operativo</span>
            </div>
          </section>
        </div>
      </main>

      {/* Modales */}
      <Modal 
        open={showResetPensumModal} 
        title="Restablecer Estructura Académica" 
        onClose={() => setShowResetPensumModal(false)}
        width={450}
      >
        <div className="maint-modal-content">
          <p>¿Está seguro de que desea eliminar el Pensum actual? Esta acción borrará permanentemente toda la configuración académica y no podrá ser revertida.</p>
          <div className="maint-modal-actions">
            <button className="url-btn url-btn-sm" onClick={() => setShowResetPensumModal(false)}>Cancelar</button>
            <button className="url-btn url-btn-danger url-btn-sm" onClick={handleResetPensum}>Sí, restablecer</button>
          </div>
        </div>
      </Modal>

      <Modal 
        open={!!showDeleteTemplateModal} 
        title="Eliminar Plantilla" 
        onClose={() => setShowDeleteTemplateModal(null)}
        width={400}
      >
        <div className="maint-modal-content">
          <p>¿Confirmas la eliminación de esta plantilla? Los docentes no podrán seleccionarla para nuevas evaluaciones.</p>
          <div className="maint-modal-actions">
            <button className="url-btn url-btn-sm" onClick={() => setShowDeleteTemplateModal(null)}>Cancelar</button>
            <button className="url-btn url-btn-danger url-btn-sm" onClick={() => showDeleteTemplateModal && handleDeleteTemplate(showDeleteTemplateModal)}>Eliminar</button>
          </div>
        </div>
      </Modal>

      <Modal 
        open={!!showRenameModal} 
        title="Renombrar Plantilla" 
        onClose={() => setShowRenameModal(null)}
        width={400}
      >
        <div className="maint-modal-content">
          <div className="maint-field">
            <label>Nuevo Nombre</label>
            <input 
              className="url-input" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ingrese el nuevo nombre"
            />
          </div>
          <div className="maint-modal-actions" style={{ marginTop: '20px' }}>
            <button className="url-btn url-btn-sm" onClick={() => setShowRenameModal(null)}>Cancelar</button>
            <button className="url-btn url-btn-primary url-btn-sm" onClick={handleRenameTemplate}>Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
