'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PensumUploadCard from '../components/pensum-upload-card';
import './pensum-upload.css';

export default function PensumPage() {
  const router = useRouter();
  const [pensumLoaded, setPensumLoaded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pensumRes = await fetch(`${API_URL}/pensum/status/`);
      const pensumData = await pensumRes.json();
      setPensumLoaded(pensumData.is_loaded);
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
                <h2>Pensum Configurado</h2>
                <p>La estructura académica de la carrera ya ha sido importada exitosamente.</p>
                <button className="pup-btn-primary" onClick={() => setPensumLoaded(false)}>
                  Reemplazar Pensum
                </button>
              </div>
            ) : (
              <PensumUploadCard onSuccess={() => setPensumLoaded(true)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
