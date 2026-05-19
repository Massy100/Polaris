'use client';

import { useEffect, useMemo, useState } from "react";
import NotificationWrapper from "../components/notification-wrapper";
import "./history-view.css";
import Pagination from "../components/pagination";

export interface HistoricalRecord {
  id: string;
  term: string;
  courseName?: string;
  courseCode?: string;
  professorName?: string;
  score?: number | null;
  commentsCount?: number;
  assignedHours?: number | null;
}

export interface ProfessorData {
  id: string;
  name: string;
  department: string;
  email: string;
  courseCount: number;
  history: HistoricalRecord[];
}

export interface CourseData {
  id: string;
  name: string;
  code: string;
  description: string;
  professorCount: number;
  history: HistoricalRecord[];
}

interface Course {
  course_id: number | string;
  name: string;
  credits?: number;
  status?: string;
  section_id?: number | string;
  section_code?: string;
  period_name?: string;
  term?: string;
  final_score?: number | null;
  comments_count?: number;
  assigned_hours?: number | null;
}

interface Teacher {
  teacher_id: number | string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  status?: string;
  courses?: Course[];
}

interface TeacherBasic {
  teacher_id: number | string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  status?: string;
  section_id?: number | string;
  section_code?: string;
  period_name?: string;
  term?: string;
  final_score?: number | null;
  comments_count?: number;
  assigned_hours?: number | null;
}

interface CourseWithTeachers {
  course_id: number | string;
  name: string;
  credits?: number;
  status?: string;
  teachers?: TeacherBasic[];
}

interface PaginatedResponse<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getArrayData<T>(payload: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload?.results && Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
}

