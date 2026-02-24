interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    trend?: number;
    trendLabel?: string;
    color?: 'gold' | 'blue' | 'green' | 'purple';
}

export default function StatCard({
    title,
    value,
    icon,
    trend,
    trendLabel,
    color = 'gold',
}: StatCardProps) {
    const colorClasses = {
        gold: 'gradient-gold',
        blue: 'gradient-blue',
        green: 'bg-gradient-to-br from-success to-emerald-600',
        purple: 'bg-gradient-to-br from-pending to-purple-600',
    };

    const isPositiveTrend = trend && trend > 0;

    return (
        <div className="card p-6 group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-text-secondary mb-2">{title}</p>
                    <h3 className="text-3xl font-bold text-text-primary mb-3">
                        {value}
                    </h3>
                    {trend !== undefined && (
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-sm font-semibold ${isPositiveTrend
                                        ? 'text-success'
                                        : 'text-error'
                                    }`}
                            >
                                {isPositiveTrend ? '↑' : '↓'} {Math.abs(trend)}%
                            </span>
                            {trendLabel && (
                                <span className="text-xs text-text-tertiary">
                                    {trendLabel}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div
                    className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center text-2xl transform group-hover:scale-110 transition-transform duration-300`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}


