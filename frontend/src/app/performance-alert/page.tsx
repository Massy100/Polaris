"use client";

import { useState, useMemo } from "react";
import {
  Users,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
import "../styles/add-category.css";
import AdminDashboardPanel from "../components/admin-dashboard-panel";

type Status = "danger" | "warning" | "good";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  score: number;
  studentEval: number;
  status: Status;
}

function getScoreColorClass(score: number): string {
  if (score <= 50) return "stat-red";
  if (score <= 65) return "stat-yellow";
  return "stat-green";
}

const STATUS_LABELS: Record<Status, string> = {
  danger: "En Peligro",
  warning: "Advertencia",
  good: "Buen Desempeño",
};

const INITIAL_TEACHERS: Teacher[] = [
  { id: "t1",  name: "María García López",    subject: "Matemáticas",      score: 45, studentEval: 2.3, status: "danger"  },
  { id: "t2",  name: "Juan Pérez Martínez",   subject: "Física",           score: 88, studentEval: 4.5, status: "good"    },
  { id: "t3",  name: "Ana Rodríguez Silva",   subject: "Química",          score: 72, studentEval: 3.8, status: "warning" },
  { id: "t4",  name: "Carlos Sánchez Ruiz",   subject: "Historia",         score: 38, studentEval: 1.9, status: "danger"  },
  { id: "t5",  name: "Laura Fernández Costa", subject: "Literatura",       score: 91, studentEval: 4.7, status: "good"    },
  { id: "t6",  name: "Roberto Jiménez Mora",  subject: "Biología",         score: 60, studentEval: 3.2, status: "warning" },
  { id: "t7",  name: "Sofía Torres Vega",     subject: "Arte",             score: 48, studentEval: 2.1, status: "danger"  },
  { id: "t8",  name: "Miguel Castro León",    subject: "Inglés",           score: 77, studentEval: 4.0, status: "warning" },
  { id: "t9",  name: "Elena Vargas Díaz",     subject: "Música",           score: 82, studentEval: 4.3, status: "good"    },
  { id: "t10", name: "Andrés Morales Ríos",   subject: "Educación Física", score: 50, studentEval: 2.6, status: "danger"  },
];

function SummaryCard({
  label,
  value,
  colorClass,
  icon: Icon,
}: {
  label: string;
  value: number;
  colorClass: string;
  icon: React.ElementType;
}) {
  return (
    <div className="pa-summary-card">
      <div className={`pa-summary-icon ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div className="pa-summary-info">
        <span className="pa-summary-label">{label}</span>
        <span className="pa-summary-value">{value}</span>
      </div>
    </div>
  );
}

function TeacherCard({
  teacher,
  onStatusChange,
}: {
  teacher: Teacher;
  onStatusChange: (id: string, s: Status) => void;
}) {
  const scoreColor = getScoreColorClass(teacher.score);
  const evalColor  = getScoreColorClass(teacher.studentEval * 20);

  const BadgeIcon =
    teacher.status === "danger"  ? TrendingDown  :
    teacher.status === "warning" ? AlertTriangle :
    CheckCircle;

  return (
    <div className={`pa-teacher-card pa-card-${teacher.status}`}>
      <div className="pa-card-top">
        <div>
          <p className="pa-teacher-name">{teacher.name}</p>
          <p className="pa-teacher-subject">{teacher.subject}</p>
        </div>
        <span className={`pa-status-badge pa-badge-${teacher.status}`}>
          <BadgeIcon size={13} />
          {STATUS_LABELS[teacher.status]}
        </span>
      </div>

      <div className="pa-stats-row">
        <div className="pa-stat-item">
          <span className="pa-stat-label">Puntuación</span>
          <span className={`pa-stat-value ${scoreColor}`}>{teacher.score}%</span>
        </div>
        <div className="pa-stat-item">
          <span className="pa-stat-label">Eval. Estudiantes</span>
          <span className={`pa-stat-value ${evalColor}`}>{teacher.studentEval.toFixed(1)}/5</span>
        </div>
      </div>

      <p className="pa-change-label">Cambiar estado:</p>
      <div className="pa-state-buttons">
        {(["danger", "warning", "good"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(teacher.id, s)}
            className={`pa-state-btn pa-btn-${s}${teacher.status === s ? " active" : ""}`}
          >
            {s === "danger" ? "Peligro" : s === "warning" ? "Advertencia" : "Bueno"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PerformanceAlertPage() {
  const [teachers, setTeachers]   = useState<Teacher[]>(INITIAL_TEACHERS);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState<"all" | Status>("all");

  const handleStatusChange = (id: string, newStatus: Status) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [teachers, search, filterStatus]);

  const counts = useMemo(() => ({
    total:   teachers.length,
    danger:  teachers.filter((t) => t.status === "danger").length,
    warning: teachers.filter((t) => t.status === "warning").length,
    good:    teachers.filter((t) => t.status === "good").length,
  }), [teachers]);

  return (
    <>
      <AdminDashboardPanel
        userName="Usuario Admin"
        activePath="/performance-alert"
        onNavigate={(path: string) => { window.location.href = path; }}
        onLogout={() => { window.location.href = "/"; }}
      />

      <div className="pa-wrapper">
        <main className="pa-main">
          <div className="pa-page-header">
            <h1 className="pa-page-title">Alertas de Desempeño de Docentes</h1>
            <p className="pa-page-subtitle">Monitoreo y seguimiento del rendimiento académico</p>
          </div>

          <div className="pa-summary-row">
            <SummaryCard label="Total Docentes" value={counts.total}   colorClass="icon-blue"   icon={Users}         />
            <SummaryCard label="En Peligro"     value={counts.danger}  colorClass="icon-red"    icon={TrendingDown}  />
            <SummaryCard label="En Advertencia" value={counts.warning} colorClass="icon-yellow" icon={AlertTriangle} />
            <SummaryCard label="Buen Desempeño" value={counts.good}    colorClass="icon-green"  icon={CheckCircle}   />
          </div>

          <div className="pa-filter-bar">
            <div className="pa-search-wrapper">
              <Search size={16} className="pa-search-icon" />
              <input
                type="text"
                placeholder="Buscar por nombre o materia..."
                className="pa-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Filter size={18} style={{ color: "#64748b", flexShrink: 0 }} />
            <select
              className="pa-filter-select"
              value={filterStatus}
              onChange={(e) => setFilter(e.target.value as "all" | Status)}
            >
              <option value="all">Todos los estados</option>
              <option value="danger">En Peligro</option>
              <option value="warning">Advertencia</option>
              <option value="good">Buen Desempeño</option>
            </select>
          </div>

          <div className="pa-grid">
            {filtered.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </main>

        <span className="pa-brand">Polaris</span>
      </div>
    </>
  );
}