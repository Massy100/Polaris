'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TemplateUploadCard from '../../components/template-upload-card';
import '../../pensum/pensum-upload.css';

export default function TemplatesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/templates/`);
      const data = await res.json();
      if (data.ok) {
        setBatches(data.results);
      }
    } catch (error) {
      console.error('Error fetching templates history:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="url-page-bg flex-1">
      <main className="url-container url-page-main">
        
        <button 
          onClick={() => router.push('/settings')} 
          className="url-back-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"> 
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Configuración
        </button>

        <header style={{ marginBottom: '32px' }}>
          <h1 className="url-page-title">
            Biblioteca de Plantillas
          </h1>
          <p className="url-page-sub">
            Gestione los formatos de evaluación y observación docente disponibles en el sistema.
          </p>
        </header>

        <div className="pensum-content-container">
          <div className="pensum-tab-content">
            <TemplateUploadCard onSuccess={fetchData} />
            
            {loading ? (
              <div className="pup-loading" style={{ minHeight: '200px' }}>
                <div className="pup-loading-spinner"></div>
              </div>
            ) : batches.length > 0 ? (
              <div className="batch-list-container">
                <h3 className="batch-list-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Historial de Biblioteca ({batches.length})
                </h3>
                {batches.map((t) => (
                  <div key={t.template_id} className="batch-item">
                    <div className="batch-info">
                      <div className="batch-name">{t.name}</div>
                      <div className="batch-meta">
                        {t.total_dimensions} dimensiones • {t.total_questions} preguntas • {new Date(t.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="batch-status batch-status--processed">
                      Activo
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="url-empty" style={{ marginTop: '40px' }}>
                <div className="url-icon-chip url-icon-chip--navy" style={{ width: '50px', height: '50px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <h3>Sin plantillas disponibles</h3>
                <p>Aún no has cargado formatos de evaluación para esta carrera.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
