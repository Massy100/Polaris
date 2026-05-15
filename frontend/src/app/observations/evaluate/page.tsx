'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import './styles/evaluate.css';

interface Question {
  question_id: number;
  text: string;
  question_type: string;
}

interface Dimension {
  dimension_id: number;
  name: string;
  weight: number;
  questions: Question[];
}

interface TemplateDetail {
  ok: boolean;
  template_id: number;
  name: string;
  dimensions: Dimension[];
}

function EvaluationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const teacherId = searchParams.get('teacher_id');
  const teacherName = searchParams.get('teacher_name');
  const templateId = searchParams.get('template_id');
  const courseId = searchParams.get('course_id');
  const courseName = searchParams.get('course_name');
  const section = searchParams.get('section');
  const semester = searchParams.get('semester');
  const period = searchParams.get('period');

  const [templateDetail, setTemplateDetail] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/templates/${templateId}/`);
      const data = await res.json();
      if (data.ok) {
        setTemplateDetail(data);
      }
    } catch (error) {
      showToast('Error al cargar la plantilla.', 'error');
    } finally {
      setLoading(false);
    }
  }, [API_URL, templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleAnswerChange = (qId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = async () => {
    if (!templateDetail) return;
    
    const totalQuestions = templateDetail.dimensions.reduce((acc, dim) => acc + dim.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    
    if (answeredQuestions < totalQuestions) {
       if (!confirm('Aún hay preguntas sin responder. ¿Deseas finalizar la evaluación de todos modos?')) {
           return;
       }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        teacher_id: teacherId,
        template_id: templateId,
        course_id: courseId,
        semester: semester,
        section: section,
        period: period,
        observations: observations,
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
        showToast('Evaluación guardada exitosamente.', 'success');
        setTimeout(() => router.push('/observations'), 1500);
      } else {
        showToast(data.message || 'Error al guardar.', 'error');
      }
    } catch (error) {
      showToast('Error de conexión.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalQuestions = templateDetail?.dimensions.reduce((acc, dim) => acc + dim.questions.length, 0) || 0;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  if (loading) {
    return (
      <div className="eval-loading-screen-centered">
        <div className="eval-loading-content">
          <div className="url-loading-spinner-lg"></div>
          <p className="eval-loading-text">Preparando entorno de evaluación</p>
          <div className="eval-loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eval-page">
      {toast && <div className={`url-toast url-toast--${toast.type}`}>{toast.msg}</div>}
      
      {/* Dynamic Progress Bar */}
      <div className="eval-progress-container">
        <div className="eval-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <header className="eval-header-high-end">
        <div className="eval-header-content-wide">
          <div className="eval-header-left-side">
            <button className="eval-back-circle-btn" onClick={() => router.back()} title="Regresar">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="eval-brand-titles">
              <div className="eval-brand-badge">SGA POLARIS</div>
              <h1 className="eval-template-name">{templateDetail?.name}</h1>
            </div>
          </div>

          <div className="eval-context-info">
             <div className="eval-info-block">
                <span className="eval-info-tag">EVALUADO</span>
                <span className="eval-info-main">{teacherName}</span>
             </div>
             <div className="eval-info-sep"></div>
             <div className="eval-info-block">
                <span className="eval-info-tag">ASIGNATURA</span>
                <span className="eval-info-main">{courseName} <strong className="eval-sec-label">SECCIÓN {section}</strong></span>
             </div>
          </div>

          <div className="eval-action-hub">
            <div className="eval-stats-pill">
               <span className="eval-stats-val">{answeredQuestions} / {totalQuestions}</span>
               <span className="eval-stats-label">COMPLETADO</span>
            </div>
            <button className="eval-btn-finish-premium" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Finalizar Evaluación'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="eval-content-flow">
        <div className="eval-container-narrow">
          {templateDetail?.dimensions.map((dim, dIdx) => (
            <section key={dim.dimension_id} className="eval-section-card">
              <div className="eval-section-header">
                <div className="eval-section-number">{dIdx + 1}</div>
                <div className="eval-section-title-box">
                  <h2>{dim.name}</h2>
                  <p>Criterios de evaluación para esta dimensión académica.</p>
                </div>
                <div className="eval-section-weight">
                  <span className="weight-val">{dim.weight}%</span>
                  <span className="weight-label">Peso</span>
                </div>
              </div>
              
              <div className="eval-questions-list">
                {dim.questions.map((q, qIdx) => (
                  <div key={q.question_id} className="eval-question-row">
                    <div className="eval-question-info">
                       <span className="eval-q-idx">{qIdx + 1}.</span>
                       <p className="eval-question-text">{q.text}</p>
                    </div>
                    
                    <div className="eval-question-control">
                      {(() => {
                        const type = q.question_type.toLowerCase();
                        
                        if (type === 'likert' || type === 'escala') {
                          return (
                            <div className="eval-likert-premium">
                              {[1, 2, 3, 4, 5].map((v) => (
                                <button
                                  key={v}
                                  className={`eval-likert-circle v-${v} ${answers[q.question_id] === v ? 'active' : ''}`}
                                  onClick={() => handleAnswerChange(q.question_id, v)}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          );
                        }

                        if (type === 'boolean' || type === 'binary' || type === 'si_no') {
                          return (
                            <div className="eval-binary-premium">
                              <button 
                                className={`eval-bin-opt yes ${answers[q.question_id] === 5 ? 'active' : ''}`}
                                onClick={() => handleAnswerChange(q.question_id, 5)}
                              >
                                SÍ
                              </button>
                              <button 
                                className={`eval-bin-opt no ${answers[q.question_id] === 1 ? 'active' : ''}`}
                                onClick={() => handleAnswerChange(q.question_id, 1)}
                              >
                                NO
                              </button>
                            </div>
                          );
                        }

                        return (
                          <textarea
                            className="url-input"
                            placeholder="Describa sus observaciones..."
                            rows={3}
                            value={answers[q.question_id] || ''}
                            onChange={(e) => handleAnswerChange(q.question_id, e.target.value)}
                          />
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="eval-section-card">
            <div className="eval-section-header">
              <div className="eval-section-number"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
              <div className="eval-section-title-box">
                <h2>Conclusiones Finales</h2>
                <p>Resumen general y recomendaciones para el docente.</p>
              </div>
            </div>
            <div style={{ padding: '32px' }}>
                <textarea 
                  className="url-input" 
                  rows={5} 
                  placeholder="Escriba aquí sus recomendaciones finales..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
            </div>
          </section>

          <div className="eval-finish-zone">
             <button className="url-btn url-btn-lg" style={{ background: 'white', border: '1px solid var(--url-border)', color: 'var(--url-text-sec)' }} onClick={() => router.back()}>Cancelar Evaluación</button>
             <button className="url-btn url-btn-primary url-btn-lg" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Procesando...' : 'Finalizar y Guardar Cambios'}
             </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .eval-page {
          background: var(--url-surface);
          min-height: 100vh;
          font-family: var(--url-font-sans);
        }

        /* Centered Loading Screen with Animation */
        .eval-loading-screen-centered {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--url-white);
          animation: eval-fade-in 0.6s ease-out;
        }
        .eval-loading-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .eval-loading-text {
          font-size: 18px;
          font-weight: 700;
          color: var(--url-navy);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .eval-loading-dots span {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--url-navy-light);
          margin: 0 3px;
          animation: eval-dots 1.4s infinite;
        }
        .eval-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .eval-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes eval-dots {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes eval-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* High-End Header */
        .eval-header-high-end {
          background: var(--url-white);
          border-bottom: 1px solid var(--url-border-soft);
          padding: 16px 0;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }
        .eval-header-content-wide {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
        }
        .eval-header-left-side {
          display: flex;
          align-items: center;
          gap: 24px;
          flex: 1;
        }
        .eval-back-circle-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid var(--url-border);
          background: var(--url-surface);
          color: var(--url-navy-light);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.24s var(--url-ease);
        }
        .eval-back-circle-btn:hover { 
          background: var(--url-navy); 
          color: white; 
          border-color: var(--url-navy);
          transform: scale(1.05);
        }

        .eval-brand-titles {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .eval-brand-badge {
          font-size: 9px;
          font-weight: 800;
          color: var(--url-gold);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .eval-template-name {
          font-size: 20px;
          font-weight: 800;
          color: var(--url-navy);
          margin: 0;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 400px;
        }

        .eval-context-info {
          display: flex;
          align-items: center;
          gap: 40px;
          background: var(--url-surface-2);
          padding: 8px 24px;
          border-radius: 12px;
          border: 1px solid var(--url-border-soft);
        }
        .eval-info-block {
          display: flex;
          flex-direction: column;
        }
        .eval-info-tag {
          font-size: 8px;
          font-weight: 700;
          color: var(--url-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 2px;
        }
        .eval-info-main {
          font-size: 13px;
          font-weight: 700;
          color: var(--url-navy);
          white-space: nowrap;
        }
        .eval-sec-label {
          color: var(--url-gold);
          font-weight: 800;
          margin-left: 6px;
        }
        .eval-info-sep {
          width: 1px;
          height: 24px;
          background: var(--url-border);
        }

        .eval-action-hub {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .eval-stats-pill {
          text-align: right;
        }
        .eval-stats-val {
          display: block;
          font-size: 16px;
          font-weight: 800;
          color: var(--url-navy-light);
          line-height: 1;
        }
        .eval-stats-label {
          font-size: 9px;
          font-weight: 700;
          color: var(--url-text-muted);
          letter-spacing: 0.05em;
        }

        .eval-btn-finish-premium {
          background: var(--url-navy);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.24s var(--url-ease);
          box-shadow: 0 4px 12px rgba(13, 31, 78, 0.15);
        }
        .eval-btn-finish-premium:hover {
          background: var(--url-navy-light);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(13, 31, 78, 0.2);
        }
        .eval-btn-finish-premium:disabled {
          background: var(--url-border);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Progress Bar */
        .eval-progress-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: transparent;
          z-index: 1100;
        }
        .eval-progress-bar {
          height: 100%;
          background: var(--url-gold);
          box-shadow: 0 0 8px var(--url-gold-glow);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Layout */
        .eval-content-flow {
          padding: 60px 24px 100px;
          max-width: 1300px;
          margin: 0 auto;
        }
        .eval-container-narrow {
          max-width: 880px;
          margin: 0 auto;
        }

        /* Section Cards */
        .eval-section-card {
          background: var(--url-white);
          border-radius: 20px;
          border: 1px solid var(--url-border-soft);
          box-shadow: var(--url-shadow-sm);
          margin-bottom: 40px;
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .eval-section-header {
          padding: 32px 40px;
          display: flex;
          align-items: center;
          gap: 28px;
          background: linear-gradient(180deg, var(--url-surface) 0%, var(--url-white) 100%);
          border-bottom: 1px solid var(--url-border-soft);
        }
        .eval-section-number {
          background: var(--url-navy);
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
          box-shadow: 0 4px 10px rgba(13, 31, 78, 0.2);
        }
        .eval-section-title-box h2 {
          font-size: 20px;
          margin: 0 0 2px 0;
          color: var(--url-navy);
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .eval-section-title-box p {
          font-size: 13.5px;
          color: var(--url-text-muted);
          margin: 0;
        }
        .eval-section-weight {
          margin-left: auto;
          text-align: right;
        }
        .weight-val { 
          font-size: 24px; 
          font-weight: 900; 
          color: var(--url-navy-light); 
          display: block; 
          line-height: 1; 
        }
        .weight-label { 
          font-size: 10px; 
          font-weight: 800; 
          color: var(--url-text-muted); 
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Questions List */
        .eval-questions-list {
          padding: 0 40px;
        }
        .eval-question-row {
          padding: 40px 0;
          border-bottom: 1px solid var(--url-border-soft);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .eval-question-row:last-child { border-bottom: none; }
        
        .eval-question-info {
          display: flex;
          gap: 16px;
        }
        .eval-q-idx { 
          font-weight: 800; 
          color: var(--url-border); 
          font-size: 20px; 
          line-height: 1.2; 
        }
        .eval-question-text {
          font-size: 17px;
          font-weight: 600;
          line-height: 1.5;
          color: var(--url-text-pri);
          margin: 0;
          letter-spacing: -0.01em;
        }

        /* Controls Area */
        .eval-question-control {
          padding-left: 36px;
        }

        .eval-likert-premium {
          display: flex;
          gap: 12px;
        }
        .eval-likert-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 2px solid var(--url-border);
          background: var(--url-white);
          font-weight: 800;
          font-size: 17px;
          color: var(--url-text-muted);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .eval-likert-circle:hover { 
          border-color: var(--url-navy-light); 
          color: var(--url-navy-light);
          transform: scale(1.1);
        }
        .eval-likert-circle.active { 
          border-color: var(--url-navy); 
          background: var(--url-navy); 
          color: white; 
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(13, 31, 78, 0.2);
        }
        
        .eval-binary-premium {
          display: flex;
          gap: 16px;
        }
        .eval-bin-opt {
          width: 120px;
          padding: 14px;
          border-radius: 12px;
          border: 2px solid var(--url-border);
          background: var(--url-white);
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .eval-bin-opt.yes:hover { border-color: var(--url-success); color: var(--url-success); }
        .eval-bin-opt.no:hover { border-color: var(--url-danger); color: var(--url-danger); }
        .eval-bin-opt.yes.active { background: var(--url-success); border-color: var(--url-success); color: white; }
        .eval-bin-opt.no.active { background: var(--url-danger); border-color: var(--url-danger); color: white; }

        /* Finish Area */
        .eval-finish-zone {
          display: flex;
          justify-content: center;
          gap: 24px;
          padding: 60px 0;
          border-top: 1px solid var(--url-border);
        }

        /* Generic URL Loading (Fallback) */
        .url-loading-spinner-lg {
          width: 48px;
          height: 48px;
          border: 4px solid var(--url-surface-2);
          border-top: 4px solid var(--url-navy-light);
          border-radius: 50%;
          animation: url-spin 1s linear infinite;
        }
        @keyframes url-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense fallback={
      <div className="eval-loading-screen">
        <div className="url-loading-spinner"></div>
        <p>Cargando aplicación...</p>
      </div>
    }>
      <EvaluationContent />
    </Suspense>
  );
}
