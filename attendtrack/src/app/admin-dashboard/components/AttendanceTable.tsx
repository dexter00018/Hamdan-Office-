'use client';
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Search, Filter, Download, Eye } from 'lucide-react';
import { AttendanceRecord, computeDuration } from '@/lib/attendanceStore';
import Badge, { BadgeVariant } from '@/components/ui/Badge';
import SignaturePreview from './SignaturePreview';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onExportCSV: () => void;
}

type SortField = 'employeeName' | 'employeeId' | 'date' | 'timeIn' | 'timeOut' | 'status';
type SortDir = 'asc' | 'desc';

function statusVariant(status: AttendanceRecord['status']): BadgeVariant {
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
    case 'pending': return 'Pending';
    default: return status;
  }
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function AttendanceTable({ records, onExportCSV }: AttendanceTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let r = [...records];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (rec) =>
          rec.employeeName.toLowerCase().includes(q) ||
          rec.employeeId.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') r = r.filter((rec) => rec.status === statusFilter);
    r.sort((a, b) => {
      const va = (a[sortField as keyof AttendanceRecord] ?? '') as string;
      const vb = (b[sortField as keyof AttendanceRecord] ?? '') as string;
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return r;
  }, [records, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((r) => r.id)));
    }
  };

  const colHeader = (label: string, field: SortField) => (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon field={field} />
      </span>
    </th>
  );

  return (
    <div className="card-elevated overflow-hidden">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-border rounded-lg px-2.5 py-2 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            <option value="complete">Complete</option>
            <option value="present">Time-In Only</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted hover:border-primary/30 text-foreground transition-all duration-150 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="px-5 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center gap-3 animate-slide-up">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} record{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Clear selection
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Export Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="pl-5 pr-2 py-3 w-8">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && selectedIds.size === paginated.length}
                  onChange={toggleAll}
                  className="rounded border-border accent-primary cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
              {colHeader('Employee', 'employeeName')}
              {colHeader('ID', 'employeeId')}
              {colHeader('Date', 'date')}
              {colHeader('Time In', 'timeIn')}
              {colHeader('Time Out', 'timeOut')}
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                Duration
              </th>
              {colHeader('Status', 'status')}
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Signature
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide pr-5">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center">
                  <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">No records match your filters</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting the search or filter criteria</p>
                </td>
              </tr>
            )}
            {paginated.map((rec, rowIdx) => (
              <tr
                key={rec.id}
                className={[
                  'hover:bg-muted/40 transition-colors duration-100',
                  rowIdx % 2 === 0 ? '' : 'bg-muted/10',
                  selectedIds.has(rec.id) ? 'bg-primary/5' : '',
                ].join(' ')}
              >
                <td className="pl-5 pr-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(rec.id)}
                    onChange={() => toggleSelect(rec.id)}
                    className="rounded border-border accent-primary cursor-pointer"
                    aria-label={`Select record for ${rec.employeeName}`}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-primary">
                        {rec.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <span className="font-medium text-foreground whitespace-nowrap">{rec.employeeName}</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-tabular text-muted-foreground text-xs">{rec.employeeId}</td>
                <td className="px-3 py-3 font-tabular text-muted-foreground text-xs whitespace-nowrap">{rec.date}</td>
                <td className="px-3 py-3 font-tabular text-foreground text-xs whitespace-nowrap">
                  {rec.timeIn ?? <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-3 font-tabular text-foreground text-xs whitespace-nowrap">
                  {rec.timeOut ?? <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-3 font-tabular text-muted-foreground text-xs whitespace-nowrap">
                  {rec.timeIn && rec.timeOut ? computeDuration(rec.timeIn, rec.timeOut) : '—'}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusVariant(rec.status)} label={statusLabel(rec.status)} />
                </td>
                <td className="px-3 py-3">
                  <SignaturePreview signatureData={rec.signatureData} employeeName={rec.employeeName} />
                </td>
                <td className="px-3 py-3 pr-5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                      aria-label={`View details for ${rec.employeeName}`}
                      title="View record details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border border-border rounded px-1.5 py-1 bg-card text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={`pagesize-${n}`} value={n}>{n}</option>
            ))}
          </select>
          <span>of <span className="font-semibold font-tabular text-foreground">{filtered.length}</span> records</span>
        </div>

        <div className="flex items-center gap-1 sm:ml-auto">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = totalPages <= 7
              ? i + 1
              : page <= 4
              ? i + 1
              : page >= totalPages - 3
              ? totalPages - 6 + i
              : page - 3 + i;
            return (
              <button
                key={`page-${p}`}
                onClick={() => setPage(p)}
                className={[
                  'w-8 h-8 text-xs font-medium rounded-lg border transition-all',
                  p === page
                    ? 'bg-primary text-white border-primary' :'border-border hover:bg-muted text-foreground',
                ].join(' ')}
              >
                {p}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}