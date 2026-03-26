"use client";

import { useState, useEffect } from "react";
import CriterionItem from "../components/criterion-item";
import AddCategoryModal from "../components/add-category-modal";
import VisualDistribution from "../components/visual-distribution";
import CalcExample from "../components/calc-example";
import AdminDashboardPanel from "../components/admin-dashboard-panel";
import "./weights-config.css";

interface Criterion {
  id: number;
  name: string;
  description: string;
  percentage: number;
}

type ToastType = "success" | "warning" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const INITIAL_CRITERIA: Criterion[] = [
  { id: 1, name: "Evaluación de alumnos", description: "Calificación promedio otorgada por los estudiantes", percentage: 40 },
  { id: 2, name: "Grados académicos", description: "Doctorado, Maestría, Licenciatura, etc.", percentage: 30 },
  { id: 3, name: "Autoevaluación del docente", description: "Evaluación realizada por el propio docente", percentage: 20 },
  { id: 4, name: "Evaluación de pares", description: "Observación y evaluación de otros docentes", percentage: 10 },
];

const STORAGE_KEY = "weightsConfig_criteria";

// ─── API helpers (conectar al backend cuando esté listo) ──────────────────────
// Al conectar el backend, reemplaza estas dos funciones con fetch() reales.
// Ejemplo:
//   const fetchCriteria = async (): Promise<Criterion[] | null> => {
//     const res = await fetch("/api/pesos");
//     if (!res.ok) return null;
//     return res.json();
//   };
//
//   const saveCriteria = async (criteria: Criterion[]): Promise<boolean> => {
//     const res = await fetch("/api/pesos", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ criteria }),
//     });
//     return res.ok;
//   };

const fetchCriteria = async (): Promise<Criterion[] | null> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Criterion[];
  } catch {
    return null;
  }
};

const saveCriteria = async (criteria: Criterion[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
    return true;
  } catch {
    return false;
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const WeightsConfig = () => {
  const [criteria, setCriteria] = useState<Criterion[]>(INITIAL_CRITERIA);
  const [nextId, setNextId] = useState<number>(5);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastCounter, setToastCounter] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar criterios al montar (desde localStorage o backend)
  useEffect(() => {
    const loadCriteria = async () => {
      const saved = await fetchCriteria();
      if (saved && saved.length > 0) {
        setCriteria(saved);
        const maxId = Math.max(...saved.map((c) => c.id));
        setNextId(maxId + 1);
      }
      setIsLoading(false);
    };
    loadCriteria();
  }, []);

  const addToast = (message: string, type: ToastType = "success") => {
    const id = toastCounter + 1;
    setToastCounter(id);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

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

  const handleResetRequest = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    setCriteria(INITIAL_CRITERIA);
    setNextId(5);
    const ok = await saveCriteria(INITIAL_CRITERIA);
    if (ok) {
      addToast("Configuración restablecida a los valores predeterminados.", "warning");
    } else {
      addToast("No se pudo restablecer. Intenta de nuevo.", "error");
    }
  };

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    const ok = await saveCriteria(criteria);
    setIsSaving(false);
    if (ok) {
      addToast("Configuración guardada correctamente.", "success");
    } else {
      addToast("Error al guardar. Intenta de nuevo.", "error");
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminDashboardPanel
          userName="Usuario Admin"
          activePath="/WeightsConfig"
          onNavigate={(path: string) => { window.location.href = path; }}
          onLogout={() => { window.location.href = "/"; }}
        />
        <div className="weights-page">
          <div className="weights-inner">
            <div className="weights-loading">Cargando configuración...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminDashboardPanel
        userName="Usuario Admin"
        activePath="/WeightsConfig"
        onNavigate={(path: string) => { window.location.href = path; }}
        onLogout={() => { window.location.href = "/"; }}
      />

      {/* ── Toast container ── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {t.type === "warning" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              )}
              {t.type === "error" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* ── Modal de confirmación de reset ── */}
      {showResetConfirm && (
        <div className="confirm-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <p className="confirm-title">¿Revertir configuración?</p>
            <p className="confirm-desc">
              Esta acción restablecerá todos los criterios y porcentajes a sus <strong>valores predeterminados</strong>. Los cambios no guardados se perderán.
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn-cancel" onClick={() => setShowResetConfirm(false)}>
                Cancelar
              </button>
              <button className="confirm-btn-confirm" onClick={handleResetConfirm}>
                Sí, restablecer
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button className="btn-reset" onClick={handleResetRequest}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Restablecer
            </button>
            <button
              className={`btn-save ${isValid && !isSaving ? "enabled" : ""}`}
              onClick={handleSave}
              disabled={!isValid || isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Guardar Configuración
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {showModal && (
        <AddCategoryModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddCategory}
        />
      )}
    </>
  );
};

export default WeightsConfig;