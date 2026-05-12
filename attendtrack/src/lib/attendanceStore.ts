export interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  date: string;         // YYYY-MM-DD
  timeIn: string | null;   // HH:MM:SS
  timeOut: string | null;
  signatureData: string | null; // base64 data URL
  status: 'present' | 'late' | 'absent' | 'complete' | 'pending';
  submittedAt: string;  // ISO timestamp
}

const STORAGE_KEY = 'attendtrack_records';
const SUPABASE_TABLE = 'attendance_records';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function supportsSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;

  const invalidUrl = SUPABASE_URL.includes('your-project-id') || SUPABASE_URL.includes('dummy.supabase.co');
  const invalidKey = SUPABASE_KEY.includes('dummykey') || SUPABASE_KEY.includes('your-');

  return !invalidUrl && !invalidKey;
}

async function supabaseFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}${path}`;
  const headers = {
    apikey: SUPABASE_KEY ?? '',
    Authorization: `Bearer ${SUPABASE_KEY ?? ''}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || response.statusText);
  }

  return text ? JSON.parse(text) : ([] as unknown as T);
}

async function localGetAllRecords(): Promise<AttendanceRecord[]> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function localSaveRecord(record: AttendanceRecord): Promise<void> {
  if (typeof window === 'undefined') return;
  const records = await localGetAllRecords();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function getAllRecords(): Promise<AttendanceRecord[]> {
  if (!supportsSupabase()) return localGetAllRecords();

  try {
    const records = await supabaseFetch<AttendanceRecord[]>('?select=*&order=date.desc,submittedAt.desc', {
      method: 'GET',
    });
    return records;
  } catch (error) {
    console.error('Supabase getAllRecords failed:', error);
    return localGetAllRecords();
  }
}

export async function saveRecord(record: AttendanceRecord): Promise<void> {
  if (!supportsSupabase()) {
    await localSaveRecord(record);
    return;
  }

  try {
    await supabaseFetch<AttendanceRecord[]>('', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(record),
    });
  } catch (error) {
    console.error('Supabase saveRecord failed:', error);
    await localSaveRecord(record);
  }
}

export async function getTodayRecords(): Promise<AttendanceRecord[]> {
  if (!supportsSupabase()) {
    const today = new Date().toISOString().split('T')[0];
    return (await localGetAllRecords()).filter((r) => r.date === today);
  }

  const today = new Date().toISOString().split('T')[0];
  try {
    const records = await supabaseFetch<AttendanceRecord[]>(`?select=*&date=eq.${today}&order=submittedAt.desc`, {
      method: 'GET',
    });
    return records;
  } catch (error) {
    console.error('Supabase getTodayRecords failed:', error);
    const all = await localGetAllRecords();
    return all.filter((r) => r.date === today);
  }
}

export function generateId(): string {
  return `rec-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function computeDuration(timeIn: string, timeOut: string): string {
  const [h1, m1, s1] = timeIn.split(':').map(Number);
  const [h2, m2, s2] = timeOut.split(':').map(Number);
  const totalSec = (h2 * 3600 + m2 * 60 + s2) - (h1 * 3600 + m1 * 60 + s1);
  if (totalSec <= 0) return '—';
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${m}m`;
}

// Seeded mock data for admin dashboard demo
export function seedMockData(): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEY);
  const existing: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
  if (existing.length > 0) return; // already seeded

  const employees = [
    { name: 'Marcus Chen', id: '2024-001' },
    { name: 'Priya Nair', id: '2024-002' },
    { name: 'Jordan Willis', id: '2024-003' },
    { name: 'Fatima Al-Hassan', id: '2024-004' },
    { name: 'Diego Reyes', id: '2024-005' },
    { name: 'Aisha Okonkwo', id: '2024-006' },
    { name: 'Tyler Nguyen', id: '2024-007' },
    { name: 'Soo-Jin Park', id: '2024-008' },
    { name: 'Lena Brandt', id: '2024-009' },
    { name: 'Kofi Mensah', id: '2024-010' },
    { name: 'Amara Singh', id: '2024-011' },
    { name: 'Rafael Costa', id: '2024-012' },
  ];

  const records: AttendanceRecord[] = [];
  const today = new Date();

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOffset);
    const dateStr = d.toISOString().split('T')[0];

    employees.forEach((emp, empIdx) => {
      // Skip some employees on weekends
      const dow = d.getDay();
      if ((dow === 0 || dow === 6) && empIdx % 3 !== 0) return;

      const roll = (empIdx + dayOffset) % 10;
      let status: AttendanceRecord['status'] = 'complete';
      let timeIn: string | null = null;
      let timeOut: string | null = null;

      if (roll === 9) {
        status = 'absent';
      } else if (roll >= 7) {
        status = 'late';
        timeIn = `09:${30 + ((empIdx * 7 + dayOffset * 3) % 30).toString().padStart(2, '0')}:00`;
        timeOut = `18:${(empIdx * 5 + dayOffset) % 60 === 0 ? '00' : ((empIdx * 5 + dayOffset) % 60).toString().padStart(2, '0')}:00`;
      } else if (roll === 6) {
        status = 'pending';
        timeIn = `08:${((empIdx * 3 + dayOffset) % 59).toString().padStart(2, '0')}:00`;
        timeOut = null;
      } else {
        status = 'complete';
        timeIn = `08:${((empIdx * 3 + dayOffset) % 59).toString().padStart(2, '0')}:00`;
        timeOut = `17:${(empIdx * 7 + dayOffset * 2) % 60 === 0 ? '00' : ((empIdx * 7 + dayOffset * 2) % 60).toString().padStart(2, '0')}:00`;
      }

      records.push({
        id: `rec-seed-${dateStr}-${emp.id}`,
        employeeName: emp.name,
        employeeId: emp.id,
        date: dateStr,
        timeIn,
        timeOut,
        signatureData: status !== 'absent' ? 'data:image/png;base64,iVBORw0KGgo=' : null,
        status,
        submittedAt: `${dateStr}T${timeIn ?? '00:00:00'}`,
      });
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}