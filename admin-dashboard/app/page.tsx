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
    <div className="card p-8 border-l-8 border-[var(--border)] hover:border-l-[var(--primary)] transition-all group shadow-lg hover:shadow-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            {title}
          </h3>
          <div className="text-5xl font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors tracking-tight">
            {loading ? <div className="skeleton w-32 h-12 rounded" /> : value}
          </div>
        </div>
        <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-3xl transform group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="text-sm font-semibold text-[var(--success)] flex items-center gap-2 bg-[var(--surface-elevated)] inline-block px-3 py-1 rounded-full">
          <span>↑</span> {change} <span className="text-[var(--text-tertiary)] font-normal">vs last month</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="layout-container animate-fade-in">
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
        <button className="btn-base btn-primary px-8 py-4 text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
          📥 Download Report
        </button>
      </div>

      {/* Main Stats Grid - INCREASED GAP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatCard
          title="Total Revenue"
          value={`₹${(stats.totalRevenue / 1000).toFixed(1)}k`}
          change="12%"
          color="bg-[var(--primary)] text-[var(--primary)]"
          icon="💰"
        />
        <StatCard
          title="Active Operations"
          value={stats.activeEngagements}
          change="5%"
          color="bg-[var(--success)] text-[var(--success)]"
          icon="🛡️"
        />
        <StatCard
          title="Bouncers Online"
          value={stats.activeBouncers}
          color="bg-[var(--secondary)] text-[var(--secondary)]"
          icon="👥"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingVerifications}
          color="bg-[var(--warning)] text-[var(--warning)]"
          icon="⚠️"
        />
      </div>

      {/* Performance & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recent Activity / Chart Placeholder */}
        <div className="lg:col-span-2 card p-8 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface)] border border-[var(--border-light)] shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">
              Performance Analytics
            </h3>
            <select className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-base font-semibold rounded-lg px-4 py-2 outline-none cursor-pointer hover:border-[var(--primary)] transition-colors">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          {/* Simple Graphic Representation using CSS bars */}
          <div className="h-80 flex items-end justify-between gap-6 px-4 pb-4 border-b border-[var(--border)]">
            {[40, 65, 30, 85, 50, 75, 90, 60, 45, 80, 55, 70].map((h, i) => (
              <div key={i} className="w-full bg-[var(--surface)] rounded-t-lg relative group cursor-pointer hover:bg-[var(--primary)] transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]" style={{ height: `${h}%` }}>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-sm py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                  {h * 10} Visits
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-bold text-[var(--text-secondary)] mt-6 uppercase tracking-widest px-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Quick Actions & Status */}
        <div className="space-y-8">
          <div className="card p-8 border border-[var(--border-light)] shadow-xl">
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
              Quick Actions
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => window.location.href = '/verifications'}
                className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface-elevated)] transition-all group cursor-pointer hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center gap-5">
                  <span className="p-3 rounded-lg bg-[var(--warning-glow)] text-[var(--warning)] text-2xl shadow-inner">⚡</span>
                  <div className="text-left">
                    <div className="font-bold text-lg text-[var(--text-primary)]">Verify Approvals</div>
                    <div className="text-sm font-medium text-[var(--text-tertiary)]">{stats.pendingVerifications} requests pending</div>
                  </div>
                </div>
                <span className="text-2xl text-[var(--text-tertiary)] group-hover:text-[var(--primary)] transition-colors">→</span>
              </button>

              <button
                onClick={() => window.location.href = '/tracking'}
                className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-[var(--border)] hover:border-[var(--secondary)] hover:bg-[var(--surface-elevated)] transition-all group cursor-pointer hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center gap-5">
                  <span className="p-3 rounded-lg bg-[var(--secondary-glow)] text-[var(--secondary)] text-2xl shadow-inner">📍</span>
                  <div className="text-left">
                    <div className="font-bold text-lg text-[var(--text-primary)]">Track Agents</div>
                    <div className="text-sm font-medium text-[var(--text-tertiary)]">{stats.activeBouncers} active now</div>
                  </div>
                </div>
                <span className="text-2xl text-[var(--text-tertiary)] group-hover:text-[var(--secondary)] transition-colors">→</span>
              </button>

              <button
                onClick={() => window.location.href = '/bouncers'}
                className="w-full flex items-center justify-between p-5 rounded-xl border-2 border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--surface-elevated)] transition-all group cursor-pointer hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center gap-5">
                  <span className="p-3 rounded-lg bg-[var(--success-glow)] text-[var(--success)] text-2xl shadow-inner">👥</span>
                  <div className="text-left">
                    <div className="font-bold text-lg text-[var(--text-primary)]">Manage Team</div>
                    <div className="text-sm font-medium text-[var(--text-tertiary)]">{stats.totalBouncers} registered</div>
                  </div>
                </div>
                <span className="text-2xl text-[var(--text-tertiary)] group-hover:text-[var(--success)] transition-colors">→</span>
              </button>
            </div>
          </div>

          <div className="card p-8 bg-gradient-to-r from-[var(--primary-glow)] to-black border-2 border-[var(--primary-dark)] shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <div className="flex items-center gap-5 mb-4">
              <span className="text-4xl animate-pulse">🚀</span>
              <div>
                <h4 className="font-black text-xl text-[var(--text-primary)] uppercase tracking-wide">System Status</h4>
                <p className="text-sm font-semibold text-[var(--text-secondary)]">All systems operational</p>
              </div>
            </div>
            <div className="w-full bg-[var(--surface-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
              <div className="bg-[var(--primary)] h-full w-full animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
