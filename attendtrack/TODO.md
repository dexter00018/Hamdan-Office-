## TODO (BlackboxAI)

- [x] Update `src/lib/attendanceStore.ts` so that `saveRecord()` uses Supabase as source of truth.
  - [x] Disable localStorage fallback on `saveRecord`.
  - [ ] (Next) Add explicit logging of Supabase REST response body (if needed) for faster debugging.
- [ ] (Optional) Update reads (`getAllRecords`/`getTodayRecords`) to avoid mixing localStorage vs Supabase when Supabase is available.
- [ ] Provide user instructions to test across two devices.


