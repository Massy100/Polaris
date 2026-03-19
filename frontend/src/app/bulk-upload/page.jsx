"use client";
import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import Sidebar from '../components/Sidebar';
import '../styles/BulkUpload.css';

export default function BulkUploadPage() {
  const [activeTab, setActiveTab] = useState('titulos');
  const [files, setFiles] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState(null);

  const handleFiles = (newFiles) => {
    setResponseMessage(null);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (name) => {
    setFiles(files.filter((f) => f.name !== name));
  };

  const procesarArchivos = async () => {
    if (!files.length) {
      setResponseMessage({ type: 'error', text: 'Selecciona al menos un archivo antes de procesar.' });
      return;
    }

    const formData = new FormData();
    formData.append('category', activeTab);
    files.forEach((file) => formData.append('files', file));

    setIsSubmitting(true);
    setResponseMessage(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiBaseUrl}/integrations/bulk-upload/`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'No se pudo procesar la carga masiva.');
      }

      const firstBatch = payload.batches?.[0];
      const summary = firstBatch
        ? `Lote ${firstBatch.batch_id}: ${firstBatch.valid_rows} válidas y ${firstBatch.invalid_rows} inválidas.`
        : '';

      setResponseMessage({
        type: 'success',
        text: `${payload.message} ${summary}`.trim(),
      });
    } catch (error) {
      setResponseMessage({
        type: 'error',
        text: error.message || 'Ocurrió un error al enviar los archivos.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabConfig = {
    titulos: {
      sectionTitle: 'Carga de Títulos Académicos',
      sectionSub: 'Sube archivos Excel o CSV con los datos de títulos de cada profesor',
      cardTitle: 'Subir Archivo de Títulos',
      cardDesc: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de títulos',
      formatFields: [
        { key: 'nombre_profesor', desc: 'Nombre completo del profesor' },
        { key: 'email', desc: 'Correo electrónico' },
        { key: 'telefono', desc: 'Número de contacto' },
        { key: 'especialidad', desc: 'Área de especialización' },
        { key: 'grado_academico', desc: 'Máximo grado académico' },
        { key: 'experiencia_años', desc: 'Años de experiencia' },
        { key: 'institucion_actual', desc: 'Institución donde trabaja' },
      ],
    },
    meritos: {
      sectionTitle: 'Carga de Méritos de Profesores',
      sectionSub: 'Sube archivos Excel o CSV con los datos de méritos de cada profesor',
      cardTitle: 'Subir Archivo de Méritos',
      cardDesc: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de méritos',
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
      sectionTitle: 'Carga de Opiniones de Profesores',
      sectionSub: 'Sube archivos Excel o CSV con las opiniones de cada profesor',
      cardTitle: 'Subir Archivo de Opiniones',
      cardDesc: 'Arrastra o selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de opiniones',
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

  const current = tabConfig[activeTab];

  return (
    <div className="page-wrapper">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="top-header">
        <div className="header-brand-row">
          <button className="menu-btn-bulk" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="brand">
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <div>
              <div className="brand-name">Carga Masiva de Datos</div>
              <div className="brand-sub">Sistema de gestión de profesores</div>
            </div>
          </div>
        </div>

        <nav className="tab-nav">
          <button className={`tab-btn ${activeTab === 'titulos' ? 'active' : ''}`} onClick={() => { setActiveTab('titulos'); setFiles([]); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Títulos
          </button>
          <button className={`tab-btn ${activeTab === 'meritos' ? 'active' : ''}`} onClick={() => { setActiveTab('meritos'); setFiles([]); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            Méritos
          </button>
          <button className={`tab-btn ${activeTab === 'opiniones' ? 'active' : ''}`} onClick={() => { setActiveTab('opiniones'); setFiles([]); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Opiniones
          </button>
        </nav>
      </div>

      <div className="content-area">
        <div className="section-header">
          <h1 className="section-title">{current.sectionTitle}</h1>
          <p className="section-sub">{current.sectionSub}</p>
        </div>

        <div className="upload-card">
          <div className="upload-card-header">
            <h2 className="upload-card-title">{current.cardTitle}</h2>
            <p className="upload-card-desc">{current.cardDesc}</p>
          </div>

          <FileUploader onFilesSelected={handleFiles} accept=".xlsx,.xls,.csv" />

          {files.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#1e293b' }}>
                Archivos seleccionados ({files.length})
              </h3>
              {files.map((file, index) => (
                <div key={index} className="file-row">
                  <span style={{ fontSize: '14px', color: '#334155' }}>{file.name}</span>
                  <button onClick={() => removeFile(file.name)} className="remove-btn">✕</button>
                </div>
              ))}
              <button className="process-btn" onClick={procesarArchivos} disabled={isSubmitting}>
                {isSubmitting ? 'Procesando...' : 'Procesar Documentos'}
              </button>
            </div>
          )}

          {responseMessage && (
            <div
              style={{
                marginTop: '16px',
                borderRadius: '10px',
                padding: '12px 16px',
                backgroundColor: responseMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: responseMessage.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${responseMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                fontSize: '14px',
              }}
            >
              {responseMessage.text}
            </div>
          )}
        </div>

        <div className="format-card">
          <div className="format-card-inner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="format-title">Formato esperado del archivo:</span>
          </div>
          <ul className="format-list">
            {current.formatFields.map((field) => (
              <li key={field.key}>
                <span className="format-key">{field.key}:</span> {field.desc}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="page-footer">
        Sistema de Carga Masiva de Datos - Gestión de Profesores
      </footer>
    </div>
  );
}
