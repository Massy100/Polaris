'use client';

import { useState } from "react";
import "./history-view.css";

export interface HistoricalRecord {
  id: string;
  term: string;
  studentsTotal: number;
  studentsPassed: number;
  studentsFailed: number;
  hours: number;
  approvalRate: number;
  courseName?: string;
  courseCode?: string;
  professorName?: string;
}

export interface ProfessorData {
  id: string;
  name: string;
  department: string;
  email: string;
  courseCount: number;
  approvalRate: number;
  totalStudents: number;
  totalPassed: number;
  totalFailed: number;
  history: HistoricalRecord[];
}

export interface CourseData {
  id: string;
  name: string;
  code: string;
  description: string;
  professorCount: number;
  approvalRate: number;
  totalStudents: number;
  totalPassed: number;
  totalFailed: number;
  history: HistoricalRecord[];
}

const MOCK_PROFESSORS: ProfessorData[] = [
  {
    id: "p1",
    name: "Dr. María García López",
    department: "Ciencias de la Computación",
    email: "maria.garcia@universidad.edu",
    courseCount: 4,
    approvalRate: 86.0,
    totalStudents: 186,
    totalPassed: 160,
    totalFailed: 26,
    history: [
      {
        id: "h1",
        term: "Otoño 2025",
        courseName: "Programación Avanzada",
        courseCode: "CS301",
        studentsTotal: 45,
        studentsPassed: 38,
        studentsFailed: 7,
        hours: 60,
        approvalRate: 84.4,
      },
      {
        id: "h2",
        term: "Primavera 2024",
        courseName: "Programación Avanzada",
        courseCode: "CS301",
        studentsTotal: 41,
        studentsPassed: 35,
        studentsFailed: 6,
        hours: 60,
        approvalRate: 85.4,
      },
    ],
  },
  {
    id: "p2",
    name: "Dr. Carlos Rodríguez Martín",
    department: "Ingeniería de Software",
    email: "carlos.rodriguez@universidad.edu",
    courseCount: 5,
    approvalRate: 87.8,
    totalStudents: 210,
    totalPassed: 185,
    totalFailed: 25,
    history: [],
  },
];

const MOCK_COURSES: CourseData[] = [
  {
    id: "c1",
    name: "Programación Avanzada",
    code: "CS301",
    description: "Curso avanzado de programación orientada a objetos y patrones de diseño",
    professorCount: 3,
    approvalRate: 84.3,
    totalStudents: 134,
    totalPassed: 113,
    totalFailed: 21,
    history: [
      {
        id: "hc1",
        term: "Otoño 2025",
        professorName: "Dr. María García López",
        studentsTotal: 45,
        studentsPassed: 38,
        studentsFailed: 7,
        hours: 60,
        approvalRate: 84.4,
      },
      {
        id: "hc2",
        term: "Primavera 2024",
        professorName: "Dr. María García López",
        studentsTotal: 41,
        studentsPassed: 35,
        studentsFailed: 6,
        hours: 60,
        approvalRate: 85.4,
      },
      {
        id: "hc3",
        term: "Otoño 2024",
        professorName: "Dr. Carlos Rodríguez Martín",
        studentsTotal: 48,
        studentsPassed: 40,
        studentsFailed: 8,
        hours: 60,
        approvalRate: 83.3,
      },
    ],
  },
  {
    id: "c2",
    name: "Estructuras de Datos",
    code: "CS201",
    description: "Estudio de estructuras de datos fundamentales y algoritmos",
    professorCount: 2,
    approvalRate: 87.0,
    totalStudents: 150,
    totalPassed: 130,
    totalFailed: 20,
    history: [],
  },
];

interface EditFormData {
  term: string;
  studentsTotal: string;
  studentsPassed: string;
  studentsFailed: string;
  hours: string;
  approvalRate: string;
}

