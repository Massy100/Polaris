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
      const batchesRes = await fetch(`${API_URL}/integrations/bulk-upload/batches/`);
      const batchesData = await batchesRes.json();
      if (batchesData.ok) {
        setBatches(batchesData.results.filter((b: any) => b.category === 'encuestas'));
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
              <div style={{ marginTop: '32px', color: 'var(--url-text-muted)' }}>Cargando historial...</div>
            ) : batches.length > 0 && (
              <div className="batch-list-container">
                <h3 className="batch-list-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Historial de Plantillas ({batches.length})
                </h3>
                {batches.map((batch) => (
                  <div key={batch.batch_id} className="batch-item">
                    <div className="batch-info">
                      <div className="batch-name">{batch.summary?.batch_name || batch.source_filename}</div>
                      <div className="batch-meta">
                        {batch.total_rows} filas • {new Date(batch.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`batch-status ${batch.status === 'processed' ? 'batch-status--processed' : 'batch-status--errors'}`}>
                      {batch.status === 'processed' ? 'Válido' : 'Con Errores'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
