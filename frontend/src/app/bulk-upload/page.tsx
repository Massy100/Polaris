'use client';

import { useState, useRef, useCallback, useMemo } from "react";
import "./bulk-upload.css";

type TabKey = 'credenciales' | 'evaluaciones';

type UploadedFile = {
  file: File;
  rows: Record<string, string>[];
  columns: string[];
};

type ToastState = {
  visible: boolean;
  message: string;
  success: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TABS: {
  key: TabKey;
  label: string;
  title: string;
  subtitle: string;
  cardTitle: string;
  cardSub: string;
  saveLabel: string;
}[] = [
  {
    key: 'credenciales',
    label: 'Portafolio Profesional',
    title: 'Carga de Portafolio Profesional',
    subtitle: 'Sube archivos Excel o CSV con los títulos, certificaciones y méritos de cada profesor.',
    cardTitle: 'Subir Archivo de Portafolio',
    cardSub: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con el portafolio',
    saveLabel: 'Guardar Portafolio',
  },
  {
    key: 'evaluaciones',
    label: 'Evaluaciones Estudiantiles',
    title: 'Carga de Evaluaciones Estudiantiles',
    subtitle: 'Sube archivos Excel o CSV con los resultados de las evaluaciones de desempeño realizadas por los estudiantes.',
    cardTitle: 'Subir Archivo de Evaluaciones',
    cardSub: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con las evaluaciones',
    saveLabel: 'Guardar Evaluaciones',
  },
];

const REQUIRED_FIELDS: Record<TabKey, string[]> = {
  credenciales: [
    'nombre_profesor', 
    'email', 
    'telefono', 
    'especialidad', 
    'grado_academico', 
    'experiencia_anos', 
    'institucion_actual',
    'tipo_merito',
    'descripcion_merito',
    'fecha_obtencion',
    'institucion_otorgante'
  ],
  evaluaciones: ['nombre_profesor', 'email', 'opinion', 'calificacion', 'fecha_opinion', 'autor'],
};

const IconUpload = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconCheck = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconClose = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconFile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const IconCredenciales = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconEvaluaciones = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const TAB_ICONS: Record<TabKey, React.FC> = {
  credenciales: IconCredenciales,
  evaluaciones: IconEvaluaciones,
};

function parseCSVPreview(text: string): { rows: Record<string, string>[]; columns: string[] } {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  if (!lines.length) {
    return { rows: [], columns: [] };
  }

  const columns = lines[0]
    .split(',')
    .map((column) => column.trim().replace(/^"|"$/g, ''));

  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    columns.forEach((column, index) => {
      row[column] = values[index] ?? '';
    });
    return row;
  });

  return { rows, columns };
}

function buildTemplateCSV(category: TabKey): string {
  const columns = REQUIRED_FIELDS[category];
  return `${columns.join(',')}\n`;
}

