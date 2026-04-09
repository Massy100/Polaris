'use client';
import { useState } from "react";
import "./individual-teacher-view.css";
import SentimentAnalysisChart, { SentimentChartItem } from "../components/sentiment-analysis-chart";




type CommentGroup = {
    positive: string[];
    negative: string[];
};

type SentimentMetrics = {
    positiveReal: number;
    negativeReal: number;
    falsePositive: number;
    falseNegative: number;
};

type TeacherClass = {
    id: string;
    name: string;
    comments: CommentGroup;
    sentiment: SentimentMetrics;
};

type Teacher = {
    id: string;
    name: string;
    department: string;
    email: string;
    phone: string;
    role: string;
    since: string;
    finalScore: number;
    classes: TeacherClass[];
};

export default function IndividualTeacherView() {

    // Mock data for the teacher's classes, comments, and sentiment metrics
    // From here generate the sentimentData array that will be passed to the SentimentAnalysisChart component, and also used to display the comments in each class card
    const teacherClasses: TeacherClass[] = [
        {
            id: "matematicas-avanzadas",
            name: "Matemáticas Avanzadas",
            comments: {
                positive: [
                    "Excelente profesor, explica muy claro",
                    "Las clases son muy dinámicas",
                    "Siempre está disponible para resolver dudas",
                    "Los ejemplos prácticos son muy útiles",
                    "Motiva mucho a los estudiantes",
                ],
                negative: [
                    "A veces va muy rápido en las explicaciones",
                    "Los exámenes son muy difíciles",
                    "Podría dar más tiempo para las tareas",
                ],
            },
            sentiment: {
                positiveReal: 42,
                negativeReal: 18,
                falsePositive: 8,
                falseNegative: 5,
            },
        },
        {
            id: "fisica-cuantica",
            name: "Física Cuántica",
            comments: {
                positive: [
                    "El contenido está muy bien organizado",
                    "Hace interesante una materia difícil",
                ],
                negative: [
                    "A veces falta más práctica en clase",
                ],
            },
            sentiment: {
                positiveReal: 38,
                negativeReal: 22,
                falsePositive: 6,
                falseNegative: 7,
            },
        },
        {
            id: "calculo-integral",
            name: "Cálculo Integral",
            comments: {
                positive: [
                    "Explica bien los ejercicios paso a paso",
                    "Tiene mucha paciencia para enseñar",
                ],
                negative: [
                    "La carga de tareas es algo pesada",
                ],
            },
            sentiment: {
                positiveReal: 30,
                negativeReal: 12,
                falsePositive: 4,
                falseNegative: 3,
            },
        },
    ];

    // Mock data for the teacher's personal information, score, and assigned classes
    const teacher: Teacher = {
        id: "maria-gonzalez",
        name: "Dr. María Elena González",
        department: "Departamento de Ciencias Exactas",
        email: "maria.gonzalez@universidad.edu",
        phone: "+52 555 765 4321",
        role: "Profesor Titular",
        since: "Enero 2015",
        finalScore: 8.6,
        classes: teacherClasses,
    };

    // Transform the teacherClasses data into the format needed for the SentimentAnalysisChart component
    // Each item in the sentimentData array will represent a class and its associated sentiment metrics
    const sentimentData: SentimentChartItem[] = teacherClasses.map((teacherClass) => ({
        subject: teacherClass.name,
        positiveReal: teacherClass.sentiment.positiveReal,
        negativeReal: teacherClass.sentiment.negativeReal,
        falsePositive: teacherClass.sentiment.falsePositive,
        falseNegative: teacherClass.sentiment.falseNegative,
    }));

    const [openClassId, setOpenClassId] = useState<string | null>(null);

    // Helper function to toggle the visibility of comments for a specific class when the "Ver comentarios" button is clicked
    const toggleComments = (classId: string): void => {
        setOpenClassId((prev) => (prev === classId ? null : classId));
    };

    return (
        <div className="individual-teacher-general-container">
            <div className="individual-teacher-presentation-container">
                <div className="individual-teacher-personal-info">
                    <h1 className="individual-teacher-name">{teacher.name}</h1>
                    <h2 className="individual-teacher-department">{teacher.department}</h2>

                    <div className="individual-teacher-meta">
                        <div className="individual-teacher-meta-item">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                                <path d="M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 110.8V792H136V270.8l-27.6-21.5 39.3-50.5 42.8 33.3h643.1l42.8-33.3 39.3 50.5-27.7 21.5zM833.6 232L512 482 190.4 232l-42.8-33.3-39.3 50.5 27.6 21.5 341.6 265.6a55.99 55.99 0 0 0 68.7 0L888 270.8l27.6-21.5-39.3-50.5-42.7 33.2z"></path>
                            </svg>
                            <p>{teacher.email}</p>
                        </div>

                        <div className="individual-teacher-meta-item">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.707,12.293c-0.391-0.391-1.023-0.391-1.414,0l-1.594,1.594c-0.739-0.22-2.118-0.72-2.992-1.594 s-1.374-2.253-1.594-2.992l1.594-1.594c0.391-0.391,0.391-1.023,0-1.414l-4-4c-0.391-0.391-1.023-0.391-1.414,0L3.581,5.005 c-0.38,0.38-0.594,0.902-0.586,1.435c0.023,1.424,0.4,6.37,4.298,10.268s8.844,4.274,10.269,4.298c0.005,0,0.023,0,0.028,0 c0.528,0,1.027-0.208,1.405-0.586l2.712-2.712c0.391-0.391,0.391-1.023,0-1.414L17.707,12.293z M17.58,19.005 c-1.248-0.021-5.518-0.356-8.873-3.712c-3.366-3.366-3.692-7.651-3.712-8.874L7,4.414L9.586,7L8.293,8.293 C8.054,8.531,7.952,8.875,8.021,9.205c0.024,0.115,0.611,2.842,2.271,4.502s4.387,2.247,4.502,2.271 c0.333,0.071,0.674-0.032,0.912-0.271L17,14.414L19.586,17L17.58,19.005z"></path>
                            </svg>
                            <p>{teacher.phone}</p>
                        </div>

                        <div className="individual-teacher-meta-item">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <g>
                                    <path fill="none" d="M0 0h24v24H0z"></path>
                                    <path fillRule="nonzero" d="M12 7a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 1.5l1.323 2.68 2.957.43-2.14 2.085.505 2.946L12 17.25l-2.645 1.39.505-2.945-2.14-2.086 2.957-.43L12 10.5zM18 2v3l-1.363 1.138A9.935 9.935 0 0 0 13 5.049L13 2 18 2zm-7-.001v3.05a9.935 9.935 0 0 0-3.636 1.088L6 5V2l5-.001z"></path>
                                </g>
                            </svg>
                            <p>{teacher.role}</p>
                        </div>

                        <div className="individual-teacher-meta-item">
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <p>Desde {teacher.since}</p>
                        </div>
                    </div>
                </div>
                <div className="individual-teacher-score">
                    <div className="individual-teacher-score-card">
                        <div className="individual-teacher-score-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M17 6H23V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        <p className="individual-teacher-score-title">Nota Final</p>
                        <h2 className="individual-teacher-score-value">{teacher.finalScore}</h2>
                        <p className="individual-teacher-score-subtitle">Promedio ponderado</p>
                    </div>
                </div>
            </div>

            <div className="individual-teacher-classes-section">
                <h2 className="individual-teacher-section-title">Clases Asignadas</h2>

                {teacherClasses.map((teacherClass) => {
                    const isOpen = openClassId === teacherClass.id;

                    return (
                        <div className="individual-teacher-class-card" key={teacherClass.id}>
                            <div className="individual-teacher-class-header">
                                <div className="individual-teacher-class-title">
                                    <span className="individual-teacher-class-icon">
                                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                    </span>
                                    <h3>{teacherClass.name}</h3>
                                </div>

                                <button type="button" className="individual-teacher-comments-toggle" onClick={() => toggleComments(teacherClass.id)}>
                                    {isOpen ? "Ocultar comentarios" : "Ver comentarios"}
                                </button>
                            </div>

                            {isOpen && (
                                <div className="individual-teacher-comments-container">
                                    <div className="individual-teacher-comments-column positive">
                                        <h4 className="individual-teacher-comments-title positive">
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M885.9 533.7c16.8-22.2 26.1-49.4 26.1-77.7 0-44.9-25.1-87.4-65.5-111.1a67.67 67.67 0 0 0-34.3-9.3H572.4l6-122.9c1.4-29.7-9.1-57.9-29.5-79.4A106.62 106.62 0 0 0 471 99.9c-52 0-98 35-111.8 85.1l-85.9 311H144c-17.7 0-32 14.3-32 32v364c0 17.7 14.3 32 32 32h601.3c9.2 0 18.2-1.8 26.5-5.4 47.6-20.3 78.3-66.8 78.3-118.4 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7 0-12.6-1.8-25-5.4-37 16.8-22.2 26.1-49.4 26.1-77.7-.2-12.6-2-25.1-5.6-37.1zM184 852V568h81v284h-81zm636.4-353l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 16.5-7.2 32.2-19.6 43l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 16.5-7.2 32.2-19.6 43l-21.9 19 13.9 25.4a56.2 56.2 0 0 1 6.9 27.3c0 22.4-13.2 42.6-33.6 51.8H329V564.8l99.5-360.5a44.1 44.1 0 0 1 42.2-32.3c7.6 0 15.1 2.2 21.1 6.7 9.9 7.4 15.2 18.6 14.6 30.5l-9.6 198.4h314.4C829 418.5 840 436.9 840 456c0 16.5-7.2 32.1-19.6 43z"></path></svg>
                                            <p>Comentarios Positivos</p>
                                        </h4>

                                        <div className="individual-teacher-comments-list scrollable">
                                            {teacherClass.comments.positive.map((comment, index) => (
                                                <div
                                                    className="individual-teacher-comment positive"
                                                    key={`${teacherClass.id}-positive-${index}`}
                                                >
                                                    {comment}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="individual-teacher-comments-column negative">
                                        <h4 className="individual-teacher-comments-title negative">
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M20,3h-3H6.693C5.864,3,5.112,3.521,4.82,4.298l-2.757,7.351C2.021,11.761,2,11.88,2,12v2c0,1.103,0.897,2,2,2h5.612 L8.49,19.367c-0.203,0.608-0.101,1.282,0.274,1.802C9.14,21.689,9.746,22,10.388,22H12c0.297,0,0.578-0.132,0.769-0.36l4.7-5.64 H20c1.103,0,2-0.897,2-2V5C22,3.897,21.103,3,20,3z M11.531,20h-1.145l1.562-4.684c0.103-0.305,0.051-0.64-0.137-0.901 C11.623,14.154,11.321,14,11,14H4v-1.819L6.693,5H16v9.638L11.531,20z M18,14V5h2l0.001,9H18z"></path></svg>
                                            <p>Comentarios Negativos</p>
                                        </h4>

                                        <div className="individual-teacher-comments-list scrollable">
                                            {teacherClass.comments.negative.map((comment, index) => (
                                                <div
                                                    className="individual-teacher-comment negative"
                                                    key={`${teacherClass.id}-negative-${index}`}
                                                >
                                                    {comment}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="individual-teacher-sentiment-analysis-section">
                <h2 className="individual-teacher-section-title">Análisis por Sentimiento</h2>
                <SentimentAnalysisChart
                    data={sentimentData}
                    height={500}
                />
            </div>
        </div >
    );
}
