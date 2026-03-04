"use client";
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TeacherHeader from '../components/TeacherHeader';
import MetricCard from '../components/MetricCard';
import TeacherCharts from '../components/TeacherCharts';
import ClassTable from '../components/ClassTable';
import '../styles/TeacherReport.css';

export default function TeacherReportPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="report-wrapper">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="report-topbar">
        <button className="menu-btn-report" onClick={() => setSidebarOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      <div className="report-container">
        <TeacherHeader />
        <div className="metrics-grid">
          <MetricCard title="Total de Estudiantes" value="125" sub="4 clases activas" icon="users" color="#3b82f6" />
          <MetricCard title="Materias Impartidas" value="4" sub="Semestre actual" icon="book" color="#10b981" />
          <MetricCard title="Calificación Promedio" value="4.8/5.0" sub="Evaluación de alumnos" icon="medal" color="#8b5cf6" />
          <MetricCard title="Tasa de Aprobación" value="86%" sub="Promedio general" icon="trend" color="#f59e0b" />
        </div>
        <TeacherCharts />
        <ClassTable />
      </div>
    </div>
  );
}