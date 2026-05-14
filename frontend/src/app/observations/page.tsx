'use client';

import React from 'react';

export default function ObservationsPage() {
  return (
    <div className="url-page-bg min-h-screen">
      <main className="url-container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--url-navy)', marginBottom: '8px' }}>
            Observaciones Docentes
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--url-text-sec)' }}>
            Módulo para la gestión y visualización de comentarios y observaciones sobre el desempeño docente.
          </p>
        </header>

        <div className="nc-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px', color: 'var(--url-navy)', opacity: 0.5 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', color: 'var(--url-navy)', marginBottom: '12px' }}>
            Contenido en desarrollo
          </h2>
          <p style={{ color: 'var(--url-text-sec)', maxWidth: '500px', margin: '0 auto' }}>
            Este módulo permitirá a los coordinadores revisar los comentarios detallados extraídos de las encuestas y evaluaciones.
          </p>
        </div>
      </main>
    </div>
  );
}
