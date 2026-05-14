'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '../components/modal';
import './observations.css';

interface SectionData {
  section_id: number;
  section_code: string;
  course_id: number;
  course_name: string;
  period_id: number;
  period_name: string;
}

interface TeacherData {
  teacher_id: number;
  first_name: string;
  last_name: string;
  code: string;
  sections: SectionData[];
}

interface ResourceData {
  teachers: TeacherData[];
  templates: any[];
}

export default function ObservationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<ResourceData>({ teachers: [], templates: [] });
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [activeStep, setActiveStep] = useState<'config' | 'questions'>('config');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [config, setConfig] = useState({
    teacher_id: '',
    course_id: '',
    template_id: '',
    semester: '',
    section: '',
    period: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [availableSections, setAvailableSections] = useState<SectionData[]>([]);
  const [templateDetail, setTemplateDetail] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/templates/resources/`);
      const data = await res.json();
      if (data.ok) {
        setResources({
          teachers: data.teachers,
          templates: data.templates
        });
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleTeacherChange = (teacherId: string) => {
    const teacher = resources.teachers.find(t => String(t.teacher_id) === teacherId);
    if (teacher) {
      setAvailableSections(teacher.sections);
      setConfig({
        ...config,
        teacher_id: teacherId,
        course_id: teacher.sections.length === 1 ? String(teacher.sections[0].course_id) : '',
        section: teacher.sections.length === 1 ? teacher.sections[0].section_code : '',
        semester: teacher.sections.length === 1 ? teacher.sections[0].period_name : '',
      });
    } else {
      setAvailableSections([]);
      setConfig({ ...config, teacher_id: teacherId, course_id: '', section: '', semester: '' });
    }
  };

  const handleSectionChange = (sectionId: string) => {
    const section = availableSections.find(s => String(s.section_id) === sectionId);
    if (section) {
      setConfig({
        ...config,
        course_id: String(section.course_id),
        section: section.section_code,
        semester: section.period_name
      });
    }
  };

  const handleStartEvaluation = async () => {
    if (!config.teacher_id || !config.template_id || !config.semester || !config.section) {
      showToast('Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/templates/${config.template_id}/`);
      const data = await res.json();
      if (data.ok) {
        setTemplateDetail(data);
        setActiveStep('questions');
      }
    } catch (error) {
      showToast('Error al cargar la plantilla.', 'error');
    }
  };

  const handleAnswerChange = (qId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...config,
        answers: Object.entries(answers).map(([id, val]) => ({
          question_id: id,
          value: val
        }))
      };

      const res = await fetch(`${API_URL}/templates/save-evaluation/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        showToast('Evaluación guardada y calificación actualizada.');
        setShowEvalModal(false);
        setActiveStep('config');
        setConfig({
          teacher_id: '',
          course_id: '',
          template_id: '',
          semester: '',
          section: '',
          period: '',
          date: new Date().toISOString().split('T')[0]
        });
        setAnswers({});
        setAvailableSections([]);
      } else {
        showToast(data.message || 'Error al guardar.', 'error');
      }
    } catch (error) {
      showToast('Error de conexión.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="url-page-bg min-h-screen">
      {toast && (
        <div className={`url-toast url-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 className="url-page-title">Observaciones y Evaluaciones</h1>
          <p className="url-page-sub">Gestione las evaluaciones de desempeño docente y observaciones de aula en tiempo real.</p>
        </header>

        <div className="obs-actions">
          <button className="url-btn url-btn-primary url-btn-lg" onClick={() => setShowEvalModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '10px' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Iniciar Nueva Observación
          </button>
        </div>

        <div className="obs-dashboard">
          <div className="url-card obs-summary">
             <h3>Resumen de Actividad</h3>
             <p>Seleccione un docente o inicie una evaluación para ver resultados.</p>
          </div>
        </div>

        <Modal 
          open={showEvalModal} 
          title={activeStep === 'config' ? "Configurar Observación" : `Evaluación: ${templateDetail?.name}`}
          onClose={() => {
            if (!isSubmitting) {
              setShowEvalModal(false);
              setActiveStep('config');
            }
          }}
          width={activeStep === 'config' ? 500 : 800}
        >
          {activeStep === 'config' ? (
            <div className="obs-modal-form">
              <div className="url-field">
                <label>Docente *</label>
                <select className="url-input" value={config.teacher_id} onChange={e => handleTeacherChange(e.target.value)}>
                  <option value="">Seleccionar docente...</option>
                  {resources.teachers.map(t => (
                    <option key={t.teacher_id} value={t.teacher_id}>{t.first_name} {t.last_name} ({t.code})</option>
                  ))}
                </select>
              </div>

              {availableSections.length > 0 && (
                <div className="url-field">
                  <label>Seleccionar Sección de Carga Académica</label>
                  <select className="url-input" onChange={e => handleSectionChange(e.target.value)}>
                    <option value="">-- Seleccionar sección vinculada --</option>
                    {availableSections.map(s => (
                      <option key={s.section_id} value={s.section_id}>
                        {s.course_name} - Sec: {s.section_code} ({s.period_name})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="url-field">
                <label>Curso / Asignatura</label>
                <input 
                  className="url-input" 
                  value={availableSections.find(s => String(s.course_id) === config.course_id)?.course_name || ''} 
                  placeholder="Se autocompleta al seleccionar docente/sección"
                  readOnly
                />
              </div>

              <div className="obs-form-row">
                <div className="url-field">
                  <label>Sección *</label>
                  <input className="url-input" placeholder="Ej: A, B, 01" value={config.section} onChange={e => setConfig({...config, section: e.target.value})} />
                </div>
                <div className="url-field">
                  <label>Semestre *</label>
                  <input className="url-input" value={config.semester} onChange={e => setConfig({...config, semester: e.target.value})} />
                </div>
              </div>

              <div className="obs-form-row">
                <div className="url-field">
                  <label>Hora de Observación</label>
                  <input 
                    className="url-input" 
                    type="time" 
                    value={config.period} 
                    onChange={e => setConfig({...config, period: e.target.value})} 
                  />
                </div>
                <div className="url-field">
                  <label>Fecha</label>
                  <input className="url-input" type="date" value={config.date} disabled />
                </div>
              </div>

              <div className="url-field">
                <label>Plantilla de Evaluación *</label>
                <select className="url-input" value={config.template_id} onChange={e => setConfig({...config, template_id: e.target.value})}>
                  <option value="">Seleccionar formato...</option>
                  {resources.templates.map(t => (
                    <option key={t.template_id} value={t.template_id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="obs-modal-actions">
                <button className="url-btn url-btn-secondary" onClick={() => setShowEvalModal(false)}>Cancelar</button>
                <button className="url-btn url-btn-primary" onClick={handleStartEvaluation}>Siguiente: Preguntas</button>
              </div>
            </div>
          ) : (
            <div className="obs-questions-flow">
              {templateDetail?.dimensions.map((dim: any) => (
                <div key={dim.dimension_id} className="obs-dimension-block">
                  <div className="obs-dim-header">
                    <h4>{dim.name}</h4>
                    <span className="url-badge url-badge-navy">Peso: {dim.weight}%</span>
                  </div>
                  <div className="obs-dim-body">
                    {dim.questions.map((q: any) => (
                      <div key={q.question_id} className="obs-question-item">
                        <p>{q.text}</p>
                        {q.question_type === 'likert' ? (
                          <div className="obs-likert-options">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button 
                                key={v} 
                                className={`obs-likert-btn ${answers[q.question_id] === v ? 'active' : ''}`}
                                onClick={() => handleAnswerChange(q.question_id, v)}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <textarea 
                            className="url-input" 
                            rows={2} 
                            placeholder="Escriba su respuesta..."
                            onChange={e => handleAnswerChange(q.question_id, e.target.value)}
                          ></textarea>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="obs-modal-actions" style={{ marginTop: '30px', borderTop: '1px solid var(--url-border-soft)', paddingTop: '20px' }}>
                <button className="url-btn url-btn-secondary" onClick={() => setActiveStep('config')} disabled={isSubmitting}>Volver</button>
                <button className="url-btn url-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Finalizar Evaluación'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
