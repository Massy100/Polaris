'use client';
import { useEffect, useState } from "react";
import "../styles/sentiment-analysis-chart.css";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';




export type SentimentChartItem = {
    subject: string;
    positiveReal: number;
    negativeReal: number;
    falsePositive: number;
    falseNegative: number;
};

type SentimentAnalysisChartProps = {
    data: SentimentChartItem[];
    height?: number;
};

type CustomTooltipProps = {
    active?: boolean;
    payload?: Array<{
        value: number;
        dataKey: string;
        color: string;
        payload: SentimentChartItem;
    }>;
    label?: string;
};

const BAR_COLORS = {
    positiveReal: '#3B82F6',
    negativeReal: '#FBBF24',
    falsePositive: '#60A5FA',
    falseNegative: '#FCD34D',
};

// Custom tooltip component for the chart to display detailed information on hover
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const currentData = payload[0]?.payload;

    if (!currentData) {
        return null;
    }

    return (
        <div className="sentiment-chart-tooltip">
            <p className="sentiment-chart-tooltip-title">{label}</p>
            <p className="sentiment-chart-tooltip-item positive-real">
                Positivos Reales : {currentData.positiveReal}
            </p>
            <p className="sentiment-chart-tooltip-item negative-real">
                Negativos Reales : {currentData.negativeReal}
            </p>
            <p className="sentiment-chart-tooltip-item false-positive">
                Falsos Positivos : {currentData.falsePositive}
            </p>
            <p className="sentiment-chart-tooltip-item false-negative">
                Falsos Negativos : {currentData.falseNegative}
            </p>
        </div>
    );
}

export default function SentimentAnalysisChart({
    data,
    height = 420,
}: SentimentAnalysisChartProps) {

    // helper to hide x-axis ticks on mobile devices
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 600px)");

        const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(event.matches);
        };

        handleChange(mediaQuery);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        } else {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);

    return (
        <div className="sentiment-chart-card">
            <div className="sentiment-chart-wrapper" style={{ height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
                        barGap={4}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={true} />
                        <XAxis
                            dataKey="subject"
                            tick={isMobile ? false : { fontSize: 16, fill: '#475569' }}
                            axisLine={{ stroke: '#94A3B8' }}
                            tickLine={isMobile ? false : { stroke: '#94A3B8' }}
                        />
                        <YAxis
                            tick={{ fontSize: 16, fill: '#475569' }}
                            axisLine={{ stroke: '#94A3B8' }}
                            tickLine={{ stroke: '#94A3B8' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{
                                fontSize: '14px',
                                paddingTop: '16px',
                            }}
                        />

                        <Bar
                            dataKey="positiveReal"
                            name="Positivos Reales"
                            fill={BAR_COLORS.positiveReal}
                            radius={[0, 0, 0, 0]}
                        />

                        <Bar
                            dataKey="negativeReal"
                            name="Negativos Reales"
                            fill={BAR_COLORS.negativeReal}
                            radius={[0, 0, 0, 0]}
                        />

                        <Bar
                            dataKey="falsePositive"
                            name="Falsos Positivos"
                            fill={BAR_COLORS.falsePositive}
                            radius={[0, 0, 0, 0]}
                        />

                        <Bar
                            dataKey="falseNegative"
                            name="Falsos Negativos"
                            fill={BAR_COLORS.falseNegative}
                            radius={[0, 0, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
