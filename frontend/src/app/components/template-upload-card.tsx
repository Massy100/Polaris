'use client';

import { useState, useRef } from 'react';
import '../pensum/pensum-upload.css';

interface TemplateUploadCardProps {
  onSuccess?: () => void;
}

const TemplateUploadCard: React.FC<TemplateUploadCardProps> = ({ onSuccess }) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const handleFile = async (file: File) => {
    if (!templateName.trim()) {
      setMessage({ text: 'Por favor, asigne un nombre a la plantilla antes de subirla.', type: 'error' });
      return;
    }

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      setMessage({ text: 'Formato inválido. Usa Excel (.xlsx, .xls) o CSV.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('category', 'encuestas'); 
    formData.append('files', file);
    formData.append('batch_name', templateName);

    try {
      const res = await fetch(`${API_URL}/integrations/bulk-upload/`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setMessage({ text: `Plantilla "${templateName}" cargada exitosamente`, type: 'success' });
        setTemplateName('');
        
        setTimeout(() => {
          onSuccess?.();
        }, 2000);

      } else {
        setMessage({ text: data.message || 'Ocurrió un error al procesar el archivo.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'No se pudo conectar con el servidor.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="puc-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 className="puc-title">Carga de Plantilla</h2>
      <p className="puc-subtitle">Sube el archivo de encuestas y observaciones docentes.</p>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="template-name" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>
          Nombre de la Plantilla
        </label>
        <input 
          id="template-name"
          type="text" 
          placeholder="Ej: Plantilla evaluación Compiladores"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--url-navy)'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      <div
        className={`puc-dropzone ${dragging ? 'puc-dropzone--dragging' : ''}`}
        style={{ flex: 1, minHeight: '150px' }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="puc-dropzone-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="puc-dropzone-title">
          {loading ? 'Procesando plantilla...' : 'Arrastra tu archivo aquí'}
        </p>
        <p className="puc-dropzone-hint">o haz clic para seleccionar (Excel o CSV)</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {message && (
        <div className={`puc-message puc-message--${message.type}`}>
          {message.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          )}
          {message.text}
        </div>
      )}
    </div>
  );
};

export default TemplateUploadCard;
