'use client';

import { useMemo, useState } from 'react';
import AdminDashboardPanel from '../components/admin-dashboard-panel';
import './bulk-upload.css';

type UploadCategory = 'titulos' | 'meritos' | 'opiniones';

type FormatField = {
  key: string;
  desc: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TAB_CONFIG: Record<
  UploadCategory,
  {
    label: string;
    sectionTitle: string;
    sectionSub: string;
    cardTitle: string;
    cardDesc: string;
    formatFields: FormatField[];
  }
> = {
  titulos: {
    label: 'Títulos',
    sectionTitle: 'Carga de Títulos Académicos',
    sectionSub: 'Sube archivos Excel o CSV con los datos de títulos de cada profesor.',
    cardTitle: 'Subir Archivo de Títulos',
    cardDesc: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de títulos.',
    formatFields: [
      { key: 'nombre_profesor', desc: 'Nombre completo del profesor' },
      { key: 'email', desc: 'Correo electrónico' },
      { key: 'telefono', desc: 'Número de contacto' },
      { key: 'especialidad', desc: 'Área de especialización' },
      { key: 'grado_academico', desc: 'Máximo grado académico' },
      { key: 'experiencia_anos', desc: 'Años de experiencia' },
      { key: 'institucion_actual', desc: 'Institución donde trabaja' },
    ],
  },
  meritos: {
    label: 'Méritos',
    sectionTitle: 'Carga de Méritos de Profesores',
    sectionSub: 'Sube archivos Excel o CSV con los datos de méritos de cada profesor.',
    cardTitle: 'Subir Archivo de Méritos',
    cardDesc: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de méritos.',
    formatFields: [
      { key: 'nombre_profesor', desc: 'Nombre completo del profesor' },
      { key: 'email', desc: 'Correo electrónico' },
      { key: 'tipo_merito', desc: 'Tipo de mérito o reconocimiento' },
      { key: 'descripcion', desc: 'Descripción del mérito' },
      { key: 'fecha_obtencion', desc: 'Fecha de obtención' },
      { key: 'institucion_otorgante', desc: 'Institución que otorgó el mérito' },
    ],
  },
  opiniones: {
    label: 'Opiniones',
    sectionTitle: 'Carga de Opiniones de Profesores',
    sectionSub: 'Sube archivos Excel o CSV con las opiniones de cada profesor.',
    cardTitle: 'Subir Archivo de Opiniones',
    cardDesc: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de opiniones.',
    formatFields: [
      { key: 'nombre_profesor', desc: 'Nombre completo del profesor' },
      { key: 'email', desc: 'Correo electrónico' },
      { key: 'opinion', desc: 'Texto de la opinión' },
      { key: 'calificacion', desc: 'Puntuación del 1 al 10' },
      { key: 'fecha_opinion', desc: 'Fecha de la opinión' },
      { key: 'autor', desc: 'Autor de la opinión' },
    ],
  },
};

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BulkUploadPage() {
  const [activeTab, setActiveTab] = useState<UploadCategory>('titulos');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState<'success' | 'error' | null>(null);

  const current = TAB_CONFIG[activeTab];
  const accept = '.xlsx,.xls,.csv';

  const fileSummary = useMemo(() => {
    return files.map((file) => ({
      name: file.name,
      sizeLabel: formatFileSize(file.size),
    }));
  }, [files]);

  const resetFiles = () => {
    setFiles([]);
    setResultMessage('');
    setResultType(null);
  };

  const appendFiles = (incoming: File[]) => {
    if (!incoming.length) {
      return;
    }

    setFiles((prev) => {
      const seen = new Set(prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
      const next = [...prev];
      for (const file of incoming) {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          next.push(file);
        }
      }
      return next;
    });
    setResultMessage('');
    setResultType(null);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendFiles(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    appendFiles(Array.from(event.dataTransfer.files || []));
  };

  const handleRemoveFile = (name: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
  };

  const handleProcess = async () => {
    if (!files.length || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setResultMessage('');
    setResultType(null);

    try {
      const formData = new FormData();
      formData.append('category', activeTab);
      files.forEach((file) => formData.append('files', file));

      const response = await fetch(`${API_URL}/integrations/bulk-upload/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'No se pudo procesar la carga masiva.');
      }

      setResultMessage(`Carga procesada: ${data.total_files} archivo(s) en ${data.category}.`);
      setResultType('success');
      setFiles([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo procesar la carga masiva.';
      setResultMessage(`Error: ${message}`);
      setResultType('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <AdminDashboardPanel activePath="/bulk-upload" />

      <div className="bu-root">
        <header className="bu-header">
          <div className="bu-header-brand">
            <div className="bu-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div>
              <p className="bu-brand-title">Carga Masiva de Datos</p>
              <p className="bu-brand-sub">Sistema de gestión de profesores</p>
            </div>
          </div>
        </header>

        <nav className="bu-tabs" aria-label="Tipos de carga">
          {(Object.keys(TAB_CONFIG) as UploadCategory[]).map((category) => (
            <button
              key={category}
              type="button"
              className={`bu-tab ${activeTab === category ? 'bu-tab--active' : ''}`}
              onClick={() => {
                setActiveTab(category);
                resetFiles();
              }}
            >
              {TAB_CONFIG[category].label}
            </button>
          ))}
        </nav>

        <main className="bu-main">
          <section className="bu-section-title">
            <h1 className="bu-h1">{current.sectionTitle}</h1>
            <p className="bu-h1-sub">{current.sectionSub}</p>
          </section>

          <section className="bu-card">
            <h2 className="bu-card-title">{current.cardTitle}</h2>
            <p className="bu-card-sub">{current.cardDesc}</p>

            <label
              className={`bu-dropzone ${isDragging ? 'bu-dropzone--active' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
            >
              <input className="bu-hidden-input" type="file" multiple accept={accept} onChange={onInputChange} />
              <div className="bu-dropzone-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </div>
              <p className="bu-dropzone-main">Arrastra tu archivo aquí o haz clic para seleccionar</p>
              <p className="bu-dropzone-sub">Formatos soportados: {accept}</p>
              <span className="bu-select-btn">Seleccionar Archivo</span>
            </label>

            {fileSummary.length > 0 && (
              <div className="bu-preview-card">
                <div className="bu-preview-header">
                  <div>
                    <p className="bu-preview-title">Archivos seleccionados</p>
                    <p className="bu-preview-file">{fileSummary.length} archivo(s) listos para procesar</p>
                  </div>
                  <div className="bu-preview-meta">
                    <span className="bu-meta-badge">{current.label}</span>
                  </div>
                </div>

                <div className="bu-table-scroll">
                  <table className="bu-table">
                    <thead>
                      <tr>
                        <th className="bu-th bu-th-num">#</th>
                        <th className="bu-th">Archivo</th>
                        <th className="bu-th">Tamaño</th>
                        <th className="bu-th">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fileSummary.map((file, index) => (
                        <tr key={file.name} className="bu-tr">
                          <td className="bu-td bu-td-num">{index + 1}</td>
                          <td className="bu-td">{file.name}</td>
                          <td className="bu-td">{file.sizeLabel}</td>
                          <td className="bu-td">
                            <button type="button" className="bu-file-tag-remove" onClick={() => handleRemoveFile(file.name)}>
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bu-preview-footer">
                  <span className="bu-preview-msg">Revisa los archivos antes de enviarlos al backend.</span>
                </div>
              </div>
            )}

            <div className="bu-save-row">
              <button type="button" className="bu-save-btn" onClick={handleProcess} disabled={!files.length || isProcessing}>
                {isProcessing ? 'Procesando...' : 'Procesar Documentos'}
              </button>
            </div>

            {resultMessage && (
              <div className={`bu-toast ${resultType === 'error' ? 'bu-toast--error' : 'bu-toast--success'}`}>
                {resultMessage}
              </div>
            )}
          </section>

          <section className="bu-card">
            <h2 className="bu-card-title">Formato esperado del archivo</h2>
            <p className="bu-card-sub">El backend valida estos campos por categoría.</p>
            <ul>
              {current.formatFields.map((field) => (
                <li key={field.key}>
                  <strong>{field.key}</strong>: {field.desc}
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="bu-footer">Sistema de Carga Masiva de Datos - Gestión de Profesores</footer>
      </div>
    </>
  );
}
