'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CriterionItem from "../components/criterion-item";
import AddCategoryModal from "../components/add-category-modal";
import VisualDistribution from "../components/visual-distribution";
import CalcExample from "../components/calc-example";
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
  const router = useRouter();
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

  const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  const handleAddCategory = (name: string, description: string) => {
    const categoryName = name.trim();

    const alreadyExists = criteria.some(
      (c) => normalizeText(c.name) === normalizeText(categoryName)
    );

    if (alreadyExists) {
      addToast("Ya existe una categoría con ese nombre.", "warning");
      return;
    }

    setCriteria((prev) => [
      ...prev,
      {
        criterion_id: nextId,
        name: categoryName,
        description,
        percentage: 0,
      },
    ]);

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
    return criteria.map((c) => ({
      criterion_id: c.criterion_id,  
      percentage: c.percentage,
      name: c.name,
      description: c.description,
    }));
  }

  const handleSave = async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    setError(null);

    try {
      let configId = activeConfigId;

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

        if (!createResponse.ok) throw new Error('Error al crear la configuración');
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

        if (!updateResponse.ok) throw new Error('Error al actualizar la configuración');
        addToast("Configuración guardada y activada correctamente.", "success");
        await loadCriteria();
      }
    } catch (err) {
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

      if (!response.ok) throw new Error('Error al crear la configuración');
      const newConfig = await response.json();
      setActiveConfigId(newConfig.weight_config_id);
      addToast("Nueva configuración creada y activada correctamente.", "success");
      await loadCriteria();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la configuración');
      addToast("Error al crear la configuración.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className="wc-layout">
        <div className="wc-loading">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="wc-layout">
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

      <div className="wc-header">
        <button onClick={() => router.push('/settings')} className="settings-back-btn" style={{ marginBottom: '16px', background: 'none', border: 'none', color: 'var(--url-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Configuración
        </button>
        <div className="wc-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ADMINISTRACIÓN / EVALUACIONES
        </div>
        <h1 className="wc-title">Sistema de Evaluación Docente</h1>
        <p className="wc-subtitle">Módulo de administración para configurar los criterios de evaluación y fórmulas del sistema.</p>
      </div>

      {error && (
        <div className="wc-danger-zone">
          <div className="wc-danger-info">
            <h3>Error del Sistema</h3>
            <p>{error}</p>
          </div>
          <button className="wc-btn-ghost" onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      <div className="wc-panel">
        <div className="wc-panel-header">
          <div className="wc-panel-title">
            <div className="wc-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div>
              <h2>Configuración de Pesos y Fórmulas</h2>
              <p>Define los porcentajes que componen la evaluación final del docente</p>
            </div>
          </div>
          {activeConfigId && (
            <span className="wc-status-badge success">Configuración Activa</span>
          )}
        </div>

        <div className="wc-summary-section">
          <p className="wc-summary-text">La suma de los porcentajes debe ser exactamente 100%. Porcentaje actual configurado:</p>
          <div className="wc-summary-value-wrapper">
            <span className={`wc-summary-value ${isValid ? "correct" : "incorrect"}`}>
              {totalPercentage}%
            </span>
            {!isValid && (
              <span className="wc-summary-hint">
                {diff > 0 ? `(Falta ${diff}%)` : `(Sobra ${Math.abs(diff)}%)`}
              </span>
            )}
          </div>
        </div>

        <div className="wc-panel-body">
          <div className="wc-criteria-top">
            <div className="wc-category-label">
              <div className="wc-category-dot" />
              Criterios de Evaluación
            </div>
            <button className="wc-btn-ghost" onClick={() => setShowModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Agregar Categoría
            </button>
          </div>

          <div className="wc-criteria-list">
            {criteria.length === 0 ? (
              <div className="wc-empty-state">No hay criterios de evaluación configurados. Agrega uno para comenzar.</div>
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
        </div>

        <div className="wc-panel-footer">
          <div className="wc-footer-left">
            <button className="wc-btn-ghost" onClick={handleResetRequest}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Restablecer
            </button>
            {!activeConfigId && criteria.length > 0 && isValid && (
              <button className="wc-btn-ghost" onClick={handleCreateNew} disabled={isSaving}>
                {isSaving ? 'Procesando...' : 'Crear Nueva Configuración'}
              </button>
            )}
          </div>
          <button
            className={`wc-btn-primary ${isValid && !isSaving ? "enabled" : "disabled"}`}
            onClick={handleSave}
            disabled={!isValid || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {criteria.length > 0 && (
        <div className="wc-visuals-grid">
          <VisualDistribution criteria={criteria.map(c => ({ ...c, id: c.criterion_id }))} />
          <CalcExample criteria={criteria.map(c => ({ ...c, id: c.criterion_id }))} />
        </div>
      )}

      <Modal open={showResetConfirm} title="Revertir configuración" onClose={() => setShowResetConfirm(false)} width={480}>
        <div className="wc-confirm-content">
          <p className="wc-confirm-text">
            Esta acción restablecerá todos los criterios y porcentajes a sus <strong>valores predeterminados</strong>.
            Cualquier cambio no guardado se perderá irremediablemente.
          </p>
          <div className="wc-modal-actions">
            <button className="wc-btn-ghost" type="button" onClick={() => setShowResetConfirm(false)}>Cancelar</button>
            <button className="wc-btn-danger" type="button" onClick={handleResetConfirm}>Sí, restablecer</button>
          </div>
        </div>
      </Modal>

      {showModal && (
        <AddCategoryModal
          onClose={() => setShowModal(false)}
          onAdd={handleAddCategory}
        />
      )}
    </div>
  );
}