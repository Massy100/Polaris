"use client";

import { useState, useRef, useCallback } from "react";
import AdminDashboardPanel from "../components/admin-dashboard-panel";
import "./bulk-upload.css";

type TabKey = "titulos" | "meritos" | "opiniones" | "encuestas";

interface ParsedRow {
  [key: string]: string | number;
}

interface UploadedFile {
  file: File;
  rows: ParsedRow[];
  columns: string[];
}

interface ToastState {
  visible: boolean;
  message: string;
  success: boolean;
}

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
    key: "titulos",
    label: "Titulos",
    title: "Carga de Titulos Academicos",
    subtitle: "Sube archivos Excel o CSV con los datos de titulos de cada profesor",
    cardTitle: "Subir Archivo de Titulos",
    cardSub: "Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de titulos",
    saveLabel: "Guardar Titulos",
  },
  {
    key: "meritos",
    label: "Meritos",
    title: "Carga de Meritos de Profesores",
    subtitle: "Sube archivos Excel o CSV con los meritos academicos de cada profesor",
    cardTitle: "Subir Archivo de Meritos",
    cardSub: "Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de meritos",
    saveLabel: "Guardar Meritos",
  },
  {
    key: "opiniones",
    label: "Opiniones",
    title: "Carga de Opiniones de Profesores",
    subtitle: "Sube archivos Excel o CSV con las opiniones y evaluaciones de estudiantes",
    cardTitle: "Subir Archivo de Opiniones",
    cardSub: "Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con las opiniones de estudiantes",
    saveLabel: "Guardar Opiniones",
  },
  {
    key: "encuestas",
    label: "Encuestas",
    title: "Carga de Encuestas",
    subtitle: "Sube archivos Excel o CSV con las encuestas que nos proporciona directamente",
    cardTitle: "Subir Archivo de Encuestas",
    cardSub: "Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con las encuestas",
    saveLabel: "Guardar Encuestas",
  },
];

const IconTitulos = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconMeritos = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const IconOpiniones = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconEncuestas = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

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

const TAB_ICONS: Record<TabKey, React.FC> = {
  titulos: IconTitulos,
  meritos: IconMeritos,
  opiniones: IconOpiniones,
  encuestas: IconEncuestas,
};

// TODO: reemplazar con llamada real al backend — POST /api/upload/titulos
function parseCSV(text: string): { rows: ParsedRow[]; columns: string[] } {
  const lines = text.trim().split("\n").filter(Boolean);
  if (!lines.length) return { rows: [], columns: [] };
  const columns = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
  const rows: ParsedRow[] = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    columns.forEach((col, i) => { row[col] = vals[i] ?? ""; });
    return row;
  });
  return { rows, columns };
}

// TODO: reemplazar con parser real de xlsx usando SheetJS o similar
function simulateParse(fileName: string): { rows: ParsedRow[]; columns: string[] } {
  const columns = ["teacher_id", "first_name", "last_name", "detail"];
  const rows: ParsedRow[] = Array.from({ length: 12 }, (_, i) => ({
    teacher_id: i + 1,
    first_name: `Docente ${i + 1}`,
    last_name: `Apellido ${i + 1}`,
    detail: `Registro de ${fileName}`,
  }));
  return { rows, columns };
}