async function parsePreview(file: File): Promise<{ rows: Record<string, string>[]; columns: string[] }> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseCSVPreview(await file.text());
  }

  return {
    rows: [
      {
        archivo: file.name,
        nota: 'Vista previa simplificada para Excel',
      },
    ],
    columns: ['archivo', 'nota'],
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        onFile(file);
      }
    },
    [onFile]
  );

  return (
    <div
      className={`bu-dropzone${dragging ? ' bu-dropzone--drag' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="bu-dz-icon-wrap">
        <IconUpload />
      </div>
      <p className="bu-dz-main">Arrastra tu archivo aquí o haz clic para seleccionar</p>
      <p className="bu-dz-sub">Formatos soportados: .xlsx, .xls, .csv</p>
      <button type="button" className="bu-dz-btn" onClick={() => inputRef.current?.click()}>
        <IconFile />
        Seleccionar Archivo
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFile(file);
          }
          event.target.value = '';
        }}
      />
    </div>
  );
}

function FileTag({ uploaded, onRemove }: { uploaded: UploadedFile; onRemove: () => void }) {
  return (
    <div className="bu-file-tag">
      <span className="bu-file-tag-check">
        <IconCheck size={17} />
      </span>
      <div className="bu-file-tag-info">
        <span className="bu-file-tag-name">{uploaded.file.name}</span>
        <span className="bu-file-tag-size">{formatBytes(uploaded.file.size)}</span>
      </div>
      <button className="bu-file-tag-rm" onClick={onRemove} aria-label="Quitar archivo">
        <IconClose size={13} />
      </button>
    </div>
  );
}

function DataPreview({
  uploaded,
  saveLabel,
  onSave,
  isSaving,
}: {
  uploaded: UploadedFile;
  saveLabel: string;
  onSave: () => void;
  isSaving: boolean;
}) {
  const previewRows = uploaded.rows.slice(0, 10);

  return (
    <div className="bu-preview-card">
      <div className="bu-preview-head">
        <div className="bu-preview-head-left">
          <span className="bu-preview-title">Vista Previa de Datos</span>
          <span className="bu-preview-file">Archivo: {uploaded.file.name}</span>
        </div>
        <div className="bu-preview-head-right">
          <span className="bu-preview-count">{uploaded.rows.length} registros</span>
          <span className="bu-preview-cols">
            {uploaded.columns.length} {uploaded.columns.length === 1 ? 'columna' : 'columnas'}
          </span>
        </div>
      </div>

      <div className="bu-table-wrap">
        <table className="bu-table">
          <thead>
            <tr>
              <th className="bu-th bu-th-num">#</th>
              {uploaded.columns.map((column) => (
                <th key={column} className="bu-th">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, index) => (
              <tr key={index} className="bu-tr">
                <td className="bu-td bu-td-num">{index + 1}</td>
                {uploaded.columns.map((column) => (
                  <td key={column} className="bu-td">
                    {String(row[column] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bu-preview-foot">
        <span className="bu-preview-foot-msg">
          Los datos se han procesado correctamente y están listos para ser guardados.
        </span>
      </div>

      <div className="bu-save-row">
        <button className="bu-save-btn" onClick={onSave} disabled={isSaving}>
          <IconFile />
          {isSaving ? 'Guardando...' : `${saveLabel} (${uploaded.rows.length})`}
        </button>
      </div>
    </div>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) {
    return null;
  }

  return (
    <div className={`bu-toast ${toast.success ? 'bu-toast--ok' : 'bu-toast--err'}`}>
      <IconCheck size={15} />
      <span>{toast.message}</span>
    </div>
  );
}

export default function BulkUploadPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('credenciales');
  const [uploads, setUploads] = useState<Record<TabKey, UploadedFile | null>>({
    credenciales: null,
    evaluaciones: null,
  });
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', success: true });
  const [isSaving, setIsSaving] = useState(false);

  const tab = useMemo(() => TABS.find((item) => item.key === activeTab)!, [activeTab]);
  const upload = uploads[activeTab];

  const showToast = (message: string, success: boolean) => {
    setToast({ visible: true, message, success });
    setTimeout(() => {
      setToast((previous) => ({ ...previous, visible: false }));
    }, 3500);
  };

  const handleFile = async (file: File) => {
    try {
      const preview = await parsePreview(file);
      setUploads((previous) => ({
        ...previous,
        [activeTab]: {
          file,
          rows: preview.rows,
          columns: preview.columns,
        },
      }));
      showToast('Archivo procesado correctamente', true);
    } catch {
      showToast('Error al procesar el archivo', false);
    }
  };

  const handleSave = async () => {
    if (!upload || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      const backendCategory = activeTab === 'evaluaciones' ? 'encuestas' : activeTab;
      formData.append('category', backendCategory);
      formData.append('files', upload.file);

      const response = await fetch(`${API_URL}/integrations/bulk-upload/`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'No se pudo guardar la carga masiva.');
      }

      showToast(`${upload.file.name} guardado correctamente`, true);
      setUploads((previous) => ({ ...previous, [activeTab]: null }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la carga masiva.';
      showToast(message, false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const csv = buildTemplateCSV(activeTab);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `plantilla_${activeTab}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    showToast('Plantilla descargada', true);
  };

  return (
    <div className="bu-layout flex-1">
      <Toast toast={toast} />

      <div className="bu-header-main">
        <div className="bu-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Importación de Datos
        </div>
        <div className="bu-title-row">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--url-navy-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <h1>Importación de Expedientes Docentes</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p className="bu-subtitle-main">
            Sube y procesa la información académica y evaluaciones del personal docente.
          </p>
          <button className="bu-btn-download" onClick={handleDownload}>
            <IconDownload />
            Descargar Plantilla
          </button>
        </div>
      </div>

      <div className="bu-toggle-container">
        <div className="bu-toggle-bg">
          {TABS.map((item) => {
            const Icon = TAB_ICONS[item.key];
            return (
              <button
                key={item.key}
                className={`bu-toggle-btn ${activeTab === item.key ? "active" : ""}`}
                onClick={() => setActiveTab(item.key)}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="bu-main-content">
        <div className="bu-card">
          <div className="bu-card-header">
            <h3>{tab.title}</h3>
            <p>{tab.subtitle}</p>
          </div>
          
          <div className="bu-card-body">
            <h4 className="bu-card-title">{tab.cardTitle}</h4>
            <p className="bu-card-sub">{tab.cardSub}</p>
            {upload ? (
              <FileTag
                uploaded={upload}
                onRemove={() =>
                  setUploads((previous) => ({
                    ...previous,
                    [activeTab]: null,
                  }))
                }
              />
            ) : (
              <DropZone onFile={handleFile} />
            )}
          </div>
        </div>

        {upload && (
          <DataPreview
            uploaded={upload}
            saveLabel={tab.saveLabel}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
      </main>
    </div>
  );
}