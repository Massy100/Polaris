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
      <div className="pup-loading">
        <p>Verificando estado del pensum...</p>
      </div>
    );
  }

  if (isLoaded) {
    return (
      <div className="pup-already-loaded">
        <h2>El pensum ya fue cargado</h2>
        <p>Esta accion ya no esta disponible.</p>
        <button onClick={() => router.push('/admin-dashboard')}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pup-wrapper">
      <PensumUploadCard onSuccess={() => router.push('/admin-dashboard')} />
    </div>
  );
}