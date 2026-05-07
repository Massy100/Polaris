'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import "../individual-teacher-view.css";
import SentimentAnalysisChart, { SentimentChartItem } from "../../components/sentiment-analysis-chart";
import Modal from "../../components/modal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

type CourseFromAPI = { course_id: number; name: string; credits: number; status: string; };
type TeacherFromAPI = {
    teacher_id: number; first_name: string; last_name: string; email: string;
    phone: string; role: string; department: string; since: string; status: string;
    code: string; score: number | null; courses: number[]; courses_detail: CourseFromAPI[];
};
type PeriodFromAPI = { period_id: number; name: string; start_date: string; end_date: string; status: string; };
type CourseInPeriod = { course_id: number; name: string; };
type CommentGroup = { positive: string[]; negative: string[]; };
type SentimentMetrics = { positiveReal: number; negativeReal: number; falsePositive: number; falseNegative: number; };
type TeacherClass = { id: string; name: string; comments: CommentGroup; sentiment: SentimentMetrics; };
type Teacher = { id: string; name: string; department: string; email: string; phone: string; role: string; since: string; finalScore: number; };

function formatRole(role: string): string {
    const roles: Record<string, string> = { titular: "Profesor Titular", asociado: "Profesor Asociado", auxiliar: "Profesor Auxiliar" };
    return roles[role?.toLowerCase().trim()] || role;
}
function formatSince(dateStr: string): string {
    const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [year, month] = dateStr.split("-");
    return `${months[parseInt(month) - 1]} ${year}`;
}
function mapTeacher(data: TeacherFromAPI): Teacher {
    return {
        id: String(data.teacher_id),
        name: `${data.first_name} ${data.last_name}`,
        department: data.department ?? "",
        email: data.email,
        phone: data.phone ?? "",
        role: data.role ? formatRole(data.role) : "",
        since: data.since ? formatSince(data.since) : "",
        finalScore: data.score ? Math.round(data.score * 10) / 10 : 0,
    };
}

