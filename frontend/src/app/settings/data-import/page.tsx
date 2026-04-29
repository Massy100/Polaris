'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './data-import.css';

interface TemplateHistory {
  id: string;
  name: string;
  type: 'pensum' | 'survey';
  date: string;
  author: string;
}

const MOCK_HISTORY: TemplateHistory[] = [
  { id: '1', name: 'Evaluación Docente 2025 - General', type: 'survey', date: '2026-03-15', author: 'Admin Institucional' },
  { id: '2', name: 'Pensum Ingeniería 2026', type: 'pensum', date: '2026-02-10', author: 'Admin Institucional' },
  { id: '3', name: 'Laboratorios Prácticos - Observaciones', type: 'survey', date: '2026-01-20', author: 'María López' },
];

export default function DataImportPage() {
  const router = useRouter();
  
  const [importType, setImportType] = useState<'pensum' | 'survey'>('survey');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState<TemplateHistory[]>(MOCK_HISTORY);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const toast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0].name);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    if (importType === 'survey' && !templateName.trim()) {
      toast('Debes ingresar un nombre para la plantilla.');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
      
      const newEntry: TemplateHistory = {
        id: Date.now().toString(),
        name: importType === 'survey' ? templateName : 'Actualización de Pensum Base',
        type: importType,
        date: new Date().toISOString().split('T')[0],
        author: 'Admin Institucional'
      };

      setHistory([newEntry, ...history]);
      setSelectedFile(null);
      setTemplateName('');
      toast('Archivo procesado y guardado correctamente.');
    }, 2000);
  };

  return (
    <div className="url-page-bg flex-1">
      {showToast && (
        <div className="di-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toastMsg}
        </div>
      )}

      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px', maxWidth: '1000px' }}>
        <header className="settings-header" style={{ marginBottom: '32px' }}>
          <button onClick={() => router.push('/settings')} className="settings-back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Configuración
          </button>
          <h1 className="settings-title">Gestión de Importaciones</h1>
          <p className="settings-subtitle">Carga estructuras académicas y centraliza tus plantillas de evaluación.</p>
        </header>

        <div className="di-layout">
          <div className="di-panel">
            <div className="di-panel-header">
              <h2>Nueva Importación</h2>
            </div>
            <div className="di-panel-body">
              <div className="di-form-group">
                <label className="di-label">Tipo de archivo a subir</label>
                <div className="di-type-selector">
                  <button 
                    className={`di-type-card ${importType === 'survey' ? 'active' : ''}`}
                    onClick={() => setImportType('survey')}
                  >
                    <div className="di-type-icon" style={{ color: 'var(--url-gold)', background: 'var(--url-surface-2)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/>
                      </svg>
                    </div>
                    <span>Plantilla de Encuesta</span>
                  </button>
                  <button 
                    className={`di-type-card ${importType === 'pensum' ? 'active' : ''}`}
                    onClick={() => setImportType('pensum')}
                  >
                    <div className="di-type-icon" style={{ color: 'var(--url-navy-light)', background: 'var(--url-info-bg)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                      </svg>
                    </div>
                    <span>Estructura de Pensum</span>
                  </button>
                </div>
              </div>

              {importType === 'survey' && (
                <div className="di-form-group">
                  <label className="di-label">Nombre de la Plantilla</label>
                  <input 
                    type="text" 
                    className="di-input" 
                    placeholder="Ej. Compiladores - Observaciones" 
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
              )}

              <div className="di-form-group">
                <label className="di-label">Archivo Excel (.xlsx, .csv)</label>
                <label className={`di-dropzone ${isUploading ? 'uploading' : ''} ${selectedFile ? 'has-file' : ''}`}>
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileSelect} disabled={isUploading} style={{ display: 'none' }} />
                  
                  {isUploading ? (
                    <div className="di-dropzone-content">
                      <svg className="di-spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span>Procesando archivo...</span>
                    </div>
                  ) : selectedFile ? (
                    <div className="di-dropzone-content success">
                      <div className="di-dropzone-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <span className="di-filename">{selectedFile}</span>
                      <span className="di-hint">Clic para cambiar archivo</span>
                    </div>
                  ) : (
                    <div className="di-dropzone-content">
                      <div className="di-dropzone-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <span className="di-title">Seleccionar o arrastrar archivo</span>
                      <span className="di-hint">Formatos soportados: Excel (.xlsx), CSV</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="di-actions">
                <button 
                  className="url-btn url-btn-primary" 
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || (importType === 'survey' && !templateName.trim())}
                >
                  {isUploading ? 'Cargando...' : 'Subir Archivo'}
                </button>
              </div>
            </div>
          </div>

          <div className="di-panel">
            <div className="di-panel-header">
              <h2>Historial de Importaciones</h2>
            </div>
            <div className="di-history-table-wrap">
              {history.length === 0 ? (
                <div className="di-empty-state">
                  <p>No hay importaciones registradas.</p>
                </div>
              ) : (
                <div className="di-table">
                  <div className="di-tr di-thead">
                    <div className="di-th">Nombre / Archivo</div>
                    <div className="di-th">Tipo</div>
                    <div className="di-th">Fecha</div>
                    <div className="di-th">Autor</div>
                  </div>
                  {history.map((item) => (
                    <div className="di-tr" key={item.id}>
                      <div className="di-td">
                        <span className="di-item-name">{item.name}</span>
                      </div>
                      <div className="di-td">
                        <span className={`di-badge ${item.type === 'survey' ? 'badge-survey' : 'badge-pensum'}`}>
                          {item.type === 'survey' ? 'Encuesta' : 'Pensum'}
                        </span>
                      </div>
                      <div className="di-td di-text-muted">{item.date}</div>
                      <div className="di-td di-text-muted">{item.author}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}