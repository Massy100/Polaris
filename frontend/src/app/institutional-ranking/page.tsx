'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Pagination from "../components/pagination";
import "./institutional-ranking.css";

type Docente = {
    id: number;
    rank: number;
    initials: string;
    name: string;
    rating: number;
    specialties: string[];
};

type SortOrder = "desc" | "asc";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const IconEyebrow = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const IconTitle = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--url-navy-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20v-6M6 20V10M18 20V4"></path>
    </svg>
);

const TrophyIcon = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22c3.859 0 7-3.141 7-7s-3.141-7-7-7c-3.86 0-7 3.141-7 7S8.14 22 12 22zM12 10c2.757 0 5 2.243 5 5s-2.243 5-5 5-5-2.243-5-5S9.243 10 12 10zM11 2H7v5.518c1.169-.782 2.531-1.296 4-1.459V2zM17 2h-4v4.059c1.469.163 2.831.677 4 1.459V2z"></path>
        <path d="M10.019 15.811L9.551 18.537 12 17.25 14.449 18.537 13.981 15.811 15.963 13.879 13.225 13.481 12 11 10.775 13.481 8.037 13.879z"></path>
    </svg>
);

export default function InstitutionalRanking() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [ratingSortOrder, setRatingSortOrder] = useState<SortOrder>("desc");
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const getInitials = (fullName: string): string => {
        return fullName
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0].toUpperCase())
            .join('');
    };

    const fetchTeachers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            queryParams.append('page', page.toString());
            queryParams.append('page_size', pageSize.toString());
            const url = `${API_URL}/academic-career/teachers/?${queryParams.toString()}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Error al cargar los docentes');
            }

            const data = await response.json();

            const transformed: Docente[] = data.results.map((teacher: any, index: number) => ({
                id: teacher.teacher_id,
                rank: (page - 1) * pageSize + index + 1,
                initials: getInitials(teacher.full_name || `${teacher.first_name} ${teacher.last_name}`),
                name: teacher.full_name || `${teacher.first_name} ${teacher.last_name}`,
                rating: teacher.rating ?? 0,
                specialties: teacher.specialties || [],
            }));

            setDocentes(transformed);
            setTotalItems(data.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [page, pageSize]);

    useEffect(() => {
        if (isMounted) {
            fetchTeachers();
        }
    }, [fetchTeachers, isMounted]);

    const getMedalClass = (rank: number): string => {
        if (rank === 1) return "gold";
        if (rank === 2) return "silver";
        if (rank === 3) return "bronze";
        return "";
    };

    const sortedDocentes = useMemo(() => {
        return [...docentes].sort((a, b) => {
            return ratingSortOrder === "desc"
                ? b.rating - a.rating
                : a.rating - b.rating;
        });
    }, [ratingSortOrder, docentes]);

    const handleRatingSort = () => {
        setRatingSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
        setPage(1);
    };

    if (!isMounted) return null;

    return (
        <div className="ir-layout flex-1">
            <div className="ir-header-main">
                <div className="ir-eyebrow">
                    <IconEyebrow />
                    Desempeño Institucional
                </div>
                <div className="ir-title-row">
                    <IconTitle />
                    <h1>Ranking de Docentes</h1>
                </div>
                <p className="ir-subtitle-main">
                    Listado de los docentes mejor evaluados de la facultad durante el período académico actual.
                </p>
            </div>

            <main className="ir-main-content">
                <div className="ir-card">
                    <div className="ir-card-header">
                        <div className="ir-card-title-group">
                            <h3>Clasificación General</h3>
                            <p>{totalItems} {totalItems === 1 ? 'docente evaluado' : 'docentes evaluados'}</p>
                        </div>
                    </div>

                    <div className="ir-table-wrap">
                        <table className="ir-table">
                            <thead>
                                <tr>
                                    <th className="ir-th" style={{ width: '12%' }}>Posición</th>
                                    <th className="ir-th" style={{ width: '35%' }}>Docente</th>
                                    <th className="ir-th sortable-header" style={{ width: '20%' }} onClick={handleRatingSort}>
                                        <span className="sortable-header-content">
                                            Calificación
                                            <span className="sort-icon">
                                                {ratingSortOrder === "desc" ? (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                                ) : (
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                                                )}
                                            </span>
                                        </span>
                                    </th>
                                    <th className="ir-th" style={{ width: '33%' }}>Especialidades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--url-text-sec)' }}>
                                            Cargando clasificación...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--url-danger)' }}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : docentes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--url-text-sec)' }}>
                                            No hay docentes registrados en este período.
                                        </td>
                                    </tr>
                                ) : (
                                    sortedDocentes.map((docente, index) => {
                                        const displayRank = (page - 1) * pageSize + index + 1;

                                        return (
                                            <tr 
                                                key={docente.id}
                                                className="ir-tr ir-tr-clickable"
                                                onClick={() => router.push(`/individual-teacher-view/${docente.id}`)}
                                            >
                                                <td className="ir-td">
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
                                                <td className="ir-td">
                                                    <div className="teacher-cell">
                                                        <span className="teacher-name">{docente.name}</span>
                                                    </div>
                                                </td>
                                                <td className="ir-td">
                                                    <span className="rating-value">{docente.rating.toFixed(2)}</span>
                                                    <span className="rating-max"> / 5.0</span>
                                                </td>
                                                <td className="ir-td">
                                                    <div className="specialties-cell">
                                                        {docente.specialties.length > 0 ? (
                                                            docente.specialties.map((item) => (
                                                                <span key={item} className="specialty-badge">
                                                                    {item}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="specialty-badge" style={{ background: 'transparent', border: '1px solid var(--url-border)', color: 'var(--url-text-muted)' }}>—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ir-card-footer">
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
                    </div>
                </div>
            </main>
        </div>
    );
}