function mapTeachersToProfessorData(teachers: Teacher[]): ProfessorData[] {
  return teachers.map((teacher) => {
    const teacherName =
      teacher.full_name?.trim() ||
      `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() ||
      "Docente sin nombre";

    const courses = teacher.courses || [];

    return {
      id: String(teacher.teacher_id),
      name: teacherName,
      department: "Docente",
      email: teacher.email || "Sin correo",
      courseCount: courses.length,
      history: courses.map((course, index) => ({
        id: [
          "teacher",
          teacher.teacher_id,
          "course",
          course.course_id,
          "section",
          course.section_id ?? course.section_code ?? "direct",
          "period",
          course.period_name ?? "none",
          index,
        ].join("-"),
        term: course.term || course.period_name || "Histórico",
        courseName: course.name,
        courseCode: course.section_code
          ? `Curso ${course.course_id} / Sección ${course.section_code}`
          : `ID-${course.course_id}`,
        score: course.final_score,
        commentsCount: course.comments_count ?? 0,
        assignedHours: course.assigned_hours,
      })),
    };
  });
}

function mapCoursesToCourseData(courses: CourseWithTeachers[]): CourseData[] {
  return courses.map((course) => {
    const teachers = course.teachers || [];

    return {
      id: String(course.course_id),
      name: course.name,
      code: `ID-${course.course_id}`,
      description: `Curso con ${course.credits ?? 0} créditos`,
      professorCount: teachers.length,
      history: teachers.map((teacher, index) => {
        const teacherName =
          teacher.full_name?.trim() ||
          `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() ||
          "Docente sin nombre";

        return {
          id: [
            "course",
            course.course_id,
            "teacher",
            teacher.teacher_id,
            "section",
            teacher.section_id ?? teacher.section_code ?? "direct",
            "period",
            teacher.period_name ?? "none",
            index,
          ].join("-"),
          term: teacher.term || teacher.period_name || "Histórico",
          professorName: teacherName,
          courseCode: teacher.section_code ? `Sección ${teacher.section_code}` : undefined,
          score: teacher.final_score,
          commentsCount: teacher.comments_count ?? 0,
          assignedHours: teacher.assigned_hours,
        };
      }),
    };
  });
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

  const [professors, setProfessors] = useState<ProfessorData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);

  const [loadingProfessors, setLoadingProfessors] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [errorProfessors, setErrorProfessors] = useState<string | null>(null);
  const [errorCourses, setErrorCourses] = useState<string | null>(null);

  const [professorsPage, setProfessorsPage] = useState(1);
  const [professorsPageSize, setProfessorsPageSize] = useState(10);

  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesPageSize, setCoursesPageSize] = useState(10);

  const handleTabSwitch = (tab: "professors" | "courses") => {
    setActiveTab(tab);
    setSelectedProfId(null);
    setSelectedCourseId(null);
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingProfessors(true);
        setErrorProfessors(null);

        const response = await fetch(`${API_URL}/academic-career/teachers-with-courses/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: no se pudieron cargar los docentes`);
        }

        const payload: Teacher[] | PaginatedResponse<Teacher> = await response.json();
        const teachersArray = getArrayData(payload);
        const mappedTeachers = mapTeachersToProfessorData(teachersArray);

        setProfessors(mappedTeachers);
      } catch (error) {
        console.error("Error cargando docentes:", error);
        setErrorProfessors("No se pudieron cargar los docentes.");
      } finally {
        setLoadingProfessors(false);
      }
    };

    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        setErrorCourses(null);

        const response = await fetch(`${API_URL}/academic-career/courses-with-teachers/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: no se pudieron cargar los cursos`);
        }

        const payload:
          | CourseWithTeachers[]
          | PaginatedResponse<CourseWithTeachers> = await response.json();

        const coursesArray = getArrayData(payload);
        const mappedCourses = mapCoursesToCourseData(coursesArray);

        setCourses(mappedCourses);
      } catch (error) {
        console.error("Error cargando cursos:", error);
        setErrorCourses("No se pudieron cargar los cursos.");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchTeachers();
    fetchCourses();
  }, []);

  const selectedProfessor = useMemo(
    () => professors.find((p) => p.id === selectedProfId) || null,
    [professors, selectedProfId]
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const isLoading = activeTab === "professors" ? loadingProfessors : loadingCourses;
  const activeError = activeTab === "professors" ? errorProfessors : errorCourses;

  const paginatedProfessors = useMemo(() => {
    const start = (professorsPage - 1) * professorsPageSize;
    return professors.slice(start, start + professorsPageSize);
  }, [professors, professorsPage, professorsPageSize]);

  const paginatedCourses = useMemo(() => {
    const start = (coursesPage - 1) * coursesPageSize;
    return courses.slice(start, start + coursesPageSize);
  }, [courses, coursesPage, coursesPageSize]);

  return (
    <div className="hv-layout flex-1">
      <NotificationWrapper />
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
                ? `${professors.length} profesores registrados`
                : `${courses.length} cursos disponibles`}
            </span>
          </div>

          {isLoading && (
            <div className="hv-empty-state">
              <h3>Cargando...</h3>
              <p>Estamos obteniendo la información.</p>
            </div>
          )}

          {!isLoading && activeError && (
            <div className="hv-empty-state">
              <h3>Error al cargar</h3>
              <p>{activeError}</p>
            </div>
          )}

          {!isLoading && !activeError && (
            <>
              <div className="hv-list">
                {activeTab === "professors" &&
                  paginatedProfessors.map((prof) => (
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
                      </div>
                    </div>
                  ))}

                {activeTab === "courses" &&
                  paginatedCourses.map((course) => (
                    <div
                      key={course.id}
                      className={`hv-list-card ${selectedCourseId === course.id ? "selected" : ""}`}
                      onClick={() => setSelectedCourseId(course.id)}
                    >
                      <h3>{course.name}</h3>
                      <div className="hv-badges">
                        <span className="hv-badge-gray">
                          <IconProfessors />
                          {course.professorCount} profesores
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
              {activeTab === "professors" && (
                <div className="hv-sidebar-pagination">
                  <Pagination
                    page={professorsPage}
                    pageSize={professorsPageSize}
                    totalItems={professors.length}
                    onPageChange={(newPage) => {
                      const totalPages = Math.ceil(professors.length / professorsPageSize) || 1;
                      if (newPage < 1 || newPage > totalPages) return;
                      setProfessorsPage(newPage);
                    }}
                    onPageSizeChange={(size) => {
                      const safeSize = size > 0 ? size : 10;
                      setProfessorsPageSize(safeSize);
                      setProfessorsPage(1);
                    }}
                  />
                </div>
              )}

              {activeTab === "courses" && (
                <div className="hv-sidebar-pagination">
                  <Pagination
                    page={coursesPage}
                    pageSize={coursesPageSize}
                    totalItems={courses.length}
                    onPageChange={(newPage) => {
                      const totalPages = Math.ceil(courses.length / coursesPageSize) || 1;
                      if (newPage < 1 || newPage > totalPages) return;
                      setCoursesPage(newPage);
                    }}
                    onPageSizeChange={(size) => {
                      const safeSize = size > 0 ? size : 10;
                      setCoursesPageSize(safeSize);
                      setCoursesPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </aside>

        <main className="hv-detail-panel">
          {!selectedProfessor && !selectedCourse && !isLoading && !activeError && (
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
                  <span>{selectedProfessor.email}</span>
                  <p>{selectedProfessor.department}</p>
                </div>
              </div>

              <div className="hv-history-list">
                {selectedProfessor.history.length === 0 ? (
                  <div className="hv-empty-state">
                    <h3>Sin cursos asociados</h3>
                    <p>Este docente aún no tiene cursos relacionados.</p>
                  </div>
                ) : (
                  selectedProfessor.history.map((record) => (
                    <div key={record.id} className="hv-history-card border-blue">
                      <div className="hv-hc-header">
                        <div className="hv-hc-title">
                          <h3>{record.courseName}</h3>
                          {record.courseCode && <span>{record.courseCode}</span>}
                          <span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            {record.term}
                          </span>
                          <span>Comentarios: {record.commentsCount ?? 0}</span>
                          {record.assignedHours !== undefined && record.assignedHours !== null && (
                            <span>Horas: {record.assignedHours}</span>
                          )}
                          {record.score !== undefined && record.score !== null && (
                            <span>Score: {record.score}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "courses" && selectedCourse && (
            <div className="hv-detail-content">
              <div className="hv-detail-header">
                <div className="hv-dh-info">
                  <h2>{selectedCourse.name}</h2>
                  <span>{selectedCourse.description}</span>
                </div>
              </div>

              <div className="hv-history-list">
                {selectedCourse.history.length === 0 ? (
                  <div className="hv-empty-state">
                    <h3>Sin docentes asociados</h3>
                    <p>Este curso aún no tiene docentes relacionados.</p>
                  </div>
                ) : (
                  selectedCourse.history.map((record) => (
                    <div key={record.id} className="hv-history-card border-purple">
                      <div className="hv-hc-header">
                        <div className="hv-hc-title">
                          <div className="title-with-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
                            <h3>{record.professorName}</h3>
                          </div>
                          {record.courseCode && <span>{record.courseCode}</span>}
                          <span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            {record.term}
                          </span>
                          <span>Comentarios: {record.commentsCount ?? 0}</span>
                          {record.assignedHours !== undefined && record.assignedHours !== null && (
                            <span>Horas: {record.assignedHours}</span>
                          )}
                          {record.score !== undefined && record.score !== null && (
                            <span>Score: {record.score}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