async function parseFile(file: File): Promise<{ rows: ParsedRow[]; columns: string[] }> {
  if (file.name.endsWith(".csv")) {
    const text = await file.text();
    return parseCSV(text);
  }
  return simulateParse(file.name);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      className={`bu-dropzone${dragging ? " bu-dropzone--drag" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="bu-dz-icon-wrap">
        <IconUpload />
      </div>
      <p className="bu-dz-main">Arrastra tu archivo aqui o haz clic para seleccionar</p>
      <p className="bu-dz-sub">Formatos soportados: .xlsx, .xls, .csv</p>
      <button
        type="button"
        className="bu-dz-btn"
        onClick={() => inputRef.current?.click()}
      >
        <IconFile />
        Seleccionar Archivo
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function FileTag({ uploaded, onRemove }: { uploaded: UploadedFile; onRemove: () => void }) {
  return (
    <div className="bu-file-tag">
      <span className="bu-file-tag-check"><IconCheck size={17} /></span>
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
}: {
  uploaded: UploadedFile;
  saveLabel: string;
  onSave: () => void;
}) {
  const { rows, columns } = uploaded;

  return (
    <div className="bu-preview-card">
      <div className="bu-preview-head">
        <div className="bu-preview-head-left">
          <span className="bu-preview-title">Vista Previa de Datos</span>
          <span className="bu-preview-file">Archivo: {uploaded.file.name}</span>
        </div>
        <div className="bu-preview-head-right">
          <span className="bu-preview-count">{rows.length} registros</span>
          <span className="bu-preview-cols">
            {columns.length} {columns.length === 1 ? "columna" : "columnas"}
          </span>
        </div>
      </div>

      <div className="bu-table-wrap">
        <table className="bu-table">
          <thead>
            <tr>
              <th className="bu-th bu-th-num">#</th>
              {columns.map((col) => (
                <th key={col} className="bu-th">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="bu-tr">
                <td className="bu-td bu-td-num">{i + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="bu-td">{String(row[col] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bu-preview-foot">
        <span className="bu-preview-foot-msg">
          Los datos se han procesado correctamente y estan listos para ser guardados
        </span>
      </div>

      <div className="bu-save-row">
        <button className="bu-save-btn" onClick={onSave}>
          <IconFile />
          {saveLabel} ({rows.length})
        </button>
      </div>
    </div>
  );
}

function Toast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null;
  return (
    <div className={`bu-toast ${toast.success ? "bu-toast--ok" : "bu-toast--err"}`}>
      <IconCheck size={15} />
      <span>{toast.message}</span>
    </div>
  );
}

export default function BulkUploadPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("titulos");
  const [uploads, setUploads] = useState<Record<TabKey, UploadedFile | null>>({
    titulos: null,
    meritos: null,
    opiniones: null,
    encuestas: null,
  });
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", success: true });

  const tab = TABS.find((t) => t.key === activeTab)!;
  const upload = uploads[activeTab];

  const showToast = (msg: string, ok: boolean) => {
    setToast({ visible: true, message: msg, success: ok });
    setTimeout(() => setToast((p) => ({ ...p, visible: false })), 3500);
  };

  const handleFile = async (file: File) => {
    try {
      const parsed = await parseFile(file);
      setUploads((p) => ({ ...p, [activeTab]: { file, ...parsed } }));
      showToast("Archivo procesado correctamente", true);
    } catch {
      showToast("Error al procesar el archivo", false);
    }
  };

  // TODO: conectar con endpoint real — POST /api/bulk-upload/:tab con FormData
  const handleSave = () => {
    if (!upload) return;
    showToast(`${upload.rows.length} ${tab.saveLabel.toLowerCase()}(s) guardado(s) correctamente`, true);
  };

  // TODO: conectar con endpoint de descarga de plantilla — GET /api/bulk-upload/template/:tab
  const handleDownload = () => {
    showToast("Descargando plantilla...", true);
  };

  return (
    <div className="bu-root">
      <AdminDashboardPanel
        userName="Coordinador Admin"
        activePath="/carga-masiva"
        onNavigate={(path) => console.log("navigate", path)}
        onLogout={() => console.log("logout")}
      />

      <Toast toast={toast} />

      <header className="bu-header">
        <div className="bu-brand">
          <div className="bu-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="bu-brand-text">
            <span className="bu-brand-name">Carga Masiva de Datos</span>
            <span className="bu-brand-sub">Sistema de gestion de profesores</span>
          </div>
        </div>
        <button className="bu-btn-download" onClick={handleDownload}>
          <IconDownload />
          Descargar
        </button>
      </header>

      <nav className="bu-tabs">
        {TABS.map((t) => {
          const Icon = TAB_ICONS[t.key];
          return (
            <button
              key={t.key}
              className={`bu-tab${activeTab === t.key ? " bu-tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <Icon />
              {t.label}
            </button>
          );
        })}
      </nav>

      <main className="bu-main">
        <div className="bu-section-head">
          <h1 className="bu-h1">{tab.title}</h1>
          <p className="bu-h1-sub">{tab.subtitle}</p>
        </div>

        <div className="bu-card">
          <p className="bu-card-title">{tab.cardTitle}</p>
          <p className="bu-card-sub">{tab.cardSub}</p>
          {upload ? (
            <FileTag
              uploaded={upload}
              onRemove={() => setUploads((p) => ({ ...p, [activeTab]: null }))}
            />
          ) : (
            <DropZone onFile={handleFile} />
          )}
        </div>

        {upload && (
          <DataPreview
            uploaded={upload}
            saveLabel={tab.saveLabel}
            onSave={handleSave}
          />
        )}
      </main>

      <footer className="bu-footer">
        <span>Sistema de Carga Masiva de Datos - Gestion de Profesores</span>
      </footer>
    </div>
  );
}