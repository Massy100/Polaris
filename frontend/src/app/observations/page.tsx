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
  const [stats, setStats] = useState({
    total_evals: 0,
    avg_score: 0,
    active_teachers: 0,
    recent_evaluations: []
  });
  const [showEvalModal, setShowEvalModal] = useState(false);
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
        if (data.current_semester) {
          setConfig(prev => ({ ...prev, semester: data.current_semester }));
        }
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/templates/stats/`);
      const data = await res.json();
      if (data.ok) {
        setStats({
          total_evals: data.total_evals,
          avg_score: data.avg_score,
          active_teachers: data.active_teachers,
          recent_evaluations: data.recent_evaluations
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchResources();
    fetchStats();
  }, [fetchResources, fetchStats]);

  const handleTeacherChange = (teacherId: string) => {
    const teacher = resources.teachers.find(t => String(t.teacher_id) === teacherId);
    if (teacher) {
      setAvailableSections(teacher.sections);
      const firstSection = teacher.sections.length > 0 ? teacher.sections[0] : null;
      setConfig(prev => ({
        ...prev,
        teacher_id: teacherId,
        course_id: firstSection ? String(firstSection.course_id) : '',
        section: firstSection ? firstSection.section_code : '',
        semester: prev.semester || (firstSection ? firstSection.period_name : '')
      }));
    } else {
      setAvailableSections([]);
      setConfig(prev => ({ ...prev, teacher_id: teacherId, course_id: '', section: '', semester: '' }));
    }
  };

  const handleSectionChange = (sectionId: string) => {
    const section = availableSections.find(s => String(s.section_id) === sectionId);
    if (section) {
      setConfig(prev => ({
        ...prev,
        course_id: String(section.course_id),
        section: section.section_code,
        semester: section.period_name !== 'Periodo General' ? section.period_name : prev.semester
      }));
    }
  };

  const handleStartEvaluation = () => {
    if (!config.teacher_id || !config.template_id || !config.semester || !config.section) {
      showToast('Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    const teacher = resources.teachers.find(t => String(t.teacher_id) === config.teacher_id);
    const sectionData = availableSections.find(s => String(s.course_id) === config.course_id);

    const params = new URLSearchParams({
      teacher_id: config.teacher_id,
      teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : '',
      template_id: config.template_id,
      course_id: config.course_id,
      course_name: sectionData?.course_name || '',
      section: config.section,
      semester: config.semester,
      period: config.period,
    });

    router.push(`/observations/evaluate?${params.toString()}`);
  };

  return (
    <div className="url-page-bg min-h-screen">
      {toast && (
        <div className={`url-toast url-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <main className="url-container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
        <div className="obs-new-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div className="url-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--url-navy-light)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              Evaluación Continua
            </div>
            <h1 className="url-page-title" style={{ margin: 0 }}>Gestión de Observaciones</h1>
            <p className="url-page-sub" style={{ marginTop: '4px' }}>Monitoreo de desempeño en aula y acompañamiento docente.</p>
          </div>
          
          <button className="url-btn url-btn-primary url-btn-lg" onClick={() => setShowEvalModal(true)} style={{ boxShadow: 'var(--url-shadow-md)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '10px' }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva Evaluación
          </button>
        </div>

        <div className="obs-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div className="url-card" style={{ padding: '24px' }}>
             <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--url-text-muted)', marginBottom: '8px' }}>Total Observaciones</p>
             <h2 style={{ fontSize: '32px', margin: 0, color: 'var(--url-navy)' }}>{stats.total_evals}</h2>
             <p style={{ fontSize: '11px', color: 'var(--url-success)', marginTop: '4px', fontWeight: 700 }}>Actividad acumulada</p>
          </div>
          <div className="url-card" style={{ padding: '24px' }}>
             <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--url-text-muted)', marginBottom: '8px' }}>Nota Promedio</p>
             <h2 style={{ fontSize: '32px', margin: 0, color: 'var(--url-navy)' }}>{stats.avg_score.toFixed(2)}</h2>
             <p style={{ fontSize: '11px', color: 'var(--url-text-muted)', marginTop: '4px' }}>Escala de 1 - 5.0</p>
          </div>
          <div className="url-card" style={{ padding: '24px' }}>
             <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--url-text-muted)', marginBottom: '8px' }}>Docentes Activos</p>
             <h2 style={{ fontSize: '32px', margin: 0, color: 'var(--url-navy)' }}>{stats.active_teachers}</h2>
             <p style={{ fontSize: '11px', color: 'var(--url-info)', marginTop: '4px', fontWeight: 700 }}>Personal evaluable</p>
          </div>
          <div className="url-card" style={{ padding: '24px' }}>
             <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--url-text-muted)', marginBottom: '8px' }}>Efectividad</p>
             <h2 style={{ fontSize: '32px', margin: 0, color: '#f59e0b' }}>{((stats.avg_score / 5) * 100).toFixed(0)}%</h2>
             <p style={{ fontSize: '11px', color: 'var(--url-text-muted)', marginTop: '4px' }}>Cumplimiento global</p>
          </div>
        </div>

        <div className="obs-dashboard-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          <div className="url-card" style={{ padding: '0', overflow: 'hidden' }}>
             <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--url-border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Historial Reciente</h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--url-navy-light)', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Ver todo</button>
             </div>
             {stats.recent_evaluations.length > 0 ? (
               <div style={{ padding: '10px 0' }}>
                 {stats.recent_evaluations.map((evalItem: any) => (
                   <div key={evalItem.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--url-border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '14px' }}>{evalItem.teacher_name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--url-text-muted)', margin: 0 }}>{evalItem.template_name} • {new Date(evalItem.date).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '13px', 
                          fontWeight: 800,
                          backgroundColor: evalItem.score >= 4 ? 'var(--url-success-bg)' : evalItem.score >= 3 ? 'var(--url-gold-glow)' : 'var(--url-danger-bg)',
                          color: evalItem.score >= 4 ? 'var(--url-success)' : evalItem.score >= 3 ? 'var(--url-gold)' : 'var(--url-danger)',
                        }}>
                          {evalItem.score.toFixed(2)}
                        </span>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <p style={{ color: 'var(--url-text-muted)', fontSize: '14px' }}>Aún no hay evaluaciones registradas en este período.</p>
               </div>
             )}
          </div>

          <div className="url-card" style={{ padding: '24px' }}>
             <h3 style={{ margin: '0 0 20px 0', fontSize: '16px' }}>Próximas Evaluaciones</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--url-text-muted)', fontStyle: 'italic' }}>No hay sesiones programadas para las próximas 24 horas.</p>
             </div>
          </div>
        </div>

        <Modal 
          open={showEvalModal} 
          title="Configurar Sesión de Observación"
          onClose={() => setShowEvalModal(false)}
          width={500}
        >
          <div className="obs-modal-form">
            <div className="url-field">
              <label>Docente a Evaluar *</label>
              <select className="url-input" value={config.teacher_id} onChange={e => handleTeacherChange(e.target.value)}>
                <option value="">Seleccionar docente...</option>
                {resources.teachers.map(t => (
                  <option key={t.teacher_id} value={t.teacher_id}>{t.first_name} {t.last_name} ({t.code})</option>
                ))}
              </select>
            </div>

            {availableSections.length > 1 && (
              <div className="url-field">
                <label>Cambiar Curso/Sección (Opcional)</label>
                <select 
                  className="url-input" 
                  onChange={e => handleSectionChange(e.target.value)} 
                  value={availableSections.find(s => s.section_code === config.section && String(s.course_id) === config.course_id)?.section_id || ''}
                >
                  {availableSections.map(s => (
                    <option key={s.section_id} value={s.section_id}>
                      {s.course_name} ({s.section_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="url-field">
              <label>Asignatura / Curso</label>
              <input 
                className="url-input" 
                value={availableSections.find(s => String(s.course_id) === config.course_id)?.course_name || ''} 
                placeholder="Se autocompleta al seleccionar docente/sección"
                readOnly
                style={{ background: '#f8fafc' }}
              />
            </div>

            <div className="obs-form-row">
              <div className="url-field">
                <label>Sección *</label>
                <input className="url-input" placeholder="Ej: A, B" value={config.section} onChange={e => setConfig({...config, section: e.target.value})} />
              </div>
              <div className="url-field">
                <label>Ciclo / Semestre *</label>
                <input 
                  className="url-input" 
                  value={config.semester} 
                  onChange={e => setConfig({...config, semester: e.target.value})} 
                />
              </div>
            </div>

            <div className="obs-form-row">
              <div className="url-field">
                <label>Hora de la Clase</label>
                <input 
                  className="url-input" 
                  type="time" 
                  value={config.period} 
                  onChange={e => setConfig({...config, period: e.target.value})} 
                />
              </div>
              <div className="url-field">
                <label>Fecha de Observación</label>
                <input className="url-input" type="date" value={config.date} disabled style={{ background: '#f8fafc' }} />
              </div>
            </div>

            <div className="url-field">
              <label>Instrumento / Plantilla *</label>
              <select className="url-input" value={config.template_id} onChange={e => setConfig({...config, template_id: e.target.value})}>
                <option value="">Seleccionar formato...</option>
                {resources.templates.map(t => (
                  <option key={t.template_id} value={t.template_id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="obs-modal-actions" style={{ marginTop: '20px' }}>
              <button className="url-btn url-btn-secondary" onClick={() => setShowEvalModal(false)}>Cerrar</button>
              <button className="url-btn url-btn-primary" onClick={handleStartEvaluation}>
                Comenzar Evaluación
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
