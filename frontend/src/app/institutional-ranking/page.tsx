'use client';
import AdminDashboardPanel from "../components/AdminDashboardPanel";
import Pagination from "../components/pagination";
import { useEffect, useMemo, useState } from "react";
import "./institutional-ranking.css";




type Docente = {
    teacherId: number;
    rank: number;
    name: string;
    rating: number | null;
    students: number;
    specialties: string[];
};

type TrophyIconProps = {
    className?: string;
};

type SortOrder = "desc" | "asc";

export default function InstitutionalRanking() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [scoreNote, setScoreNote] = useState("");

    const [ratingSortOrder, setRatingSortOrder] = useState<SortOrder>("desc");

    const TrophyIcon = ({ className = "" }: TrophyIconProps) => (
        <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c3.859 0 7-3.141 7-7s-3.141-7-7-7c-3.86 0-7 3.141-7 7S8.14 22 12 22zM12 10c2.757 0 5 2.243 5 5s-2.243 5-5 5-5-2.243-5-5S9.243 10 12 10zM11 2H7v5.518c1.169-.782 2.531-1.296 4-1.459V2zM17 2h-4v4.059c1.469.163 2.831.677 4 1.459V2z"></path><path d="M10.019 15.811L9.551 18.537 12 17.25 14.449 18.537 13.981 15.811 15.963 13.879 13.225 13.481 12 11 10.775 13.481 8.037 13.879z"></path></svg>
    );

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(`${apiBaseUrl}/reporting/institutional-ranking/`);
                const payload = await response.json();

                if (!response.ok || !payload.ok) {
                    throw new Error(payload.error || "No se pudo obtener el ranking institucional.");
                }

                const mappedDocentes: Docente[] = payload.results.map((item: {
                    teacher_id: number;
                    rank_position: number;
                    name: string;
                    rating: number | null;
                    students_count: number;
                    specialties: string[];
                }) => ({
                    teacherId: item.teacher_id,
                    rank: item.rank_position,
                    name: item.name,
                    rating: item.rating,
                    students: item.students_count,
                    specialties: item.specialties,
                }));

                setDocentes(mappedDocentes);
                setScoreNote(payload.score_note || "");
            } catch (fetchError) {
                const message = fetchError instanceof Error
                    ? fetchError.message
                    : "No se pudo cargar el ranking institucional.";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, [apiBaseUrl]);

    const getMedalClass = (rank: number): string => {
        if (rank === 1) return "gold";
        if (rank === 2) return "silver";
        if (rank === 3) return "bronze";
        return "";
    };

    const totalItems = docentes.length;

    const sortedDocentes = useMemo(() => {
        return [...docentes].sort((a, b) => {
            if (a.rating === null && b.rating === null) {
                return a.name.localeCompare(b.name);
            }
            if (a.rating === null) return 1;
            if (b.rating === null) return -1;
            return ratingSortOrder === "desc"
                ? b.rating - a.rating
                : a.rating - b.rating;
        });
    }, [ratingSortOrder, docentes]);

    const paginatedDocentes = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return sortedDocentes.slice(start, end);
    }, [page, pageSize, sortedDocentes]);

    const handleRatingSort = () => {
        setRatingSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
        setPage(1);
    };

    return (
        <>

            <AdminDashboardPanel activePath="/institutional-ranking" />

            <div className="institutional-ranking-container">

                <div className="i-r-header">
                    <h1>Ranking institucional</h1>
                    <p>Docentes mejor evaluados</p>
                </div>

                <div className="i-r-content">
                    <div className="i-r-c-description">
                        <h2>Ranking Docente</h2>
                        <p>{docentes.length} docentes evaluados</p>
                        {scoreNote && <p>{scoreNote}</p>}
                        {error && <p>{error}</p>}
                    </div>
                    <div className="i-r-table-height">
                        <table className="i-r-table">
                            <thead>
                                <tr>
                                    <th>Posición</th>
                                    <th>Docente</th>
                                    <th className="sortable-header" onClick={handleRatingSort}>
                                        <span className="sortable-header-content">
                                            Calificación
                                            <span className="sort-icon">
                                                {ratingSortOrder === "desc" ?
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="2em" width="2em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.646 7.646a.5.5 0 01.708 0L8 10.293l2.646-2.647a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 010-.708z" clipRule="evenodd"></path><path fillRule="evenodd" d="M8 4.5a.5.5 0 01.5.5v5a.5.5 0 01-1 0V5a.5.5 0 01.5-.5z" clipRule="evenodd"></path></svg>
                                                    :
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="2em" width="2em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 5.5a.5.5 0 01.5.5v5a.5.5 0 01-1 0V6a.5.5 0 01.5-.5z" clipRule="evenodd"></path><path fillRule="evenodd" d="M7.646 4.646a.5.5 0 01.708 0l3 3a.5.5 0 01-.708.708L8 5.707 5.354 8.354a.5.5 0 11-.708-.708l3-3z" clipRule="evenodd"></path></svg>
                                                }
                                            </span>
                                        </span>
                                    </th>
                                    <th>Estudiantes</th>
                                    <th>Especialidades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && paginatedDocentes.length === 0 && (
                                    <tr>
                                        <td colSpan={5}>No hay docentes cargados todavía en la base local.</td>
                                    </tr>
                                )}
                                {paginatedDocentes.map((docente, index) => {
                                    const displayRank = docente.rank || ((page - 1) * pageSize + index + 1);

                                    return (
                                        <tr key={docente.teacherId}>
                                            <td>
                                                <div className="rank-cell">
                                                    {displayRank <= 3 ? (
                                                        <span className={`rank-medal ${getMedalClass(displayRank)}`}>
                                                            <TrophyIcon />
                                                        </span>
                                                    ) : (
                                                        <span className="rank-number">{displayRank}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <div className="teacher-cell">
                                                    <span className="teacher-name">{docente.name}</span>
                                                </div>
                                            </td>

                                            <td>
                                                {docente.rating !== null ? (
                                                    <>
                                                        <span className="rating-value">{docente.rating.toFixed(2)}</span>
                                                        <span className="rating-max"> / 5.0</span>
                                                    </>
                                                ) : (
                                                    <span className="rating-max">Pendiente</span>
                                                )}
                                            </td>

                                            <td>{docente.students}</td>

                                            <td>
                                                <div className="specialties-cell">
                                                    {docente.specialties.map((item) => (
                                                        <span key={item} className="specialty-badge">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
                            const safeSize = size > 0 ? size : 10;
                            setPageSize(safeSize);
                            setPage(1);
                        }}
                    />
                </div>

            </div>

        </>
    );
}
