"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const modules = [
    {
      title: 'Gestión de Docentes',
      description: 'CRUD (Crear, Leer, Actualizar, Borrar) de Docentes. Crear docentes para tener acceso rápido a sus demás funciones como carga masiva.',
      iconBg: '#e0e7ff',
      iconColor: '#4f46e5',
      route: '/gestion-docentes',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      title: 'Ranking Institucional',
      description: 'Vista para directivos sobre los docentes mejor evaluados.',
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
      route: '/ranking',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    },
    {
      title: 'Alertas de Desempeño',
      description: 'Notificaciones automáticas cuando un docente baja de cierto puntaje.',
      iconBg: '#fef9c3',
      iconColor: '#ca8a04',
      route: '/alertas',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    },
    {
      title: 'Escalafón Docente',
      description: 'Visualización de la jerarquía académica basada en méritos y opiniones. Posicionamiento basado en años de servicio.',
      iconBg: '#f3e8ff',
      iconColor: '#9333ea',
      route: '/escalafon',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
    },
    {
      title: 'Carga Masiva de Datos',
      description: 'Interfaz para subir archivos Excel/CSV con las de títulos, méritos y evaluación docente.',
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      route: '/bulk-upload',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    },
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="top-bar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h1 className="top-bar-title">Bienvenido</h1>
          <div className="logo-box">LOGO</div>
        </header>

        <div className="cards-grid">
          {modules.map((mod, index) => (
            <StatCard
              key={index}
              {...mod}
              onClick={() => router.push(mod.route)}
            />
          ))}
        </div>

        <div className="dashboard-footer">polaris</div>
      </main>
    </div>
  );
}