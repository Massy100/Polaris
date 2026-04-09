"use client";

import { useMemo } from "react";
import "../styles/calc-example.css";

interface Criterion {
  id: number;
  name: string;
  percentage: number;
}

interface CalcExampleProps {
  criteria: Criterion[];
}

const FIXED_POINTS = [85, 90, 78, 88, 92, 76, 83, 95, 70, 87];

const CalcExample = ({ criteria }: CalcExampleProps) => {
  const rows = useMemo(() => {
    return criteria.map((c, i) => {
      const points = FIXED_POINTS[i % FIXED_POINTS.length];
      const value = (points * c.percentage) / 100;
      return { ...c, points, value };
    });
  }, [criteria]);

  const finalScore = rows.reduce((acc, r) => acc + r.value, 0);

  return (
    <div className="calc-card">
      <div className="calc-header">
        <p className="calc-title">Ejemplo de Cálculo</p>
        <p className="calc-subtitle">Simulación con valores de ejemplo (escala de 0 a 100)</p>
      </div>

      <div className="calc-rows">
        {rows.map((r) => (
          <div key={r.id} className="calc-row">
            <div className="calc-row-left">
              <span className="calc-row-name">{r.name}</span>
              <span className="calc-row-formula">
                {r.points} puntos × {r.percentage}% = {r.value.toFixed(2)}
              </span>
            </div>
            <span className="calc-row-value">{r.value.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="calc-final">
        <div className="calc-final-left">
          <p className="calc-final-title">Calificación Final</p>
          <p className="calc-final-subtitle">Suma ponderada de todos los criterios</p>
        </div>
        <div className="calc-final-right">
          <span className="calc-final-value">{finalScore.toFixed(2)}</span>
          <span className="calc-final-of">de 100</span>
        </div>
      </div>
    </div>
  );
};

export default CalcExample;