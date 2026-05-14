'use client';

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Users,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
import Pagination from "../components/pagination";
import "./add-category.css";

type Status = "danger" | "warning" | "good";

interface Teacher {
  id: string;
  name: string;
  subject: string;
  score: number;
  studentEval: number;
  status: Status;
}

interface TeacherFromAPI {
  teacher_id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  courses_taught: string;
  rating: number;
  score: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const LS_STATUS_KEY = 'performance_alert_statuses';

function getStoredStatuses(): Record<string, Status> {
  try {
    const stored = localStorage.getItem(LS_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveStoredStatuses(statuses: Record<string, Status>) {
  try { localStorage.setItem(LS_STATUS_KEY, JSON.stringify(statuses)); } catch {}
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

function getStatusFromScore(score: number): Status {
  if (score <= 50) return "danger";
  if (score <= 65) return "warning";
  return "good";
}

const IconEyebrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const IconTitle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--url-navy-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
);

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
  const evalColor  = getScoreColorClass(teacher.score);

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
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('page_size', pageSize.toString());

      const response = await fetch(`${API_URL}/academic-career/teachers/?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Error al cargar los docentes');

      const data = await response.json();

      const mapped: Teacher[] = data.results.map((teacher: TeacherFromAPI) => {
        const scoreValue = teacher.score ?? 0;
        const ratingValue = teacher.rating ?? 0;
        const name = teacher.full_name || `${teacher.first_name} ${teacher.last_name}` || `Docente ${teacher.teacher_id}`;
        return {
          id: String(teacher.teacher_id),
          name,
          subject: teacher.courses_taught || "Sin asignatura",
          score: scoreValue,
          studentEval: ratingValue,
          status: getStatusFromScore(scoreValue),
        };
      });

      const storedStatuses = getStoredStatuses();
      const merged = mapped.map(t => ({
        ...t,
        status: storedStatuses[t.id] ?? t.status,
      }));
      setTeachers(merged);
      setTotalItems(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleStatusChange = (id: string, newStatus: Status) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    const stored = getStoredStatuses();
    stored[id] = newStatus;
    saveStoredStatuses(stored);
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
    <div className="pa-layout flex-1">
      <div className="pa-header-main">
        <div className="pa-eyebrow">
          <IconEyebrow />
          Monitoreo Académico
        </div>
        <div className="pa-title-row">
          <IconTitle />
          <h1>Alertas de Desempeño</h1>
        </div>
        <p className="pa-subtitle-main">
          Monitoreo y seguimiento del rendimiento académico de los docentes basado en puntuaciones y evaluaciones.
        </p>
      </div>

      <main className="pa-main-content">
        <div className="pa-summary-row">
          <SummaryCard label="Total Docentes" value={counts.total}   colorClass="icon-blue"   icon={Users}         />
          <SummaryCard label="En Peligro"     value={counts.danger}  colorClass="icon-red"    icon={TrendingDown}  />
          <SummaryCard label="En Advertencia" value={counts.warning} colorClass="icon-yellow" icon={AlertTriangle} />
          <SummaryCard label="Buen Desempeño" value={counts.good}    colorClass="icon-green"  icon={CheckCircle}   />
        </div>

        <div className="pa-filter-bar">
          <div className="pa-search-wrapper">
            <Search size={18} className="pa-search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre o materia..."
              className="pa-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="pa-select-wrapper">
            <Filter size={18} className="pa-select-icon" />
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
        </div>

        <div className="pa-grid">
          {loading ? (
            <div className="pa-loading">Cargando docentes...</div>
          ) : error ? (
            <div className="pa-error">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="pa-empty">No se encontraron docentes.</div>
          ) : (
            filtered.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>

        {!loading && totalItems > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={(newPage) => {
              const totalPages = Math.ceil(totalItems / pageSize) || 1;
              if (newPage < 1 || newPage > totalPages) return;
              setPage(newPage);
            }}
            onPageSizeChange={(size) => {
              setPageSize(size > 0 ? size : 10);
              setPage(1);
            }}
          />
        )}
      </main>
    </div>
  );
}