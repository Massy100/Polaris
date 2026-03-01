"use client";
import React, { useState } from 'react';
import '../styles/FileUploader.css';

const FileUploader = ({ onFilesSelected, accept }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      className={`dropzone-area ${isDragging ? 'active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('hidden-file-input').click()}
    >
      <input
        id="hidden-file-input"
        type="file"
        multiple
        accept={accept}
        onChange={(e) => onFilesSelected(Array.from(e.target.files))}
        style={{ display: 'none' }}
      />
      <div className="upload-icon-circle">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
      </div>
      <p className="drop-text">Arrastra tu archivo aquí o haz clic para seleccionar</p>
      <span className="drop-format">Formatos soportados: {accept}</span>
      <button
        className="select-file-btn"
        onClick={(e) => { e.stopPropagation(); document.getElementById('hidden-file-input').click(); }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Seleccionar Archivo
      </button>
    </div>
  );
};

export default FileUploader;