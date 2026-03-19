"use client";

import React, { useState } from "react";

const FileUploader = ({ onFilesSelected, accept }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const openFilePicker = () => {
    document.getElementById("hidden-file-input")?.click();
  };

  return (
    <div
      className={`dropzone-area ${isDragging ? "active" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={openFilePicker}
    >
      <input
        id="hidden-file-input"
        type="file"
        multiple
        accept={accept}
        onChange={(e) => onFilesSelected(Array.from(e.target.files || []))}
        style={{ display: "none" }}
      />
      <div className="upload-icon-circle">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 16 12 12 8 16" />
          <line x1="12" y1="12" x2="12" y2="21" />
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
        </svg>
      </div>
      <p className="drop-text">Arrastra tu archivo aqui o haz clic para seleccionar</p>
      <span className="drop-format">Formatos soportados: {accept}</span>
      <button
        type="button"
        className="select-file-btn"
        onClick={(e) => {
          e.stopPropagation();
          openFilePicker();
        }}
      >
        Seleccionar Archivo
      </button>
    </div>
  );
};

export default FileUploader;
