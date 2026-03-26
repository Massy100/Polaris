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
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <p className="modal-title">Agregar Nueva Categoría</p>
            <p className="modal-subtitle">Crea un nuevo criterio de evaluación docente</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label className="modal-label">Nombre de la categoría</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Ej: Publicaciones científicas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">Descripción</label>
            <textarea
              className="modal-textarea"
              placeholder="Describe el criterio de evaluación"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-confirm" onClick={handleAdd} disabled={!name.trim()}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;