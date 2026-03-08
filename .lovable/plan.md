

# Remove All Hardcoded Data — Full Audit & Cleanup

## Audit Results

I scanned every non-UI-library file. Here is what I found:

### Hardcoded data that MUST be replaced (fetched from DB)

| Location | What's hardcoded | Action |
|---|---|---|
| `TimezoneDisplay.tsx` lines 22-39 | `tzAbbreviations` map (6 entries) and `tzOffsets` map (6 entries) | **Delete** — replace with DB-driven lookup |
| `Settings.tsx` lines 45-49 | 5 hardcoded `<SelectItem>` timezone entries | **Delete** — populate dynamically from `useTimezones()` |

### Mock data that stays in `api.ts` (by design)

`MOCK_EVENTS`, `MOCK_PENDING_EVENTS`, `MOCK_CONNECTIONS`, `MOCK_SETTINGS` — these are the **mock service layer**. The file header explicitly says "replace with fetch/supabase when backend is ready." They are not hardcoded UI data; they are the temporary data source. When you connect the DB, each `getXxx()` function gets a real query. No cleanup needed here — this is the intended architecture.

### UI presentation constants that stay (not data)

These are design/styling maps tied to TypeScript enums — standard practice, not DB data:
- `SourceBadge.tsx` → `sourceConfig` (Tailwind classes per source type)
- `JoinButton.tsx` → `platformConfig` (button colors per meeting platform)
- `CalendarsView.tsx` → `sourceIcons`, `connectionBadge` (icon backgrounds, badge colors)

You don't store Tailwind class names in a database.

---

## Implementation

### 1. New type → `src/types/index.ts`
Add `Timezone` interface: `id`, `name`, `iana_key`, `location`, `utc_offset`

### 2. New API function → `src/services/api.ts`
`getTimezones()` — Supabase `select * from timezones order by utc_offset`, with mock fallback (6 entries matching current hardcoded values so app works without DB)

### 3. New hook → `src/hooks/useTimezones.ts`
TanStack Query wrapper, `staleTime: Infinity`

### 4. New utility → `src/lib/timezone-utils.ts`
- `parseUtcOffset(interval: string): number` — parses Postgres interval `"08:00:00"` → `480` minutes
- `getOffsetLabel(tz: Timezone): string` — returns `"UTC+8"`
- `findTimezone(ianaKey: string, timezones: Timezone[]): Timezone | undefined`

### 5. Refactor → `src/components/shared/TimezoneDisplay.tsx`
- **Delete** `tzAbbreviations` map (lines 22-29)
- **Delete** `tzOffsets` map (lines 32-39)
- **Delete** old `formatTz()` function
- Call `useTimezones()` internally; resolve display from DB records
- Fallback: extract city name from IANA key if not found

### 6. Refactor → `src/pages/Settings.tsx`
- **Delete** 5 hardcoded `<SelectItem>` entries (lines 45-49)
- Call `useTimezones()`; render `timezones.map(tz => <SelectItem key={tz.iana_key} value={tz.iana_key}>{tz.name}</SelectItem>)`

### Files touched

| File | Action |
|---|---|
| `src/types/index.ts` | Add `Timezone` interface |
| `src/services/api.ts` | Add `getTimezones()` |
| `src/hooks/useTimezones.ts` | **Create** |
| `src/lib/timezone-utils.ts` | **Create** |
| `src/components/shared/TimezoneDisplay.tsx` | Remove hardcoded maps, use DB lookup |
| `src/pages/Settings.tsx` | Remove hardcoded items, use `useTimezones()` |

