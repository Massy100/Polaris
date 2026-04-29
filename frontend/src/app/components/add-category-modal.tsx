"use client";

import { useState } from "react";
import "../styles/add-category-modal.css";

interface AddCategoryModalProps {
  onClose: () => void;
  onAdd: (name: string, description: string) => void;
}

const AddCategoryModal = ({ onClose, onAdd }: AddCategoryModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), description.trim());
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="cat-modal-overlay" onClick={handleOverlayClick}>
      <div className="cat-modal-box">
        <div className="cat-modal-header">
          <div>
            <h2 className="cat-modal-title">Agregar Nueva Categoría</h2>
            <p className="cat-modal-subtitle">Crea un nuevo criterio de evaluación docente</p>
          </div>
          <button className="cat-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="cat-modal-body">
          <div className="cat-modal-field">
            <label className="cat-modal-label">Nombre de la categoría *</label>
            <input
              type="text"
              className="cat-modal-input"
              placeholder="Ej: Publicaciones científicas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="cat-modal-field">
            <label className="cat-modal-label">Descripción</label>
            <textarea
              className="cat-modal-textarea"
              placeholder="Describe en qué consiste este criterio de evaluación"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="cat-modal-footer">
          <button className="cat-btn-ghost" onClick={onClose}>Cancelar</button>
          <button 
            className={`cat-btn-primary ${!name.trim() ? 'disabled' : ''}`} 
            onClick={handleAdd} 
            disabled={!name.trim()}
          >
            Agregar Categoría
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;