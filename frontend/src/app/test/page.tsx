'use client';

import { useState } from 'react';
import AdminDashboardPanel from '../components/AdminDashboardPanel';

export default function TestPage() {
  const [activePath, setActivePath] = useState<string>('');

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AdminDashboardPanel
        userName="Usuario Admin"
        activePath={activePath}
        onNavigate={(path) => setActivePath(path)}
        onLogout={() => alert('Cerrando sesión...')}
      />

      <p
        style={{
          color: '#9ca3af',
          fontSize: '14px',
          fontFamily: 'sans-serif',
          userSelect: 'none',
        }}
      >
        Presiona el botón azul para abrir el panel
      </p>
    </main>
  );
}