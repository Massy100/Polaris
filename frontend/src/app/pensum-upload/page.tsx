'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PensumUploadCard from '../components/pensum-upload-card';
import './pensum-upload.css';

export default function PensumUploadPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/pensum/status/')
      .then(res => res.json())
      .then(data => setIsLoaded(data.is_loaded))
      .catch(() => setIsLoaded(false));
  }, []);

  if (isLoaded === null) {
    return (
      <div className="flex-1 bg-gray-50 pup-loading">
        <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '12px' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p>Verificando estado del sistema...</p>
      </div>
    );
  }

  if (isLoaded) {
    return (
      <div className="flex-1 bg-gray-50 pup-already-loaded">
        <div className="pup-icon-success">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2>El pensum ya fue cargado</h2>
        <p>La estructura académica ya se encuentra configurada en el sistema.</p>
        <button className="pup-btn-primary" onClick={() => router.push('/')}>
          Ir al panel principal
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 pup-wrapper">
      <PensumUploadCard onSuccess={() => router.push('/')} />
    </div>
  );
}