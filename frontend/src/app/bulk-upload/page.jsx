"use client";
import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import '../styles/BulkUpload.css';

export default function BulkUploadPage() {
  const [files, setFiles] = useState([]);

  const handleFiles = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (name) => {
    setFiles(files.filter((f) => f.name !== name));
  };

  const procesarArchivos = () => {
    console.log("Archivos listos para enviar:", files);
    // Aquí irá la conexión con el backend
  };

  return (
    <div className="page-wrapper">
      <div className="header-texts">
        <h1 style={{ color: '#2b3954' }}>Carga Masiva de Documentos</h1>
        <p>Sube los archivos necesarios para el sistema Polaris</p>
      </div>

      <div className="modal-card" style={{ padding: '30px' }}>
        <FileUploader 
          onFilesSelected={handleFiles} 
          accept=".pdf,.csv,.xlsx" 
        />

        {files.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 className="modal-title" style={{ marginBottom: '12px' }}>
              Documentos preparados ({files.length})
            </h3>
            
            <div className="modal-content">
              {files.map((file, index) => (
                <div key={index} className="modal-meta file-row-custom">
                  <span>{file.name}</span>
                  <button 
                    onClick={() => removeFile(file.name)}
                    style={{ background: 'transparent', border: 'none', color: '#ff4545', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button 
              className="modal-btn modal-btn-primary upload-process-btn"
              onClick={procesarArchivos}
            >
              Procesar Documentos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}