// --- Icons Components ---
const IconEyebrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconTitle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--url-navy-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconProfessors = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCourses = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export default function HistoryView() {
  const [activeTab, setActiveTab] = useState<"professors" | "courses">("professors");
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<HistoricalRecord | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    term: "",
    studentsTotal: "",
    studentsPassed: "",
    studentsFailed: "",
    hours: "",
    approvalRate: "",
  });

  const handleTabSwitch = (tab: "professors" | "courses") => {
    setActiveTab(tab);
    setSelectedProfId(null);
    setSelectedCourseId(null);
  };

  const openEdit = (record: HistoricalRecord) => {
    setEditingRecord(record);
    setEditForm({
      term: record.term,
      studentsTotal: String(record.studentsTotal),
      studentsPassed: String(record.studentsPassed),
      studentsFailed: String(record.studentsFailed),
      hours: String(record.hours),
      approvalRate: String(record.approvalRate),
    });
  };

  const closeEdit = () => {
    setEditingRecord(null);
  };

  const handleFormChange = (field: keyof EditFormData, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    closeEdit();
  };

  const selectedProfessor = MOCK_PROFESSORS.find((p) => p.id === selectedProfId);
  const selectedCourse = MOCK_COURSES.find((c) => c.id === selectedCourseId);

  return (
    <div className="hv-layout flex-1">
      <div className="hv-header-main">
        <div className="hv-eyebrow">
          <IconEyebrow />
          Historial Académico
        </div>
        <div className="hv-title-row">
          <IconTitle />
          <h1>Cursos Históricos</h1>
        </div>
        <p className="hv-subtitle-main">
          {activeTab === "professors"
            ? "Selecciona un profesor para ver todos los cursos que ha impartido"
            : "Selecciona un curso para ver todos los profesores que lo han impartido"}
        </p>
      </div>

      <div className="hv-toggle-container">
        <div className="hv-toggle-bg">
          <button
            className={`hv-toggle-btn ${activeTab === "professors" ? "active" : ""}`}
            onClick={() => handleTabSwitch("professors")}
          >
            <IconProfessors />
            Profesores
          </button>
          <button
            className={`hv-toggle-btn ${activeTab === "courses" ? "active" : ""}`}
            onClick={() => handleTabSwitch("courses")}
          >
            <IconCourses />
            Cursos
          </button>
        </div>
      </div>

      <div className="hv-content-grid">
        <aside className="hv-sidebar">
          <div className="hv-sidebar-header">
            <h2>{activeTab === "professors" ? "Profesores" : "Cursos"}</h2>
            <span>
              {activeTab === "professors"
                ? `${MOCK_PROFESSORS.length} profesores registrados`
                : `${MOCK_COURSES.length} cursos disponibles`}
            </span>
          </div>

          <div className="hv-list">
            {activeTab === "professors" &&
              MOCK_PROFESSORS.map((prof) => (
                <div
                  key={prof.id}
                  className={`hv-list-card ${selectedProfId === prof.id ? "selected" : ""}`}
                  onClick={() => setSelectedProfId(prof.id)}
                >
                  <h3>{prof.name}</h3>
                  <p>{prof.department}</p>
                  <div className="hv-badges">
                    <span className="hv-badge-gray">
                      <IconCourses />
                      {prof.courseCount} cursos
                    </span>
                    <span className="hv-badge-green">{prof.approvalRate.toFixed(1)}% aprobación</span>
                  </div>
                </div>
              ))}

            {activeTab === "courses" &&
              MOCK_COURSES.map((course) => (
                <div
                  key={course.id}
                  className={`hv-list-card ${selectedCourseId === course.id ? "selected" : ""}`}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <h3>{course.name}</h3>
                  <p>{course.code}</p>
                  <div className="hv-badges">
                    <span className="hv-badge-gray">
                      <IconProfessors />
                      {course.professorCount} profesores
                    </span>
                    <span className="hv-badge-green">{course.approvalRate.toFixed(1)}% aprobación</span>
                  </div>
                </div>
              ))}
          </div>
        </aside>

        <main className="hv-detail-panel">
          {!selectedProfessor && !selectedCourse && (
            <div className="hv-empty-state">
              {activeTab === "professors" ? (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--url-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <h3>No hay profesor seleccionado</h3>
                  <p>Selecciona un profesor de la lista para ver su historial completo de cursos impartidos con estadísticas de aprobación.</p>
                </>
              ) : (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--url-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <h3>No hay curso seleccionado</h3>
                  <p>Selecciona un curso de la lista para ver todos los profesores que lo han impartido con estadísticas de aprobación.</p>
                </>
              )}
            </div>
          )}

          {activeTab === "professors" && selectedProfessor && (
            <div className="hv-detail-content">
              <div className="hv-detail-header">
                <div className="hv-dh-info">
                  <h2>{selectedProfessor.name}</h2>
                  <p>{selectedProfessor.department}</p>
                  <span>{selectedProfessor.email}</span>
                </div>
                <div className="hv-dh-badges">
                  <span className="hv-badge-blue-solid">{selectedProfessor.courseCount} cursos impartidos</span>
                  <span className="hv-badge-green-solid">{selectedProfessor.approvalRate.toFixed(1)}% aprobación</span>
                </div>
              </div>

              <div className="hv-stats-row">
                <div className="hv-stat-box">
                  <span className="hv-stat-label">
                    <IconProfessors />
                    Total Estudiantes
                  </span>
                  <span className="hv-stat-value">{selectedProfessor.totalStudents}</span>
                </div>
                <div className="hv-stat-box">
                  <span className="hv-stat-label green">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
                    Aprobados
                  </span>
                  <span className="hv-stat-value green">{selectedProfessor.totalPassed}</span>
                </div>
                <div className="hv-stat-box">
                  <span className="hv-stat-label red">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><line x1="17" y1="9" x2="23" y2="15" /><line x1="23" y1="9" x2="17" y2="15" /></svg>
                    Reprobados
                  </span>
                  <span className="hv-stat-value red">{selectedProfessor.totalFailed}</span>
                </div>
              </div>

              <div className="hv-history-list">
                {selectedProfessor.history.map((record) => (
                  <div key={record.id} className="hv-history-card border-blue">
                    <div className="hv-hc-header">
                      <div className="hv-hc-title">
                        <h3>{record.courseName} ({record.courseCode})</h3>
                        <span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          {record.term}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="hv-badge-green-light">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                          {record.approvalRate.toFixed(1)}%
                        </span>
                        <button className="hv-edit-btn" onClick={() => openEdit(record)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Editar
                        </button>
                      </div>
                    </div>
                    <div className="hv-hc-stats">
                      <div className="hv-hc-stat">
                        <span className="lbl">
                          <IconProfessors />
                          Estudiantes
                        </span>
                        <span className="val">{record.studentsTotal}</span>
                      </div>
                      <div className="hv-hc-stat">
                        <span className="lbl green">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /></svg>
                          Aprobados
                        </span>
                        <span className="val green">{record.studentsPassed}</span>
                      </div>
                      <div className="hv-hc-stat">
                        <span className="lbl red">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><line x1="21" y1="9" x2="17" y2="13" /><line x1="17" y1="9" x2="21" y2="13" /></svg>
                          Reprobados
                        </span>
                        <span className="val red">{record.studentsFailed}</span>
                      </div>
                      <div className="hv-hc-stat">
                        <span className="lbl">
                          <IconEyebrow />
                          Horas
                        </span>
                        <span className="val">{record.hours}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "courses" && selectedCourse && (
            <div className="hv-detail-content">
              <div className="hv-detail-header">
                <div className="hv-dh-info">
                  <h2>{selectedCourse.name}</h2>
                  <p>{selectedCourse.code}</p>
                  <span>{selectedCourse.description}</span>
                </div>
                <div className="hv-dh-badges">
                  <span className="hv-badge-blue-solid">{selectedCourse.professorCount} profesores</span>
                  <span className="hv-badge-green-solid">{selectedCourse.approvalRate.toFixed(1)}% aprobación</span>
                </div>
              </div>

              <div className="hv-stats-row">
                <div className="hv-stat-box">
                  <span className="hv-stat-label">
                    <IconProfessors />
                    Total Estudiantes
                  </span>
                  <span className="hv-stat-value">{selectedCourse.totalStudents}</span>
                </div>
                <div className="hv-stat-box">
                  <span className="hv-stat-label green">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
                    Aprobados
                  </span>
                  <span className="hv-stat-value green">{selectedCourse.totalPassed}</span>
                </div>
                <div className="hv-stat-box">
                  <span className="hv-stat-label red">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><line x1="17" y1="9" x2="23" y2="15" /><line x1="23" y1="9" x2="17" y2="15" /></svg>
                    Reprobados
                  </span>
                  <span className="hv-stat-value red">{selectedCourse.totalFailed}</span>
                </div>
              </div>

              <div className="hv-history-list">
                {selectedCourse.history.map((record) => (
                  <div key={record.id} className="hv-history-card border-purple">
                    <div className="hv-hc-header">
                      <div className="hv-hc-title">
                        <div className="title-with-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C5CBF" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
                          <h3>{record.professorName}</h3>
                        </div>
                        <span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                          {record.term}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="hv-badge-green-light">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                          {record.approvalRate.toFixed(1)}%
                        </span>
                        <button className="hv-edit-btn" onClick={() => openEdit(record)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Editar
                        </button>
                      </div>
                    </div>
                    <div className="hv-hc-stats">
                      <div className="hv-hc-stat">
                        <span className="lbl">
                          <IconProfessors />
                          Estudiantes
                        </span>
                        <span className="val">{record.studentsTotal}</span>
                      </div>
                      <div className="hv-hc-stat">
                        <span className="lbl green">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /></svg>
                          Aprobados
                        </span>
                        <span className="val green">{record.studentsPassed}</span>
                      </div>
                      <div className="hv-hc-stat">
                        <span className="lbl red">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><line x1="21" y1="9" x2="17" y2="13" /><line x1="17" y1="9" x2="21" y2="13" /></svg>
                          Reprobados
                        </span>
                        <span className="val red">{record.studentsFailed}</span>
                      </div>
                      <div className="hv-hc-stat">
                        <span className="lbl">
                          <IconEyebrow />
                          Horas
                        </span>
                        <span className="val">{record.hours}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {editingRecord && (
        <div className="hv-modal-overlay" onClick={closeEdit}>
          <div className="hv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hv-modal-header">
              <div className="hv-modal-header-info">
                <span className="hv-modal-eyebrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Editar Registro
                </span>
                <h2 className="hv-modal-title">
                  {editingRecord.courseName ?? editingRecord.professorName}
                </h2>
                <p className="hv-modal-sub">{editingRecord.term}</p>
              </div>
              <button className="hv-modal-close" onClick={closeEdit}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="hv-modal-body">
              <div className="hv-form-grid">
                <div className="hv-form-field">
                  <label className="hv-form-label">Período</label>
                  <input
                    className="hv-form-input"
                    type="text"
                    value={editForm.term}
                    onChange={(e) => handleFormChange("term", e.target.value)}
                    placeholder="Ej: Otoño 2025"
                  />
                </div>
                <div className="hv-form-field">
                  <label className="hv-form-label">Horas</label>
                  <input
                    className="hv-form-input"
                    type="number"
                    value={editForm.hours}
                    onChange={(e) => handleFormChange("hours", e.target.value)}
                    placeholder="60"
                  />
                </div>
                <div className="hv-form-field">
                  <label className="hv-form-label">Total Estudiantes</label>
                  <input
                    className="hv-form-input"
                    type="number"
                    value={editForm.studentsTotal}
                    onChange={(e) => handleFormChange("studentsTotal", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="hv-form-field">
                  <label className="hv-form-label">Tasa de Aprobación (%)</label>
                  <input
                    className="hv-form-input"
                    type="number"
                    step="0.1"
                    value={editForm.approvalRate}
                    onChange={(e) => handleFormChange("approvalRate", e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div className="hv-form-field">
                  <label className="hv-form-label hv-form-label--success">Aprobados</label>
                  <input
                    className="hv-form-input hv-form-input--success"
                    type="number"
                    value={editForm.studentsPassed}
                    onChange={(e) => handleFormChange("studentsPassed", e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="hv-form-field">
                  <label className="hv-form-label hv-form-label--danger">Reprobados</label>
                  <input
                    className="hv-form-input hv-form-input--danger"
                    type="number"
                    value={editForm.studentsFailed}
                    onChange={(e) => handleFormChange("studentsFailed", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="hv-modal-footer">
              <button className="hv-modal-btn-cancel" onClick={closeEdit}>
                Cancelar
              </button>
              <button className="hv-modal-btn-save" onClick={handleSave}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}