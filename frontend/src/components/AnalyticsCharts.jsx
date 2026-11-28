import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const PIE_COLORS = [
    "#4f46e5",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#14b8a6",
    "#64748b",
];

const AnalyticsCharts = ({
    clubRegistrations = [],
    categoryDistribution = [],
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Club-wise event registrations */}
            <section className="card p-6 space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Club-wise Event Registrations
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Total active registrations across approved events per club
                    </p>
                </div>

                {clubRegistrations.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                        No approved event registration data available yet.
                    </div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={clubRegistrations}
                                margin={{ top: 10, right: 16, left: 0, bottom: 24 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                                <XAxis
                                    dataKey="clubName"
                                    tick={{ fontSize: 11 }}
                                    interval={0}
                                    angle={-15}
                                    textAnchor="end"
                                    height={50}
                                />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar
                                    dataKey="registrations"
                                    name="Registrations"
                                    fill="#4f46e5"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            {/* Pie Chart: Category-wise event distribution */}
            <section className="card p-6 space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Category-wise Event Distribution
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Breakdown of campus events by category
                    </p>
                </div>

                {categoryDistribution.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                        No event category data available yet.
                    </div>
                ) : (
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryDistribution}
                                    dataKey="count"
                                    nameKey="category"
                                    cx="50%"
                                    cy="45%"
                                    outerRadius={85}
                                    label={({ category, count }) => `${category} (${count})`}
                                >
                                    {categoryDistribution.map((entry, idx) => (
                                        <Cell
                                            key={entry.category}
                                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AnalyticsCharts;
