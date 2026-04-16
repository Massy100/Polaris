'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminDashboardPanel from "../components/admin-dashboard-panel";
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

type TrophyIconProps = {
    className?: string;
};

type SortOrder = "desc" | "asc";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function InstitutionalRanking() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [ratingSortOrder, setRatingSortOrder] = useState<SortOrder>("desc");
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    const TrophyIcon = ({ className = "" }: TrophyIconProps) => (
        <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22c3.859 0 7-3.141 7-7s-3.141-7-7-7c-3.86 0-7 3.141-7 7S8.14 22 12 22zM12 10c2.757 0 5 2.243 5 5s-2.243 5-5 5-5-2.243-5-5S9.243 10 12 10zM11 2H7v5.518c1.169-.782 2.531-1.296 4-1.459V2zM17 2h-4v4.059c1.469.163 2.831.677 4 1.459V2z"></path>
            <path d="M10.019 15.811L9.551 18.537 12 17.25 14.449 18.537 13.981 15.811 15.963 13.879 13.225 13.481 12 11 10.775 13.481 8.037 13.879z"></path>
        </svg>
    );

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
                rating: teacher.rating ?? 0,// Rating will default to 0 until the evaluation system is implemented
                specialties: teacher.specialties || [],
            }));

            setDocentes(transformed);
            setTotalItems(data.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            console.error('Error fetching teachers:', err);
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

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminDashboardPanel
                userName="Usuario Admin"
                activePath={pathname}
                onNavigate={(path) => router.push(path)}
                onLogout={() => router.push("/")}
            />

            <div className="flex-1 institutional-ranking-container">
                <div className="i-r-header">
                    <h1>Ranking institucional</h1>
                    <p>Docentes mejor evaluados</p>
                </div>

                <div className="i-r-content">
                    <div className="i-r-c-description">
                        <h2>Ranking Docente</h2>
                        <p>{totalItems} docentes evaluados</p>
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
                                                {ratingSortOrder === "desc" ? " ▼" : " ▲"}
                                            </span>
                                        </span>
                                    </th>
                                    <th>Especialidades</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: 16, textAlign: 'center' }}>
                                            Cargando docentes...
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: 'red' }}>
                                            {error}
                                        </td>
                                    </tr>
                                ) : docentes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: 16, textAlign: 'center' }}>
                                            No hay docentes registrados
                                        </td>
                                    </tr>
                                ) : (
                                    sortedDocentes.map((docente, index) => {
                                        const displayRank = (page - 1) * pageSize + index + 1;

                                        return (
                                            <tr
                                                key={docente.id}
                                                onClick={() => router.push(`/individual-teacher-view/${docente.id}`)}
                                                style={{ cursor: 'pointer' }}
                                                className="ranking-row-hover"
                                            >
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
                                                    <span className="rating-value">{docente.rating.toFixed(2)}</span>
                                                    <span className="rating-max"> / 5.0</span>
                                                </td>
                                                <td>
                                                    <div className="specialties-cell">
                                                        {docente.specialties.length > 0 ? (
                                                            docente.specialties.map((item) => (
                                                                <span key={item} className="specialty-badge">
                                                                    {item}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="specialty-badge">—</span>
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
        </div>
    );
}