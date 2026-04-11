'use client';
import AdminDashboardPanel from "../components/admin-dashboard-panel";
import Pagination from "../components/pagination";
import { useMemo, useState } from "react";
import "./institutional-ranking.css";

type Docente = {
    rank: number;
    initials: string;
    name: string;
    rating: number;
    students: number;
    specialties: string[];
};

type TrophyIconProps = {
    className?: string;
};

type SortOrder = "desc" | "asc";

export default function InstitutionalRanking() {

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [ratingSortOrder, setRatingSortOrder] = useState<SortOrder>("desc");

    const TrophyIcon = ({ className = "" }: TrophyIconProps) => (
        <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c3.859 0 7-3.141 7-7s-3.141-7-7-7c-3.86 0-7 3.141-7 7S8.14 22 12 22zM12 10c2.757 0 5 2.243 5 5s-2.243 5-5 5-5-2.243-5-5S9.243 10 12 10zM11 2H7v5.518c1.169-.782 2.531-1.296 4-1.459V2zM17 2h-4v4.059c1.469.163 2.831.677 4 1.459V2z"></path><path d="M10.019 15.811L9.551 18.537 12 17.25 14.449 18.537 13.981 15.811 15.963 13.879 13.225 13.481 12 11 10.775 13.481 8.037 13.879z"></path></svg>
    );

    // Array of docentes that use in the table
    const docentes: Docente[] = [
        {
            rank: 1,
            initials: "DM",
            name: "Dr. María González",
            rating: 4.92,
            students: 156,
            specialties: ["Cálculo", "Álgebra"],
        },
        {
            rank: 2,
            initials: "DC",
            name: "Dr. Carlos Ramírez",
            rating: 4.88,
            students: 142,
            specialties: ["Estructuras", "Materiales"],
        },
        {
            rank: 3,
            initials: "DA",
            name: "Dra. Ana Martínez",
            rating: 4.85,
            students: 134,
            specialties: ["Literatura", "Filosofía"],
        },
        {
            rank: 4,
            initials: "DR",
            name: "Dr. Roberto Silva",
            rating: 4.82,
            students: 128,
            specialties: ["Física", "Química"],
        },
        {
            rank: 5,
            initials: "DP",
            name: "Dra. Patricia López",
            rating: 4.78,
            students: 165,
            specialties: ["Marketing", "Finanzas"],
        },
        {
            rank: 6,
            initials: "JF",
            name: "Dr. Jorge Fernández",
            rating: 4.75,
            students: 145,
            specialties: ["Estadística", "Datos"],
        },
        {
            rank: 7,
            initials: "LM",
            name: "Dra. Laura Méndez",
            rating: 4.72,
            students: 139,
            specialties: ["Biología", "Química"],
        },
        {
            rank: 8,
            initials: "AS",
            name: "Dr. Andrés Soto",
            rating: 4.69,
            students: 133,
            specialties: ["Historia", "Política"],
        },
        {
            rank: 9,
            initials: "CR",
            name: "Dra. Camila Ruiz",
            rating: 4.65,
            students: 121,
            specialties: ["Diseño", "Arte"],
        },
        {
            rank: 10,
            initials: "PV",
            name: "Dr. Pablo Vargas",
            rating: 4.61,
            students: 112,
            specialties: ["Economía", "Finanzas"],
        },
        {
            rank: 11,
            initials: "MN",
            name: "Dra. Marta Núñez",
            rating: 4.58,
            students: 107,
            specialties: ["Derecho", "Ética"],
        },
        {
            rank: 12,
            initials: "PV",
            name: "Dr. Pablo Vargas",
            rating: 4.50,
            students: 112,
            specialties: ["Economía", "Finanzas"],
        },
        {
            rank: 13,
            initials: "MN",
            name: "Dra. Marta Núñez",
            rating: 4.48,
            students: 107,
            specialties: ["Derecho", "Ética"],
        },
    ];

    const getMedalClass = (rank: number): string => {
        if (rank === 1) return "gold";
        if (rank === 2) return "silver";
        if (rank === 3) return "bronze";
        return "";
    };

    const totalItems = docentes.length;

    const sortedDocentes = useMemo(() => {
        return [...docentes].sort((a, b) => {
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

            <AdminDashboardPanel />

            <div className="institutional-ranking-container">

                <div className="i-r-header">
                    <h1>Ranking institucional</h1>
                    <p>Docentes mejor evaluados</p>
                </div>

                <div className="i-r-content">
                    <div className="i-r-c-description">
                        <h2>Ranking Docente</h2>
                        <p>{docentes.length} docentes evaluados</p>
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
                                {paginatedDocentes.map((docente, index) => {
                                    const displayRank = (page - 1) * pageSize + index + 1;

                                    return (
                                        <tr key={`${docente.name}-${docente.rating}`}>
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