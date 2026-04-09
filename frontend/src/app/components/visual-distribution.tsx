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
  "#2563eb",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#ca8a04",
  "#9333ea",
  "#e11d48",
  "#0d9488",
];

const VisualDistribution = ({ criteria }: VisualDistributionProps) => {
  const active = criteria.filter((c) => c.percentage > 0);

  return (
    <div className="vd-card">
      <div>
        <p className="vd-title">Distribución Visual</p>
        <p className="vd-subtitle">Representación gráfica de los porcentajes asignados</p>
      </div>

      <div className="vd-bar">
        {active.map((c, i) => (
          <div
            key={c.id}
            className="vd-segment"
            style={{
              width: `${c.percentage}%`,
              backgroundColor: COLORS[i % COLORS.length],
            }}
          >
            <span>{c.percentage}%</span>
          </div>
        ))}
      </div>

      <div className="vd-legend">
        {criteria.map((c, i) => (
          <div key={c.id} className="vd-legend-item">
            <div
              className="vd-legend-dot"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisualDistribution;