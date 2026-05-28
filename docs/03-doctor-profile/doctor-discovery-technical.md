# Doctor Discovery — Technical Documentation

## API Routes

### `GET /api/doctors`
**File**: `src/app/api/doctors/route.ts`  
**Auth**: Public

**Query params**:
| Param | Type | Description |
|---|---|---|
| `search` | string | Full-text search via MongoDB `$text` index (on bio + specialization) |
| `specialization` | string | Case-insensitive `$elemMatch` regex on specialization array |
| `availableOn` | ISO date | If provided, includes `nextAvailableSlot` in each result |
| `page` | number | 1-based, default 1 |
| `limit` | number | Default 12, max 12 |

**Algorithm**:
1. Build `DoctorProfile` filter: `{ isAcceptingPatients: true }` + optional `$text` / specialization match
2. Run `find` + `countDocuments` in parallel (Promise.all)
3. Text-search results are sorted by `$meta: 'textScore'`; default sort is `{ rating: -1, reviewCount: -1 }`
4. Fetch associated `User` documents in a single `$in` query
5. If `availableOn` is provided: for each profile, fetch their active `Availability` records and call `getAvailableSlots()` to find the first open slot. This is O(n) per doctor — pagination to 12 keeps this tractable.
6. Returns `{ doctors, total, page, pages }`

**Data shape per doctor**:
```ts
{
  user: SanitizedUser,
  doctorProfile: IDoctorProfileDocument,
  nextAvailableSlot: string | null  // ISO string of first open slot, or null
}
```

### `GET /api/doctors/[id]`
**File**: `src/app/api/doctors/[id]/route.ts`  
**Auth**: Public  
`[id]` = `DoctorProfile._id` (not `User._id`)

1. Validates ObjectId
2. Finds `DoctorProfile` by `_id`
3. Fetches associated `User` via `profile.userId`
4. Returns `{ user: SanitizedUser, doctorProfile }`

### `GET /api/doctors/[id]/availability`
**File**: `src/app/api/doctors/[id]/availability/route.ts`  
**Auth**: Public  
**Query params**: `from` (ISO date), `to` (ISO date)

1. Validates ObjectId and date params
2. Clamps date range to max 31 days (abuse prevention)
3. Fetches doctor's active `Availability` records
4. Fetches `pending`/`confirmed` appointments in the date range (doctorId = `profile.userId` — appointments store the User _id not DoctorProfile _id)
5. Iterates each day in `[from, to]`, calls `getAvailableSlots()` for each
6. Returns `{ availability: Record<'YYYY-MM-DD', { startISO, endISO }[]> }`

---

## URL Search Params as Filter State

All filter state lives in URL search params (not `useState`). Rationale:
- **Shareable**: user can copy the URL and share a filtered view
- **Back button**: navigating away and returning restores filters
- **SSR compatible**: server can potentially pre-render filtered results

`DoctorFilters` reads via `useSearchParams()`, writes via `router.push(pathname + '?' + updated params)`. Each write clears `page` to reset pagination.

---

## Component Architecture

```
/doctors page (Server Component with Suspense)
├── DoctorFilters (Client — reads/writes URL params)
└── DoctorGrid (Client — useQuery reads URL params and calls /api/doctors)
    └── DoctorCard × N (presentational — links to /doctors/[id])

/doctors/[id] page (Client Component — useDoctor hook)
├── Profile header (Avatar, name, badge, stats)
├── Education card
├── License card
└── AvailabilityCalendar (Client — useDoctorAvailability)
    └── Calls /api/doctors/[id]/availability?from=&to=
```

---

## `AvailabilityCalendar` Data Flow

1. Component tracks current `month` in local state
2. On mount and on month change: `useDoctorAvailability(doctorId, from, to)` fetches 31 days
3. Response is a `Record<'YYYY-MM-DD', slots[]>` — compute `availableDays: Set<string>` for O(1) lookup
4. Pass `availableDays` to shadcn `Calendar` via `modifiers` to highlight available dates
5. On date select: display `slotsForDay` as a grid of `<Button>` components
6. On slot click: call `onSelectSlot(startISO, endISO)` — parent routes to `/book/[doctorId]?slot=...`

---

## Hooks

### `useDoctors` (`src/hooks/useDoctors.ts`)
- Reads filter params and calls `GET /api/doctors`
- `staleTime: 5 * 60 * 1000` (5 min) — doctor profiles change rarely
- Query key: `['doctors', params]` — params object change triggers refetch

### `useDoctor` (`src/hooks/useDoctors.ts`)
- Fetches single doctor by DoctorProfile `_id`
- `staleTime: 5 * 60 * 1000`
- `enabled: !!id`

### `useDoctorAvailability` (`src/hooks/useDoctorAvailability.ts`)
- Fetches availability for a date range
- `staleTime: 2 * 60 * 1000` (2 min) — availability can change as appointments are booked

---

## MongoDB Text Index

On `DoctorProfile`:
```ts
DoctorProfileSchema.index({ bio: 'text', specialization: 'text' });
```
This powers the `$text: { $search: searchTerm }` query. MongoDB assigns a relevance score; results are sorted by `{ score: { $meta: 'textScore' } }` when a search term is present.

**Limitation**: Text search is whole-word with stemming; partial-prefix search (e.g., "Cardio" matching "Cardiology") may not work in all MongoDB versions. A future enhancement could use Atlas Search for prefix/fuzzy matching.

---

## Security Notes

- All routes are public (no auth required for browsing) — discovery is intentionally open
- `sanitizeUser()` is called on every `User` document before returning — `passwordHash` is never exposed
- ObjectId validation on `[id]` params prevents injection / invalid queries
- Date range clamped to 31 days on `/api/doctors/[id]/availability` — prevents expensive date loops

---

## Known Limitations

- `availableOn` filter in the list API makes N extra DB queries (one per doctor on the page) — acceptable for 12 results but would need caching or aggregation at scale
- The discovery page has no server-side rendering for the grid (it's a client query) — first load shows a skeleton until the query resolves
- Rating is a static field on `DoctorProfile` (no live review aggregation yet — reviews are a future feature)
