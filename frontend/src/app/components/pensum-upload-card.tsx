'use client';

import { useState, useRef } from 'react';
import '../pensum-upload/pensum-upload.css';

interface PensumUploadCardProps {
  onSuccess?: () => void;
}

const PensumUploadCard: React.FC<PensumUploadCardProps> = ({ onSuccess }) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch('http://localhost:8000/api/pensum/upload/', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message || 'Pensum cargado exitosamente', type: 'success' });
        onSuccess?.();
      } else {
        setMessage({ text: data.error || 'Ocurrio un error al procesar el archivo.', type: 'error' });
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
      <p className="puc-subtitle">
        Sube el archivo Excel oficial con los cursos de la carrera. Esta accion solo puede realizarse una vez.
      </p>

      <div
        className={`puc-dropzone ${dragging ? 'puc-dropzone--dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="puc-dropzone-icon">[ ]</div>
        <p className="puc-dropzone-title">
          {loading ? 'Procesando...' : 'Arrastra tu archivo aqui'}
        </p>
        <p className="puc-dropzone-hint">o haz clic para seleccionarlo</p>
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
        <div className={`puc-message puc-message--${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default PensumUploadCard;