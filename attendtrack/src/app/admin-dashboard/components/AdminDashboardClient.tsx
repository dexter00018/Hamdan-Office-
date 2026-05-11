'use client';
import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { UserCheck, UserX, Clock, CheckSquare, PenLine, RefreshCw, Calendar,  } from 'lucide-react';
import MetricCard from './MetricCard';
import AttendanceTable from './AttendanceTable';
import PasscodeGate from './PasscodeGate';
import { ToastContainer, ToastMessage } from '@/components/ui/Toast';
import { getAllRecords, seedMockData, AttendanceRecord } from '@/lib/attendanceStore';

// Recharts components are client-only — dynamically imported to prevent SSR mismatch
const AttendanceTrendChart = dynamic(() => import('./AttendanceTrendChart'), { ssr: false });
const StatusDistributionChart = dynamic(() => import('./StatusDistributionChart'), { ssr: false });

interface DailyMetrics {
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgCheckIn: string;
  completionRate: number;
  pendingSignatures: number;
}

interface TrendPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface StatusPoint {
  day: string;
  onTime: number;
  late: number;
  absent: number;
}

function computeMetrics(records: AttendanceRecord[]): DailyMetrics {
  const today = new Date().toISOString().split('T')[0];
  const todayRecs = records.filter((r) => r.date === today);

  const presentToday = todayRecs.filter((r) => r.status !== 'absent').length;
  const absentToday = todayRecs.filter((r) => r.status === 'absent').length;
  const lateToday = todayRecs.filter((r) => r.status === 'late').length;
  const pendingSignatures = records.filter((r) => !r.signatureData && r.status !== 'absent').length;
  const complete = records.filter((r) => r.timeIn && r.timeOut).length;
  const completionRate = records.length > 0 ? Math.round((complete / records.length) * 100) : 0;

  const withTimeIn = todayRecs.filter((r) => r.timeIn);
  let avgCheckIn = '—';
  if (withTimeIn.length > 0) {
    const totalMins = withTimeIn.reduce((sum, r) => {
      const [h, m] = (r.timeIn ?? '09:00:00').split(':').map(Number);
      return sum + h * 60 + m;
    }, 0);
    const avgMin = Math.round(totalMins / withTimeIn.length);
    const h = Math.floor(avgMin / 60).toString().padStart(2, '0');
    const m = (avgMin % 60).toString().padStart(2, '0');
    avgCheckIn = `${h}:${m}`;
  }

  return { presentToday, absentToday, lateToday, avgCheckIn, completionRate, pendingSignatures };
}

function buildTrendData(records: AttendanceRecord[]): TrendPoint[] {
  const today = new Date();
  const points: TrendPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecs = records.filter((r) => r.date === dateStr);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    points.push({
      date: label,
      present: dayRecs.filter((r) => r.status !== 'absent').length,
      absent: dayRecs.filter((r) => r.status === 'absent').length,
      late: dayRecs.filter((r) => r.status === 'late').length,
    });
  }
  return points;
}

function buildStatusData(records: AttendanceRecord[]): StatusPoint[] {
  const today = new Date();
  const points: StatusPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayRecs = records.filter((r) => r.date === dateStr);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    points.push({
      day: dayNames[d.getDay()],
      onTime: dayRecs.filter((r) => r.status === 'complete' || r.status === 'present').length,
      late: dayRecs.filter((r) => r.status === 'late').length,
      absent: dayRecs.filter((r) => r.status === 'absent').length,
    });
  }
  return points;
}

