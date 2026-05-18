'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import '../pensum/pensum-upload.css';

interface PensumUploadCardProps {
  onSuccess?: () => void;
}

const PensumUploadCard: React.FC<PensumUploadCardProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setMessage({ text: 'Solo se aceptan archivos Excel (.xlsx o .xls)', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/pensum/upload/`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message || 'Pensum cargado exitosamente', type: 'success' });
        
        setTimeout(() => {
          onSuccess?.();
        }, 2000);

      } else {
        setMessage({ text: data.error || 'Ocurrió un error al procesar el archivo.', type: 'error' });
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
    <div className="puc-card">
      <h2 className="puc-title">Carga de Pensum</h2>
      <p className="puc-subtitle">Sube el archivo Excel oficial con la estructura de cursos.</p>

      <div
        className={`puc-dropzone ${dragging ? 'puc-dropzone--dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="puc-dropzone-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <p className="puc-dropzone-title">
          {loading ? 'Procesando archivo...' : 'Arrastra tu archivo aquí'}
        </p>
        <p className="puc-dropzone-hint">o haz clic para seleccionarlo desde tu equipo</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {message && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className={`puc-message puc-message--${message.type}`} style={{ width: '100%' }}>
            {message.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            )}
            {message.text}
          </div>
          
          {message.type === 'success' && (
            <button 
              className="url-btn url-btn-primary" 
              style={{ marginTop: '20px', width: '100%', padding: '12px' }}
              onClick={() => router.push('/settings/maintenance')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Restaurar Pensum
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PensumUploadCard;