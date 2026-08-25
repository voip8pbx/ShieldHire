'use client';

import { useState, useEffect } from 'react';


interface DashboardStats {
  totalBouncers: number;
  activeBouncers: number;
  pendingVerifications: number;
  totalUsers: number;
  activeEngagements: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBouncers: 0,
    activeBouncers: 0,
    pendingVerifications: 0,
    totalUsers: 0,
    activeEngagements: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real statistics from stats endpoint
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, change, icon, color }: { title: string, value: string | number, change?: string, icon: React.ReactNode, color: string }) => (
    <div className="card border-3 border-text-primary bg-bg-secondary p-3 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:border-primary-yellow hover:shadow-[4px_4px_0px_0px_var(--primary-yellow)] transition-all group rounded-none">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs text-text-muted uppercase tracking-widest mb-3 font-mono">
            // {title}
          </h3>
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="text-2xl sm:text-4xl font-black text-text-primary group-hover:text-primary-yellow transition-colors tracking-tight font-mono">
              {loading ? <div className="skeleton w-24 h-9" /> : value}
            </div>
            {change && (
              <div className="font-black text-black flex items-center gap-1 bg-success border border-black px-2 py-0.5 text-[10px] font-mono rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase">
                ▲ {change}
              </div>
            )}
          </div>
        </div>
        <div className={`p-2 sm:p-3 border-2 border-black bg-bg-primary text-xl sm:text-2xl text-text-primary shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none group-hover:bg-primary-yellow group-hover:text-black group-hover:translate-y-[-2px] transition-all`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="page-header border-b-3 border-text-primary pb-6 mb-8">
        <div>
          <h1 className="page-title text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-text-primary">
            SHIELDHIRE OPERATIONS
          </h1>
          <p className="page-subtitle text-xs font-mono text-text-muted uppercase tracking-wider mt-1">
            // Live security dispatch control & resource analytics
          </p>
        </div>
        <button
          className="btn btn-primary border-3 border-black text-black font-black uppercase font-mono shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] active:translate-x-1.5 active:translate-y-1.5 active:shadow-none transition-all w-full sm:w-auto"
          onClick={async () => {
            try {
              const res = await fetch('/api/dashboard/report');
              if (!res.ok) throw new Error('Failed');
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `shieldhire-report-${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              alert('Report generation failed. Please try again.');
            }
          }}
        >
          <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="font-black">EXPORT_SYSTEM_REPORT</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="TOTAL REVENUE"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}k`}
          change="12%"
          color="text-primary-yellow"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="ACTIVE BOOKINGS"
          value={stats.activeEngagements}
          change="5%"
          color="text-success"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          title="ACTIVE BOUNCERS"
          value={stats.activeBouncers}
          color="text-info"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="PENDING REQUESTS"
          value={stats.pendingVerifications}
          color="text-warning"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Performance & Quick Actions Grid */}
      <div className="content-grid grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Recent Activity / Chart */}
        <div className="card lg:col-span-2 p-4 sm:p-8 bg-[#0d0d0d] border-3 border-text-primary shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-sm sm:text-xl font-black text-text-primary uppercase tracking-wider font-mono">
                // SYSTEM_LOAD_METRICS
              </h3>
              <p className="text-[10px] font-mono text-text-dim uppercase mt-1">Live dispatch loads by weekday shifts</p>
            </div>
            <select className="input-field w-full sm:w-auto bg-bg-primary border-2 border-text-primary text-xs font-mono font-bold uppercase py-2 pl-2 pr-6 mx-0 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <option>SHIFT_LOAD: 7 DAYS</option>
              <option>SHIFT_LOAD: 30 DAYS</option>
              <option>SHIFT_LOAD: 90 DAYS</option>
            </select>
          </div>

          {/* Graphic Representation using neobrutalist blocky bars */}
          <div className="h-48 sm:h-64 flex items-end justify-between gap-1.5 sm:gap-3 px-2 sm:px-4 pb-4 border-b-3 border-text-primary">
            {[40, 65, 30, 85, 50, 75, 90, 60, 45, 80, 55, 70].map((h, i) => (
              <div key={i} className="w-full bg-primary-yellow/20 border-2 border-primary-yellow rounded-none relative group cursor-pointer hover:bg-primary-yellow hover:border-black hover:translate-y-[-4px] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.8)] transition-all duration-200" style={{ height: `${h}%` }}>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black border-2 border-primary-yellow text-white font-mono font-bold text-xs py-1.5 px-3 rounded-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {h * 10} OPERATIONS
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] sm:text-[11px] font-black text-text-muted mt-3 sm:mt-5 uppercase tracking-widest px-2 sm:px-4 font-mono">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-6">
          <div className="card border-3 border-text-primary bg-bg-secondary rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col p-4 sm:p-6">
            <h3 className="text-sm sm:text-lg font-black text-text-primary uppercase tracking-wider font-mono mb-4 text-center border-b-2 border-text-primary pb-2">
              QUICK_ACTIONS
            </h3>
            <div className="flex flex-col gap-3 sm:gap-4">
              <button
                onClick={() => window.location.href = '/verifications'}
                className="w-full flex items-center justify-between rounded-none border-2 border-text-primary bg-bg-primary hover:bg-surface-hover hover:border-primary-yellow hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(250,204,21,1)] transition-all group cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 border border-black bg-warning text-black text-lg">
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <div className="font-black text-xs text-text-primary font-mono uppercase">VERIFY APPROVALS</div>
                    <div className="text-[10px] font-mono text-text-dim uppercase">{stats.pendingVerifications} REQUESTS PENDING</div>
                  </div>
                </div>
                <span className="text-sm font-black text-text-dim group-hover:text-primary-yellow transition-colors font-mono">&gt;&gt;</span>
              </button>

              <button
                onClick={() => window.location.href = '/tracking'}
                className="w-full flex items-center justify-between rounded-none border-2 border-text-primary bg-bg-primary hover:bg-surface-hover hover:border-info hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] transition-all group cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 border border-black bg-info text-white text-lg">
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <div className="font-black text-xs text-text-primary font-mono uppercase">TRACK AGENTS</div>
                    <div className="text-[10px] font-mono text-text-dim uppercase">{stats.activeBouncers} DEPLOYED</div>
                  </div>
                </div>
                <span className="text-sm font-black text-text-dim group-hover:text-info transition-colors font-mono">&gt;&gt;</span>
              </button>

              <button
                onClick={() => window.location.href = '/bouncers'}
                className="w-full flex items-center justify-between rounded-none border-2 border-text-primary bg-bg-primary hover:bg-surface-hover hover:border-success hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(34,197,94,1)] transition-all group cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 border border-black bg-success text-black text-lg">
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <div className="font-black text-xs text-text-primary font-mono uppercase">MANAGE TEAM</div>
                    <div className="text-[10px] font-mono text-text-dim uppercase">{stats.totalBouncers} REGISTERED</div>
                  </div>
                </div>
                <span className="text-sm font-black text-text-dim group-hover:text-success transition-colors font-mono">&gt;&gt;</span>
              </button>
            </div>
          </div>

          <div className="card p-5 bg-[#0d0d0d] border-3 border-primary-yellow shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] rounded-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 border-2 border-black bg-success text-black">
                <svg className="w-6 h-6 text-black animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-base text-text-primary uppercase tracking-wider font-mono">SYSTEM_STATUS: ONLINE</h4>
                <p className="text-[10px] font-mono text-success uppercase font-black">All interfaces operational</p>
              </div>
            </div>
            <div className="w-full bg-bg-primary h-4 border-2 border-text-primary rounded-none overflow-hidden">
              <div className="bg-primary-yellow h-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


