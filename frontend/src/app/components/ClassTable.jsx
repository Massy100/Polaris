"use client";
import React, { useState } from 'react';

const classes = [
  { name: 'Matemáticas Avanzadas', group: 'A-101', students: 32, schedule: 'Lun-Mie 8:00-10:00' },
  { name: 'Física Cuántica', group: 'B-203', students: 28, schedule: 'Mar-Jue 10:00-12:00' },
  { name: 'Química Orgánica', group: 'A-105', students: 35, schedule: 'Mie-Vie 14:00-16:00' },
  { name: 'Álgebra Lineal', group: 'C-301', students: 30, schedule: 'Lun-Vie 16:00-17:00' },
];

const ClassTable = () => {
  const [hoveredRow, setHoveredRow] = useState(null);

  return (
    <div className="table-card">
      <h3 className="table-title">Clases Asignadas</h3>
      <table className="teacher-table">
        <thead>
          <tr>
            <th>Materia</th>
            <th>Grupo</th>
            <th>Estudiantes</th>
            <th>Horario</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls, i) => (
            <tr
              key={i}
              onMouseEnter={() => setHoveredRow(i)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                background: hoveredRow === i ? '#f0f6ff' : 'white',
                transition: 'background 0.15s',
                cursor: 'pointer',
              }}
            >
              <td>
                <span className="subject-cell">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  {cls.name}
                </span>
              </td>
              <td style={{ color: '#475569' }}>{cls.group}</td>
              <td>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {cls.students}
                </span>
              </td>
              <td>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {cls.schedule}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassTable;