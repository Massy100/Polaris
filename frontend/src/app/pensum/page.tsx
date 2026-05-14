'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PensumUploadCard from '../components/pensum-upload-card';
import './pensum-upload.css';

export default function PensumPage() {
  const router = useRouter();
  const [pensumLoaded, setPensumLoaded] = useState<boolean | null>(null);
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pensumRes = await fetch(`${API_URL}/pensum/status/`);
      const pensumData = await pensumRes.json();
      setPensumLoaded(pensumData.is_loaded);
      setTotalCourses(pensumData.total_courses || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPensumLoaded(false);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && pensumLoaded === null) {
    return (
      <div className="pup-loading">
        <div className="pup-loading-spinner"></div>
        <p>Sincronizando con el servidor...</p>
      </div>
    );
  }

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
            Estructura Académica (Pensum)
          </h1>
          <p className="url-page-sub">
            Gestione la carga y actualización del pensum académico de la carrera.
          </p>
        </header>

        <div className="pensum-content-container">
          <div className="pensum-tab-content">
            {pensumLoaded ? (
              <div className="pup-already-loaded">
                <div className="pup-icon-success">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2>Carga de Pensum Realizada</h2>
                <p>La estructura académica con <strong>{totalCourses} cursos</strong> ya ha sido importada exitosamente.</p>
                <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--url-text-muted)' }}>Para realizar una nueva carga o modificar la actual, acceda al panel de restauración.</p>
                
                <button 
                  className="url-btn url-btn-primary url-btn-lg" 
                  onClick={() => router.push('/settings/maintenance')}
                  style={{ marginTop: '24px', minWidth: '240px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  Restaurar Pensum
                </button>
              </div>
            ) : (
              <PensumUploadCard onSuccess={fetchData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
