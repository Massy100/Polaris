"use client";

import React, { useEffect, useState } from "react";
import "../styles/visual-distribution.css";

interface Criterion {
  id: number;
  name: string;
  percentage: number;
}

interface VisualDistributionProps {
  criteria: Criterion[];
}

const COLORS = [
  "var(--url-navy)",       
  "var(--url-gold)",       
  "var(--url-info)",       
  "var(--url-success)",    
  "var(--url-warn)",       
  "var(--url-danger)",     
  "#8b5cf6",               
  "#ec4899",               
];

export default function VisualDistribution({ criteria }: VisualDistributionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = criteria.reduce((sum, c) => sum + c.percentage, 0);
  
  let currentDonutOffset = 0;

  return (
    <div className="vd-card">
      <div className="vd-header">
        <h3 className="vd-title">Distribución Visual de Pesos</h3>
        <p className="vd-subtitle">Gráfica combinada del impacto de cada criterio en la calificación final</p>
      </div>

      <div className="vd-content">
        <div className="vd-chart-container">
          <svg viewBox="0 0 36 36" className="vd-donut">
            <circle className="vd-donut-bg" cx="18" cy="18" r="15.91549430918954" />
            
            {criteria.map((c, i) => {
              if (c.percentage <= 0) return null;
              
              const dashArray = `${c.percentage} ${100 - c.percentage}`;
              const offset = 100 - currentDonutOffset;
              currentDonutOffset += c.percentage;

              return (
                <circle
                  key={c.id}
                  className="vd-donut-segment"
                  cx="18" cy="18" r="15.91549430918954"
                  stroke={COLORS[i % COLORS.length]}
                  strokeDasharray={dashArray}
                  strokeDashoffset={offset}
                />
              );
            })}
          </svg>
          <div className="vd-donut-center">
            <span className="vd-donut-total">{total}%</span>
            <span className="vd-donut-label">Total</span>
          </div>
        </div>

        <div className="vd-legends">
          {criteria.map((c, i) => (
            <div key={c.id} className="vd-legend-item">
              <div className="vd-legend-color" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <div className="vd-legend-info">
                <span className="vd-legend-name">{c.name}</span>
                <span className="vd-legend-value" style={{ color: COLORS[i % COLORS.length] }}>
                  {c.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="vd-stacked-wrapper">
        <p className="vd-stacked-label">Proporción Lineal</p>
        <div className="vd-stacked-bar">
          {criteria.map((c, i) => {
            if (c.percentage <= 0) return null;
            return (
              <div
                key={c.id}
                className="vd-stacked-segment"
                style={{
                  width: `${c.percentage}%`,
                  backgroundColor: COLORS[i % COLORS.length]
                }}
                title={`${c.name}: ${c.percentage}%`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}