type CourseNoteProps = { noteId: string; score?: number | string | null; visibleNotes: Record<string, boolean>; onToggle: (noteId: string) => void; };
function CourseNote({ noteId, score, visibleNotes, onToggle }: CourseNoteProps) {
    const isVisible = visibleNotes[noteId];
    return (
        <div className="itv-class-score">
            <p className="itv-note-label">Nota:</p>
            <p className={`itv-note-value ${!isVisible ? "hidden" : ""}`}>{isVisible ? score ?? "Sin nota" : "••••"}</p>
            <button type="button" className="itv-note-eye-btn" onClick={() => onToggle(noteId)} aria-label={isVisible ? "Ocultar nota" : "Mostrar nota"}>
                {isVisible ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a11.55 11.55 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A10.8 10.8 0 0 1 12 4c5 0 9.27 3.11 11 8a11.44 11.44 0 0 1-2.18 3.19" />
                        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
}

const IconBack = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>);
const IconProfileEyebrow = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="10" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>);
const IconMail = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 110.8V792H136V270.8l-27.6-21.5 39.3-50.5 42.8 33.3h643.1l42.8-33.3 39.3 50.5-27.7 21.5zM833.6 232L512 482 190.4 232l-42.8-33.3-39.3 50.5 27.6 21.5 341.6 265.6a55.99 55.99 0 0 0 68.7 0L888 270.8l27.6-21.5-39.3-50.5-42.7 33.2z"></path></svg>);
const IconPhone = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17.707,12.293c-0.391-0.391-1.023-0.391-1.414,0l-1.594,1.594c-0.739-0.22-2.118-0.72-2.992-1.594s-1.374-2.253-1.594-2.992l1.594-1.594c0.391-0.391,0.391-1.023,0-1.414l-4-4c-0.391-0.391-1.023-0.391-1.414,0L3.581,5.005c-0.38,0.38-0.594,0.902-0.586,1.435c0.023,1.424,0.4,6.37,4.298,10.268s8.844,4.274,10.269,4.298c0.005,0,0.023,0,0.028,0c0.528,0,1.027-0.208,1.405-0.586l2.712-2.712c0.391-0.391,0.391-1.023,0-1.414L17.707,12.293z M17.58,19.005c-1.248-0.021-5.518-0.356-8.873-3.712c-3.366-3.366-3.692-7.651-3.712-8.874L7,4.414L9.586,7L8.293,8.293C8.054,8.531,7.952,8.875,8.021,9.205c0.024,0.115,0.611,2.842,2.271,4.502s4.387,2.247,4.502,2.271c0.333,0.071,0.674-0.032,0.912-0.271L17,14.414L19.586,17L17.58,19.005z"></path></svg>);
const IconRole = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z"></path><path fillRule="nonzero" d="M12 7a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 1.5l1.323 2.68 2.957.43-2.14 2.085.505 2.946L12 17.25l-2.645 1.39.505-2.945-2.14-2.086 2.957-.43L12 10.5zM18 2v3l-1.363 1.138A9.935 9.935 0 0 0 13 5.049L13 2 18 2zm-7-.001v3.05a9.935 9.935 0 0 0-3.636 1.088L6 5V2l5-.001z"></path></g></svg>);
const IconCalendar = () => (<svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);
const IconTrending = () => (<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em"><path d="M23 6L13.5 15.5L8.5 10.5L1 18" /><path d="M17 6H23V12" /></svg>);
const IconBook = () => (<svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>);
const IconPositive = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M885.9 533.7c16.8-22.2 26.1-49.4 26.1-77.7 0-44.9-25.1-87.4-65.5-111.1a67.67 67.67 0 0 0-34.3-9.3H572.4l6-122.9c1.4-29.7-9.1-57.9-29.5-79.4A106.62 106.62 0 0 0 471 99.9c-52 0-98 35-111.8 85.1l-85.9 311H144c-17.7 0-32 14.3-32 32v364c0 17.7 14.3 32 32 32h601.3c9.2 0 18.2-1.8 26.5-5.4 47.6-20.3 78.3-66.8 78.3-118.4 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7-.2-12.6-2-25.1-5.6-37.1zM184 852V568h81v284h-81zm636.4-353l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 16.5-7.2 32.2-19.6 43l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 16.5-7.2 32.2-19.6 43l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 22.4-13.2 42.6-33.6 51.8H329V564.8l99.5-360.5a44.1 44.1 0 0 1 42.2-32.3c7.6 0 15.1 2.2 21.1 6.7 9.9 7.4 15.2 18.6 14.6 30.5l-9.6 198.4h314.4C829 418.5 840 436.9 840 456c0 16.5-7.2 32.1-19.6 43z"></path></svg>);
const IconNegative = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M20,3h-3H6.693C5.864,3,5.112,3.521,4.82,4.298l-2.757,7.351C2.021,11.761,2,11.88,2,12v2c0,1.103,0.897,2,2,2h5.612L8.49,19.367c-0.203,0.608-0.101,1.282,0.274,1.802C9.14,21.689,9.746,22,10.388,22H12c0.297,0,0.578-0.132,0.769-0.36l4.7-5.64H20c1.103,0,2-0.897,2-2V5C22,3.897,21.103,3,20,3z M11.531,20h-1.145l1.562-4.684c0.103-0.305,0.051-0.64-0.137-0.901C11.623,14.154,11.321,14,11,14H4v-1.819L6.693,5H16v9.638L11.531,20z M18,14V5h2l0.001,9H18z"></path></svg>);
const IconPeriod = () => (<svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);

export default function IndividualTeacherView() {
    const router = useRouter();
    const params = useParams();
    const teacherId = params?.id as string;

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [periods, setPeriods] = useState<PeriodFromAPI[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFromAPI | null>(null);
    const [loadingPeriods, setLoadingPeriods] = useState(false);

    const [courses, setCourses] = useState<TeacherClass[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [courseScores, setCourseScores] = useState<Record<string, number>>({});

    const [openClassId, setOpenClassId] = useState<string | null>(null);
    const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
    const [visibleNotes, setVisibleNotes] = useState<Record<string, boolean>>({});
    const [processingModalOpen, setProcessingModalOpen] = useState(false);
    const [processingText, setProcessingText] = useState("");

    const toggleNoteVisibility = (noteId: string) => {
        setVisibleNotes((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
    };

    useEffect(() => {
        if (!teacherId) return;
        setLoading(true);
        fetch(`${API_URL}/academic-career/teachers/${teacherId}/`)
            .then((res) => { if (!res.ok) throw new Error(`Error ${res.status}`); return res.json(); })
            .then((data: TeacherFromAPI) => setTeacher(mapTeacher(data)))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [teacherId]);

    useEffect(() => {
        if (!teacherId) return;
        setLoadingPeriods(true);
        fetch(`${API_URL}/academic-workload/teacher-periods/?teacher_id=${teacherId}`)
            .then((res) => res.json())
            .then((data) => {
                setPeriods(data.periods ?? []);
                if (data.periods?.length > 0) setSelectedPeriod(data.periods[0]);
            })
            .finally(() => setLoadingPeriods(false));
    }, [teacherId]);

    useEffect(() => {
        if (!teacherId || !selectedPeriod) return;
        setLoadingCourses(true);
        setCourses([]);
        setCourseScores({});
        setOpenClassId(null);

        const periodId = selectedPeriod.period_id;

        Promise.all([
            fetch(`${API_URL}/academic-workload/teacher-courses/?teacher_id=${teacherId}&period_id=${periodId}`).then((r) => r.json()),
            fetch(`${API_URL}/academic-workload/course-scores/?teacher_id=${teacherId}&period_id=${periodId}`).then((r) => r.json()),
        ]).then(([coursesData, scoresData]) => {
            const mapped: TeacherClass[] = (coursesData.courses ?? []).map((c: CourseInPeriod) => ({
                id: String(c.course_id),
                name: c.name,
                comments: { positive: [], negative: [] },
                sentiment: { positiveReal: 0, negativeReal: 0, falsePositive: 0, falseNegative: 0 },
            }));
            setCourses(mapped);
            setCourseScores(scoresData.scores ?? {});
        }).finally(() => setLoadingCourses(false));
    }, [teacherId, selectedPeriod]);

    const handleAnalyzeComments = async (courseId: string) => {
        if (!selectedPeriod) return;
        setProcessingText("Se están analizando los comentarios con IA...");
        setProcessingModalOpen(true);

        try {
            const res = await fetch(`${API_URL}/academic-workload/ai-analysis/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher_id: parseInt(teacherId),
                    period_id: selectedPeriod.period_id,
                    course_id: parseInt(courseId),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Error en el análisis');

            setTeacher((prev) => prev ? { ...prev, finalScore: Math.round((data.final_score ?? prev.finalScore) * 10) / 10 } : prev);
            setCourseScores((prev) => ({ ...prev, [courseId]: data.final_score }));

            setCourses((prev) => prev.map((c) =>
                c.id === courseId ? { ...c, comments: { positive: [], negative: [] } } : c
            ));
        } catch (err) {
            console.error('Error al analizar:', err);
        } finally {
            setProcessingModalOpen(false);
        }
    };

    const toggleComments = async (classId: string) => {
        if (!selectedPeriod) return;
        if (openClassId === classId) { setOpenClassId(null); return; }
        setOpenClassId(classId);

        const alreadyLoaded = courses.find(
            (c) => c.id === classId && (c.comments.positive.length > 0 || c.comments.negative.length > 0)
        );
        if (alreadyLoaded) return;

        setLoadingComments((prev) => ({ ...prev, [classId]: true }));
        try {
            const res = await fetch(
                `${API_URL}/academic-workload/comments/?teacher_id=${teacherId}&course_id=${classId}&period_id=${selectedPeriod.period_id}`
            );
            if (!res.ok) throw new Error('Error al cargar comentarios');
            const data = await res.json();

            setCourses((prev) => prev.map((c) =>
                c.id === classId
                    ? {
                        ...c,
                        comments: { positive: data.positive ?? [], negative: data.negative ?? [] },
                        sentiment: {
                            positiveReal: data.positive?.length ?? 0,
                            negativeReal: data.negative?.length ?? 0,
                            falsePositive: 0,
                            falseNegative: 0,
                        },
                    }
                    : c
            ));
        } catch { } finally {
            setLoadingComments((prev) => ({ ...prev, [classId]: false }));
        }
    };

    if (loading) return (
        <div className="itv-layout">
            <div className="itv-empty-state"><div className="itv-loading-spinner"></div><p>Cargando expediente del docente...</p></div>
        </div>
    );

    if (error || !teacher) return (
        <div className="itv-layout">
            <div className="itv-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--url-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <h3 style={{ color: 'var(--url-danger)' }}>{error ?? "Docente no encontrado"}</h3>
                <button className="itv-btn-primary" onClick={() => router.back()} style={{ marginTop: '16px' }}>Volver al listado</button>
            </div>
        </div>
    );

    const sentimentData: SentimentChartItem[] = courses.map((c) => ({
        subject: c.name,
        positiveReal: c.sentiment.positiveReal,
        negativeReal: c.sentiment.negativeReal,
        falsePositive: c.sentiment.falsePositive,
        falseNegative: c.sentiment.falseNegative,
    }));

    return (
        <div className="itv-layout flex-1">
            <button className="itv-back-btn" onClick={() => router.back()}><IconBack />Volver al listado</button>

            <div className="itv-content-stack">
                <div className="itv-profile-card">
                    <div className="itv-profile-info">
                        <div className="itv-eyebrow"><IconProfileEyebrow />Expediente Docente</div>
                        <h1 className="itv-name">{teacher.name}</h1>
                        <h2 className="itv-department">{teacher.department}</h2>
                        <div className="itv-meta-grid">
                            <div className="itv-meta-item"><IconMail /><span>{teacher.email}</span></div>
                            <div className="itv-meta-item"><IconPhone /><span>{teacher.phone}</span></div>
                            <div className="itv-meta-item"><IconRole /><span>{teacher.role}</span></div>
                            <div className="itv-meta-item"><IconCalendar /><span>Desde {teacher.since}</span></div>
                        </div>
                    </div>
                    <div className="itv-score-container">
                        <div className="itv-score-card">
                            <div className="itv-score-icon"><IconTrending /></div>
                            <p className="itv-score-title">Nota Final</p>
                            <h2 className="itv-score-value">{teacher.finalScore.toFixed(2)}</h2>
                            <p className="itv-score-subtitle">Promedio ponderado</p>
                        </div>
                    </div>
                </div>

                <div className="itv-section-card">
                    <div className="itv-section-header">
                        <h2 className="itv-section-title">Semestre</h2>
                    </div>
                    {loadingPeriods ? (
                        <div className="itv-empty-state" style={{ padding: '24px' }}><div className="itv-loading-spinner"></div></div>
                    ) : periods.length === 0 ? (
                        <p className="itv-comment-empty">No hay períodos registrados.</p>
                    ) : (
                        <div className="itv-periods-list">
                            {periods.map((period) => (
                                <button
                                    key={period.period_id}
                                    className={`itv-period-btn ${selectedPeriod?.period_id === period.period_id ? 'active' : ''}`}
                                    onClick={() => setSelectedPeriod(period)}
                                >
                                    <IconPeriod />
                                    {period.name ?? `Período ${period.period_id}`}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="itv-section-card">
                    <div className="itv-section-header">
                        <h2 className="itv-section-title">
                            Clases {selectedPeriod ? `— ${selectedPeriod.name ?? `Período ${selectedPeriod.period_id}`}` : ''}
                        </h2>
                    </div>

                    {loadingCourses ? (
                        <div className="itv-empty-state" style={{ padding: '24px' }}><div className="itv-loading-spinner"></div></div>
                    ) : courses.length === 0 ? (
                        <p className="itv-comment-empty">No hay materias para este período.</p>
                    ) : (
                        <div className="itv-classes-list">
                            {courses.map((teacherClass) => {
                                const isOpen = openClassId === teacherClass.id;
                                const isLoadingThis = loadingComments[teacherClass.id];
                                const courseScore = courseScores[teacherClass.id] ?? null;
                                return (
                                    <div className="itv-class-card" key={teacherClass.id}>
                                        <div className="itv-class-header">
                                            <div className="itv-class-title">
                                                <span className="itv-class-icon"><IconBook /></span>
                                                <h3>{teacherClass.name}</h3>
                                            </div>
                                            <CourseNote
                                                noteId={teacherClass.id}
                                                score={courseScore}
                                                visibleNotes={visibleNotes}
                                                onToggle={toggleNoteVisibility}
                                            />
                                            <div className="itv-action-buttons">
                                                <button className="itv-analyze-btn" onClick={() => handleAnalyzeComments(teacherClass.id)}>
                                                    Analizar comentarios
                                                </button>
                                                <button type="button" className="itv-comments-toggle" onClick={() => toggleComments(teacherClass.id)}>
                                                    {isOpen ? "Ocultar comentarios" : "Ver comentarios"}
                                                </button>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="itv-comments-container">
                                                {isLoadingThis ? (
                                                    <div className="itv-empty-state" style={{ padding: '24px' }}><div className="itv-loading-spinner"></div></div>
                                                ) : (
                                                    <>
                                                        <div className="itv-comments-col positive">
                                                            <h4 className="itv-comments-title positive"><IconPositive />Comentarios Positivos</h4>
                                                            <div className="itv-comments-scrollable">
                                                                {teacherClass.comments.positive.length > 0
                                                                    ? teacherClass.comments.positive.map((comment, index) => (
                                                                        <div className="itv-comment positive" key={index}>{comment}</div>
                                                                    ))
                                                                    : <p className="itv-comment-empty">Sin comentarios aún</p>
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="itv-comments-col negative">
                                                            <h4 className="itv-comments-title negative"><IconNegative />Comentarios Negativos</h4>
                                                            <div className="itv-comments-scrollable">
                                                                {teacherClass.comments.negative.length > 0
                                                                    ? teacherClass.comments.negative.map((comment, index) => (
                                                                        <div className="itv-comment negative" key={index}>{comment}</div>
                                                                    ))
                                                                    : <p className="itv-comment-empty">Sin comentarios aún</p>
                                                                }
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="itv-section-card">
                    <div className="itv-section-header" style={{ marginBottom: '20px' }}>
                        <h2 className="itv-section-title">Análisis por Sentimiento</h2>
                    </div>
                    <SentimentAnalysisChart data={sentimentData} height={500} />
                </div>
            </div>

            <Modal open={processingModalOpen} title="Procesando" onClose={() => {}} width={420}>
                <div className="modal-content processing-modal-content">
                    <div className="processing-spinner" />
                    <p className="modal-text">{processingText}</p>
                    <p className="modal-text">Por favor espere un momento.</p>
                </div>
            </Modal>
        </div>
    );
}