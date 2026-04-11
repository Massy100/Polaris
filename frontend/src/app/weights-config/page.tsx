// app/WeightsConfig/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CriterionItem from "../components/criterion-item";
import AddCategoryModal from "../components/add-category-modal";
import VisualDistribution from "../components/visual-distribution";
import CalcExample from "../components/calc-example";
import AdminDashboardPanel from "../components/admin-dashboard-panel";
import Modal from '../components/modal';
import "./weights-config.css";

interface Criterion {
  criterion_id: number;  
  name: string;
  description: string;
  percentage: number;
  display_order?: number;
}

type ToastType = "success" | "warning" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface WeightConfig {
  weight_config_id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  criteria: Criterion[];
}

const INITIAL_CRITERIA: Criterion[] = [
  { criterion_id: 1, name: "Evaluación de alumnos", description: "Calificación promedio otorgada por los estudiantes", percentage: 40 },
  { criterion_id: 2, name: "Grados académicos", description: "Doctorado, Maestría, Licenciatura, etc.", percentage: 30 },
  { criterion_id: 3, name: "Autoevaluación del docente", description: "Evaluación realizada por el propio docente", percentage: 20 },
  { criterion_id: 4, name: "Evaluación de pares", description: "Observación y evaluación de otros docentes", percentage: 10 },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function WeightsConfig() {
  const [isMounted, setIsMounted] = useState(false);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [nextId, setNextId] = useState<number>(5);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeConfigId, setActiveConfigId] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toastCounterRef = useRef(0); 

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    toastCounterRef.current += 1;
    const id = toastCounterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const loadCriteria = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/assessment-360/weight-configs/active/`);

      if (!response.ok) {
        if (response.status === 404) {
          setCriteria(INITIAL_CRITERIA);
          setNextId(5);
          setActiveConfigId(null);
          return;
        }
        throw new Error('Error al cargar la configuración');
      }

      const data: WeightConfig = await response.json();
      setActiveConfigId(data.weight_config_id);

      if (data.criteria && data.criteria.length > 0) {
        const transformed = data.criteria.map((item) => ({
          criterion_id: item.criterion_id,  
          name: item.name,
          description: item.description,
          percentage: Number(item.percentage),  
          display_order: item.display_order
        }));
        
        setCriteria(transformed);
        const maxId = Math.max(...transformed.map((c) => c.criterion_id), 0);
        setNextId(maxId + 1);
      } else {
        setCriteria([]);
        setNextId(1);
      }
    } catch (err) {
      console.error('Error loading criteria:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la configuración');
      setActiveConfigId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadCriteria();
    }
  }, [loadCriteria, isMounted]);

  const totalPercentage = criteria.reduce((acc, c) => acc + c.percentage, 0);
  const isValid = totalPercentage === 100;
  const diff = 100 - totalPercentage;

  const handlePercentageChange = (id: number, value: number) => {
    setCriteria((prev) => prev.map((c) => (c.criterion_id === id ? { ...c, percentage: value } : c)));
  };

  const handleDelete = (id: number) => {
    setCriteria((prev) => prev.filter((c) => c.criterion_id !== id));
  };

  const handleAddCategory = (name: string, description: string) => {
    setCriteria((prev) => [...prev, { criterion_id: nextId, name, description, percentage: 0 }]);
    setNextId((prev) => prev + 1);
  };

  const handleResetRequest = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = async () => {
    setShowResetConfirm(false);
    setCriteria(INITIAL_CRITERIA);
    setNextId(5);
    addToast("Configuración restablecida a los valores predeterminados.", "warning");
  };

  
  const buildCriteriaPayload = () =>{
    const payload = criteria.map((c) => ({
      criterion_id: c.criterion_id,  
      percentage: c.percentage,
      name: c.name,
      description: c.description,
    }));
      return payload;
  }



  const handleSave = async () => {
    if (!isValid || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      let configId = activeConfigId;

      const buildErrorMessage = async (response: Response): Promise<string> => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          return JSON.stringify(data);
        }
        return `Error ${response.status}: ${response.statusText}`;
      };

      if (!configId) {
        const createResponse = await fetch(`${API_URL}/assessment-360/weight-configs/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Configuración ${new Date().toLocaleDateString()}`,
            description: 'Configuración de pesos de evaluación',
            status: 'active',
            criteria: buildCriteriaPayload(),
          }),
        });

        if (!createResponse.ok) {
          throw new Error(await buildErrorMessage(createResponse));
        }

        const newConfig = await createResponse.json();
        setActiveConfigId(newConfig.weight_config_id);
        addToast("Configuración guardada y activada correctamente.", "success");
        await loadCriteria();
      } else {
        
        const updateResponse = await fetch(`${API_URL}/assessment-360/weight-configs/${configId}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Configuración ${new Date().toLocaleDateString()}`,
            description: 'Configuración de pesos de evaluación',
            status: 'active',
            criteria: buildCriteriaPayload(),
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(JSON.stringify(errorData));
        }

        addToast("Configuración guardada y activada correctamente.", "success");
        await loadCriteria();
      }
    } catch (err) {
      console.error('Error saving criteria:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración');
      addToast("Error al guardar. Intenta de nuevo.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!isValid) {
      addToast("La suma de porcentajes debe ser 100% antes de crear una nueva configuración.", "warning");
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/assessment-360/weight-configs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Configuración ${new Date().toLocaleDateString()}`,
          description: 'Configuración de pesos de evaluación',
          status: 'active',
          criteria: buildCriteriaPayload(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const newConfig = await response.json();
      setActiveConfigId(newConfig.weight_config_id);
      addToast("Nueva configuración creada y activada correctamente.", "success");
      await loadCriteria();
    } catch (err) {
      console.error('Error creating config:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la configuración');
      addToast("Error al crear la configuración.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || isLoading) {
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

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span className="toast-icon">
              {t.type === "success" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {t.type === "warning" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              )}
              {t.type === "error" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="weights-page">
          <div className="weights-inner">
            <div className="error-message" style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #fecaca'
            }}>
              <strong>Error:</strong> {error}
              <button
                onClick={() => setError(null)}
                style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <Modal
          open={showResetConfirm}
          title="Revertir configuración"
          onClose={() => setShowResetConfirm(false)}
          width={480}
        >
          <div className="modal-content">
            <p className="modal-text">
              Esta acción restablecerá todos los criterios y porcentajes a sus <strong>valores predeterminados</strong>.
              Los cambios no guardados se perderán.
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-ghost"
                type="button"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancelar
              </button>
              <button
                className="modal-btn modal-btn-danger"
                type="button"
                onClick={handleResetConfirm}
              >
                Sí, restablecer
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="weights-page">
        <div className="weights-inner">
          <div className="weights-page-header">
            <h1 className="weights-title">Sistema de Evaluación Docente</h1>
            <p className="weights-subtitle">Módulo de administración para configurar los criterios de evaluación</p>
          </div>

          <div className="weights-card header-card">
            <div className="header-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div>
              <p className="header-card-title">Configuración de Pesos y Fórmulas</p>
              <p className="header-card-desc">Define los porcentajes que componen la evaluación final del docente</p>
              {activeConfigId && (
                <p className="config-status" style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem' }}>
                  ✓ Configuración activa cargada
                </p>
              )}
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

            {criteria.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                No hay criterios de evaluación. Agrega uno para comenzar.
              </div>
            ) : (
              criteria.map((criterion) => {
                const totalOthers = criteria
                  .filter((c) => c.criterion_id !== criterion.criterion_id)
                  .reduce((acc, c) => acc + c.percentage, 0);
                return (
                  <CriterionItem
                    key={criterion.criterion_id}
                    id={criterion.criterion_id}        
                    name={criterion.name}
                    description={criterion.description}
                    percentage={criterion.percentage}
                    totalOthers={totalOthers}
                    onPercentageChange={handlePercentageChange}
                    onDelete={handleDelete}
                  />
                );
              })
            )}
          </div>

          {criteria.length > 0 && (
            <>
              <VisualDistribution criteria={criteria.map(c => ({ ...c, id: c.criterion_id }))} />
              <CalcExample criteria={criteria.map(c => ({ ...c, id: c.criterion_id }))} />
            </>
          )}

          <div className="weights-footer">
            <div className="footer-left">
              <button className="btn-reset" onClick={handleResetRequest}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Restablecer
              </button>
              {!activeConfigId && criteria.length > 0 && isValid && (
                <button className="btn-create" onClick={handleCreateNew} disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Nueva Configuración'}
                </button>
              )}
            </div>
            <button
              className={`btn-save ${isValid && !isSaving ? "enabled" : ""}`}
              onClick={handleSave}
              disabled={!isValid || isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
}