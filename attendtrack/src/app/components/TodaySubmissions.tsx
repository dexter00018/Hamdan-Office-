'use client';
import React from 'react';
import { AttendanceRecord } from '@/lib/attendanceStore';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import { ClipboardCheck } from 'lucide-react';

interface TodaySubmissionsProps {
  records: AttendanceRecord[];
}

function statusBadgeVariant(status: AttendanceRecord['status']): BadgeVariant {
  switch (status) {
    case 'complete': return 'complete';
    case 'present': return 'present';
    case 'late': return 'late';
    case 'absent': return 'absent';
    case 'pending': return 'pending';
    default: return 'neutral';
  }
}

function statusLabel(status: AttendanceRecord['status']): string {
  switch (status) {
    case 'complete': return 'Complete';
    case 'present': return 'Time-In Only';
    case 'late': return 'Late';
    case 'absent': return 'Absent';
    case 'pending': return 'Pending Sign-Off';
    default: return status;
  }
}

export default function TodaySubmissions({ records }: TodaySubmissionsProps) {
  if (records.length === 0) {
    return (
      <div className="card-elevated p-6 text-center">
        <ClipboardCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-muted-foreground">No records submitted today</p>
        <p className="text-xs text-muted-foreground mt-1">
          Submit your Time In to begin tracking attendance
        </p>
      </div>
    );
  }

  return (
    <div className="card-elevated overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          Today&apos;s Submissions
          <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {records.length} record{records.length !== 1 ? 's' : ''}
          </span>
        </h3>
      </div>
      <div className="divide-y divide-border">
        {records.slice(-3).reverse().map((rec) => (
          <div
            key={rec.id}
            className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors duration-100"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {rec.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{rec.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {rec.employeeId}
                {rec.timeIn && ` · In: ${rec.timeIn}`}
                {rec.timeOut && ` · Out: ${rec.timeOut}`}
              </p>
            </div>
            <Badge variant={statusBadgeVariant(rec.status)} label={statusLabel(rec.status)} />
          </div>
        ))}
      </div>
    </div>
  );
}