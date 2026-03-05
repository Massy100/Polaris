"use client";
import React, { useState } from 'react';

const barData = [
  { label: 'Matemáticas', approved: 88, failed: 14 },
  { label: 'Física', approved: 78, failed: 22 },
  { label: 'Química', approved: 95, failed: 8 },
  { label: 'Álgebra', approved: 91, failed: 11 },
];

const lineData = [
  { month: 'Ene', value: 94 },
  { month: 'Feb', value: 97 },
  { month: 'Mar', value: 91 },
  { month: 'Abr', value: 96 },
  { month: 'May', value: 93 },
  { month: 'Jun', value: 97 },
];

const BAR_MAX_HEIGHT = 200;
const MAX_VAL = 100;

const TeacherCharts = () => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const minVal = 85;
  const maxVal = 100;
  const svgW = 420;
  const svgH = 180;
  const padL = 40;
  const padR = 16;
  const padT = 10;
  const padB = 28;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const yLabels = [100, 97, 93, 89, 85];
  const xStep = chartW / (lineData.length - 1);

  const points = lineData.map((d, i) => ({
    x: padL + i * xStep,
    y: padT + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="charts-section">
      <div className="chart-card">
        <h3 className="chart-title">Rendimiento por Materia</h3>
        <div className="bar-chart-area">
          <div className="bar-y-labels">
            {[100, 75, 50, 25, 0].map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
          <div className="bar-chart-inner">
            <div className="bar-grid-lines">
              {[0, 25, 50, 75, 100].map((v) => (
                <div key={v} className="bar-grid-line" style={{ bottom: `${v}%` }} />
              ))}
            </div>
            <div className="bars-row">
              {barData.map((item, i) => (
                <div
                  key={i}
                  className="bar-group"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  style={{ position: 'relative' }}
                >
                  {hoveredBar === i && (
                    <div className="bar-tooltip">
                      <div className="bar-tooltip-title">{item.label}</div>
                      <div className="bar-tooltip-row green">Aprobados (%) : {item.approved}</div>
                      <div className="bar-tooltip-row red">Reprobados (%) : {item.failed}</div>
                    </div>
                  )}
                  <div
                    className="bar-pair"
                    style={{
                      opacity: hoveredBar !== null && hoveredBar !== i ? 0.35 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div className="bar-approved" style={{ height: `${(item.approved / MAX_VAL) * BAR_MAX_HEIGHT}px` }} />
                    <div className="bar-failed" style={{ height: `${(item.failed / MAX_VAL) * BAR_MAX_HEIGHT}px` }} />
                  </div>
                  <span className="bar-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} />Aprobados (%)</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} />Reprobados (%)</span>
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Asistencia Mensual</h3>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" height="210" style={{ overflow: 'visible' }}>
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
            </filter>
          </defs>
          {yLabels.map((v) => {
            const y = padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth="1" />
                <text x={padL - 6} y={y + 4} fontSize="10" fill="#94a3b8" textAnchor="end">{v}</text>
              </g>
            );
          })}
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
          {points.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
              <circle cx={p.x} cy={p.y} r={hoveredPoint === i ? 6 : 5} fill="#3b82f6" />
              <circle cx={p.x} cy={p.y} r={hoveredPoint === i ? 3 : 2.5} fill="white" />
              <text x={p.x} y={svgH - 4} fontSize="11" fill="#94a3b8" textAnchor="middle">{p.month}</text>
              {hoveredPoint === i && (
                <g>
                  <rect x={p.x - 46} y={p.y - 44} width="92" height="36" rx="7" fill="white" stroke="#e2e8f0" strokeWidth="1" filter="url(#shadow)" />
                  <text x={p.x} y={p.y - 26} fontSize="11" fill="#0f172a" textAnchor="middle" fontWeight="700">{p.month}</text>
                  <text x={p.x} y={p.y - 13} fontSize="10" fill="#3b82f6" textAnchor="middle">Asistencia: {p.value}%</text>
                </g>
              )}
            </g>
          ))}
        </svg>
        <div className="chart-legend" style={{ justifyContent: 'center' }}>
          <span className="legend-item">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="16" height="2" viewBox="0 0 16 2"><line x1="0" y1="1" x2="16" y2="1" stroke="#3b82f6" strokeWidth="2"/></svg>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            </span>
            Asistencia (%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default TeacherCharts;