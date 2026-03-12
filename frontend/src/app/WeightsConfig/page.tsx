"use client";

import { useState } from "react";
import CriterionItem from "../components/CriterionItem";
import AddCategoryModal from "../components/AddCategoryModal";
import VisualDistribution from "../components/VisualDistribution";
import CalcExample from "../components/CalcExample";
import "./WeightsConfig.css";

interface Criterion {
  id: number;
  name: string;
  description: string;
  percentage: number;
}

const INITIAL_CRITERIA: Criterion[] = [
  { id: 1, name: "Evaluación de alumnos", description: "Calificación promedio otorgada por los estudiantes", percentage: 40 },
  { id: 2, name: "Grados académicos", description: "Doctorado, Maestría, Licenciatura, etc.", percentage: 30 },
  { id: 3, name: "Autoevaluación del docente", description: "Evaluación realizada por el propio docente", percentage: 20 },
  { id: 4, name: "Evaluación de pares", description: "Observación y evaluación de otros docentes", percentage: 10 },
];

const WeightsConfig = () => {
  const [criteria, setCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);
  const [nextId, setNextId] = useState<number>(5);
  const [showModal, setShowModal] = useState<boolean>(false);

  const totalPercentage = criteria.reduce((acc, c) => acc + c.percentage, 0);
  const isValid = totalPercentage === 100;
  const diff = 100 - totalPercentage;

  const handlePercentageChange = (id: number, value: number) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, percentage: value } : c)));
  };

  const handleDelete = (id: number) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCategory = (name: string, description: string) => {
    setCriteria((prev) => [...prev, { id: nextId, name, description, percentage: 0 }]);
    setNextId((prev) => prev + 1);
  };

  const handleReset = () => {
    setCriteria(INITIAL_CRITERIA);
  };

  const handleSave = () => {
    if (!isValid) return;
  };

  return (
    <div className="weights-page">
      <div className="weights-inner">

        <div className="weights-page-header">
          <h1 className="weights-title">Sistema de Evaluación Docente</h1>
          <p className="weights-subtitle">Módulo de administración para configurar los criterios de evaluación</p>
        </div>

        <div className="weights-card header-card">
          <div className="header-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <div>
            <p className="header-card-title">Configuración de Pesos y Fórmulas</p>
            <p className="header-card-desc">Define los porcentajes que componen la evaluación final del docente</p>
          </div>
        </div>

        <div className="weights-card summary-card">
          <p className="summary-text">La suma de los porcentajes debe ser 100%. Actualmente:</p>
          <span className={`summary-value ${isValid ? "correct" : "incorrect"}`}>
            {totalPercentage}%
          </span>
          {!isValid && (
            <p className="summary-hint">
              {diff > 0 ? `(Falta ${diff}%)` : `(Sobra ${Math.abs(diff)}%)`}
            </p>
          )}
        </div>

        <div className="weights-card criteria-card">
          <div className="criteria-top">
            <div>
              <p className="criteria-title">Criterios de Evaluación</p>
              <p className="criteria-desc">Ajusta los porcentajes usando los controles deslizantes o ingresando valores directamente</p>
            </div>
            <button className="btn-add" onClick={() => setShowModal(true)}>
              + Agregar Categoría
            </button>
          </div>

          {criteria.map((criterion) => {
            const totalOthers = criteria
              .filter((c) => c.id !== criterion.id)
              .reduce((acc, c) => acc + c.percentage, 0);
            return (
              <CriterionItem
                key={criterion.id}
                id={criterion.id}
                name={criterion.name}
                description={criterion.description}
                percentage={criterion.percentage}
                totalOthers={totalOthers}
                onPercentageChange={handlePercentageChange}
                onDelete={handleDelete}
              />
            );
          })}
        </div>

        <VisualDistribution criteria={criteria} />
        <CalcExample criteria={criteria} />

        <div className="weights-footer">
          <button className="btn-reset" onClick={handleReset}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Restablecer
          </button>
          <button className={`btn-save ${isValid ? "enabled" : ""}`} onClick={handleSave} disabled={!isValid}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Guardar Configuración
          </button>
        </div>
      </div>

      {showModal && (
        <AddCategoryModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddCategory}
        />
      )}
    </div>
  );
};

export default WeightsConfig;