function exportToCSV(records: AttendanceRecord[]) {
  // Backend integration point: replace with server-side export endpoint
  const headers = ['ID', 'Employee Name', 'Employee ID', 'Date', 'Time In', 'Time Out', 'Duration', 'Status', 'Has Signature'];
  const rows = records.map((r) => [
    r.id,
    r.employeeName,
    r.employeeId,
    r.date,
    r.timeIn ?? '',
    r.timeOut ?? '',
    r.timeIn && r.timeOut
      ? (() => {
          const [h1, m1, s1] = r.timeIn.split(':').map(Number);
          const [h2, m2, s2] = (r.timeOut ?? '').split(':').map(Number);
          const sec = (h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1);
          if (sec <= 0) return '';
          return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
        })()
      : '',
    r.status,
    r.signatureData ? 'Yes' : 'No',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendtrack_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboardClient() {
  const [unlocked, setUnlocked] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadRecords = useCallback(() => {
    // Backend integration point: GET /api/attendance/records
    setLoading(true);
    seedMockData();
    setTimeout(() => {
      const all = getAllRecords();
      setRecords(all);
      const now = new Date();
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => {
    if (unlocked) loadRecords();
  }, [unlocked, loadRecords]);

  if (!unlocked) {
    return <PasscodeGate onUnlock={() => setUnlocked(true)} />;
  }

  const filteredByDate = dateFilter
    ? records.filter((r) => r.date === dateFilter)
    : records;

  const metrics = computeMetrics(records);
  const trendData = buildTrendData(records);
  const statusData = buildStatusData(records);

  const handleExport = () => {
    exportToCSV(filteredByDate);
    addToast({
      type: 'success',
      title: 'Export ready',
      description: `${filteredByDate.length} records exported to CSV`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor daily attendance, review records, and export reports
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-3 flex-wrap">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Updated {lastUpdated}
            </span>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-sm border border-border rounded-lg px-2.5 py-1.5 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Filter by date"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-muted-foreground hover:text-danger transition-colors underline"
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={loadRecords}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted text-foreground transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={['w-4 h-4', loading ? 'animate-spin' : ''].join(' ')} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Bento Grid — 6 cards: 3+3 */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`skeleton-kpi-${i}`} className="animate-pulse bg-muted rounded-[var(--radius)] h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
          <MetricCard
            label="Present Today"
            value={metrics.presentToday.toString()}
            subtext="Checked in so far"
            trend="up"
            trendValue="+2 vs yesterday"
            icon={UserCheck}
            variant="success"
          />
          <MetricCard
            label="Absent Today"
            value={metrics.absentToday.toString()}
            subtext="No check-in recorded"
            trend="up"
            trendValue={`+${Math.max(0, metrics.absentToday - 1)} vs avg`}
            icon={UserX}
            variant="danger"
          />
          <MetricCard
            label="Late Arrivals"
            value={metrics.lateToday.toString()}
            subtext="After 9:00 AM"
            trend="neutral"
            trendValue="Same as avg"
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            label="Avg Check-In"
            value={metrics.avgCheckIn}
            subtext="Today's average"
            icon={Clock}
            variant="info"
          />
          <MetricCard
            label="Completion Rate"
            value={`${metrics.completionRate}%`}
            subtext="Time-In + Time-Out"
            trend={metrics.completionRate >= 80 ? 'up' : 'down'}
            trendValue={metrics.completionRate >= 80 ? 'On target' : 'Below target'}
            icon={CheckSquare}
            variant={metrics.completionRate >= 80 ? 'success' : 'warning'}
          />
          <MetricCard
            label="Pending Signatures"
            value={metrics.pendingSignatures.toString()}
            subtext="Compliance risk"
            trend={metrics.pendingSignatures > 0 ? 'down' : 'neutral'}
            trendValue={metrics.pendingSignatures > 0 ? 'Needs review' : 'All signed'}
            icon={PenLine}
            variant={metrics.pendingSignatures > 0 ? 'danger' : 'success'}
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-5">
        {/* 14-Day Trend */}
        <div className="card-elevated p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">14-Day Attendance Trend</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Daily present, late, and absent counts</p>
          </div>
          {loading ? (
            <div className="animate-pulse bg-muted rounded-lg h-[220px]" />
          ) : (
            <AttendanceTrendChart data={trendData} />
          )}
        </div>

        {/* Weekly Status Distribution */}
        <div className="card-elevated p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Weekly Status Distribution</h2>
            <p className="text-xs text-muted-foreground mt-0.5">On-time vs late vs absent — last 7 days</p>
          </div>
          {loading ? (
            <div className="animate-pulse bg-muted rounded-lg h-[220px]" />
          ) : (
            <StatusDistributionChart data={statusData} />
          )}
        </div>
      </div>

      {/* Records Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Attendance Records</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dateFilter ? `Showing records for ${dateFilter}` : 'All records across all dates'}
              {' · '}
              <span className="font-semibold font-tabular">{filteredByDate.length}</span> total
            </p>
          </div>
        </div>
        {loading ? (
          <div className="card-elevated overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="animate-pulse bg-muted rounded-lg h-9 w-72" />
            </div>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={`skeleton-row-${i}`} className="px-5 py-3.5 border-b border-border flex items-center gap-3">
                <div className="animate-pulse bg-muted rounded w-4 h-4" />
                <div className="animate-pulse bg-muted rounded h-4 flex-1" />
                <div className="animate-pulse bg-muted rounded h-4 w-24" />
                <div className="animate-pulse bg-muted rounded h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <AttendanceTable records={filteredByDate} onExportCSV={handleExport} />
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}