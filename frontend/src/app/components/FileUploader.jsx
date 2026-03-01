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
      <span className="icon-folder">📁</span>
      <p className="drop-text">Arrastra tus documentos o haz clic para subir</p>
      <span className="drop-format">Formatos: {accept}</span>
    </div>
  );
};

export default FileUploader;