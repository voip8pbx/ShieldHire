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

  // Use mock data for now if API fails (common in dev environment without full backend)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalBouncers: 124,
        activeBouncers: 45,
        pendingVerifications: 8,
        totalUsers: 892,
        activeEngagements: 12,
        totalRevenue: 1250000
      });
      setLoading(false);
    }, 1000);
  }, []);

  const StatCard = ({ title, value, change, icon, color }: { title: string, value: string | number, change?: string, icon: React.ReactNode, color: string }) => (
    <div className="card p-4 sm:p-6 lg:p-8 border-l-4 border-[var(--primary-yellow)] hover:border-l-[var(--secondary-yellow)] transition-all group">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 truncate">
            {title}
          </h3>
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-primary)] group-hover:text-[var(--primary-yellow)] transition-colors tracking-tight">
              {loading ? <div className="skeleton w-24 h-8 sm:h-10" /> : value}
            </div>
            {change && (
              <div className="text-sm font-semibold text-[var(--success)] flex items-center gap-1.5 bg-[var(--success-bg)] px-3 py-1 rounded-full whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {change}
              </div>
            )}
          </div>
        </div>
        <div className={`p-3 sm:p-4 rounded-xl ${color} bg-opacity-10 text-2xl sm:text-3xl shrink-0 transform group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Dashboard Overview
          </h1>
          <p className="page-subtitle">
            Real-time insights into security operations and performance
          </p>
        </div>
        <button className="btn btn-primary shadow-lg hover:shadow-xl hover:scale-105 transition-all w-full sm:w-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Download Report</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}k`}
          change="12%"
          color="bg-[var(--primary-yellow)] text-[var(--primary-yellow)]"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Operations"
          value={stats.activeEngagements}
          change="5%"
          color="bg-[var(--success)] text-[var(--success)]"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          title="Bouncers Online"
          value={stats.activeBouncers}
          color="bg-[var(--info)] text-[var(--info)]"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingVerifications}
          color="bg-[var(--warning)] text-[var(--warning)]"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Performance & Quick Actions Grid */}
      <div className="content-grid">
        {/* Recent Activity / Chart Placeholder */}
        <div className="card p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface)] border border-[var(--border-light)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Performance Analytics
            </h3>
            <select className="input-field w-full sm:w-auto bg-[var(--surface)] text-sm">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>

          {/* Simple Graphic Representation using CSS bars */}
          <div className="h-48 sm:h-64 lg:h-80 flex items-end justify-between gap-2 sm:gap-4 lg:gap-6 px-2 sm:px-4 pb-4 border-b border-[var(--border-gray)]">
            {[40, 65, 30, 85, 50, 75, 90, 60, 45, 80, 55, 70].map((h, i) => (
              <div key={i} className="w-full bg-[var(--surface-elevated)] rounded-t-lg relative group cursor-pointer hover:bg-[var(--primary-yellow)] transition-all duration-300 shadow-md" style={{ height: `${h}%` }}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--bg-secondary)] border border-[var(--border-gray)] text-[var(--text-primary)] font-bold text-xs sm:text-sm py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                  {h * 10} Operations
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs sm:text-sm font-bold text-[var(--text-muted)] mt-4 sm:mt-6 uppercase tracking-widest px-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-4 sm:space-y-6">
          <div className="card p-4 sm:p-6 border border-[var(--border-light)]">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">
              Quick Actions
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => window.location.href = '/verifications'}
                className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 border-[var(--border-gray)] hover:border-[var(--primary-yellow)] hover:bg-[var(--surface-elevated)] transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="p-2.5 sm:p-3 rounded-lg bg-[var(--warning-bg)] text-[var(--warning)] text-xl shadow-inner">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-base text-[var(--text-primary)]">Verify Approvals</div>
                    <div className="text-sm font-medium text-[var(--text-dim)]">{stats.pendingVerifications} requests</div>
                  </div>
                </div>
                <span className="text-xl text-[var(--text-dim)] group-hover:text-[var(--primary-yellow)] transition-colors">→</span>
              </button>

              <button
                onClick={() => window.location.href = '/tracking'}
                className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 border-[var(--border-gray)] hover:border-[var(--info)] hover:bg-[var(--surface-elevated)] transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="p-2.5 sm:p-3 rounded-lg bg-[var(--info-bg)] text-[var(--info)] text-xl shadow-inner">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-base text-[var(--text-primary)]">Track Agents</div>
                    <div className="text-sm font-medium text-[var(--text-dim)]">{stats.activeBouncers} active</div>
                  </div>
                </div>
                <span className="text-xl text-[var(--text-dim)] group-hover:text-[var(--info)] transition-colors">→</span>
              </button>

              <button
                onClick={() => window.location.href = '/bouncers'}
                className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 border-[var(--border-gray)] hover:border-[var(--success)] hover:bg-[var(--surface-elevated)] transition-all group cursor-pointer hover:shadow-md"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="p-2.5 sm:p-3 rounded-lg bg-[var(--success-bg)] text-[var(--success)] text-xl shadow-inner">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-base text-[var(--text-primary)]">Manage Team</div>
                    <div className="text-sm font-medium text-[var(--text-dim)]">{stats.totalBouncers} registered</div>
                  </div>
                </div>
                <span className="text-xl text-[var(--text-dim)] group-hover:text-[var(--success)] transition-colors">→</span>
              </button>
            </div>
          </div>

          <div className="card p-4 sm:p-6 bg-gradient-to-r from-[var(--accent-glow)] to-[var(--bg-primary)] border-2 border-[var(--primary-yellow)] shadow-[0_0_30px_rgba(250,204,21,0.15)]">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 rounded-lg bg-[var(--success-bg)]">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--success)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-black text-lg sm:text-xl text-[var(--text-primary)] uppercase tracking-wide">System Status</h4>
                <p className="text-sm font-semibold text-[var(--text-muted)]">All systems operational</p>
              </div>
            </div>
            <div className="w-full bg-[var(--surface-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border-gray)]">
              <div className="bg-[var(--primary-yellow)] h-full w-full animate-pulse shadow-[0_0_10px_var(--primary-yellow)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
