# AI Doctor Recommendation — Technical Documentation

## Architecture Overview

```
Patient Browser
     │
     │  POST /api/recommend-doctor  { symptoms }
     ▼
Next.js API Route (Node.js runtime)
     │
     ├─► Ollama Cloud API  (gemma4 model)
     │     └─ Returns JSON { specialization, reasoning }
     │
     └─► MongoDB Atlas
           └─ DoctorProfile.find({ specialization, isAcceptingPatients: true })
               joined with User.find({ _id: $in userIds })
               └─ Returns RecommendedDoctor[]
     │
     └─► Response { specialization, reasoning, doctors[] }
```

---

## API Endpoint

| | |
|---|---|
| **Route** | `POST /api/recommend-doctor` |
| **Auth** | Required — patient role only (`withAuth({ roles: ['patient'] })`) |
| **File** | `src/app/api/recommend-doctor/route.ts` |

### Request body
```json
{ "symptoms": "string (10–1000 chars)" }
```

### Response (200)
```json
{
  "specialization": "Cardiology",
  "reasoning": "Your chest pain and shortness of breath suggest a cardiac issue...",
  "doctors": [
    {
      "_id": "...",
      "name": "Maria Santos",
      "profilePictureUrl": "...",
      "doctorProfileId": "...",
      "specialization": ["Cardiology"],
      "bio": "...",
      "yearsOfExperience": 16,
      "consultationFee": 1200,
      "rating": 4.9,
      "reviewCount": 87,
      "isVerified": true
    }
  ]
}
```

### Error responses
| Status | Reason |
|---|---|
| 400 | Symptoms failed Zod validation |
| 401 | Not authenticated |
| 403 | Wrong role (doctor trying to access) |
| 503 | `OLLAMA_KEY` not configured |

---

## Ollama Integration

### Model
- **Provider**: Ollama Cloud (`https://api.ollama.com`)
- **Model**: `gemma4`
- **Endpoint**: `POST /v1/chat/completions` (OpenAI-compatible)
- **Auth**: `Authorization: Bearer ${OLLAMA_KEY}`
- **Temperature**: `0.2` (low — keeps answers deterministic and structured)
- **Timeout**: 30 seconds (`AbortSignal.timeout(30_000)`)

### System prompt strategy
The system prompt instructs the model to:
1. Act as a medical triage router (not a diagnostician)
2. Output **only** a JSON object — no markdown fences, no explanations outside JSON
3. Restrict `specialization` to the exact 5 strings in `SUPPORTED_SPECIALIZATIONS`
4. Write empathetic, non-alarming reasoning

### JSON robustness
The raw model output is cleaned before parsing:
- Code fences (` ```json ... ``` `) are stripped with regex
- `JSON.parse()` is attempted on the cleaned string
- The result is validated with `ollamaResponseSchema` (Zod)
- If validation fails, the code scans for any known specialization string in the raw output (fallback)
- If everything fails, defaults to `"General Practitioner"` with a safe fallback message

This means the endpoint **never returns a 500** due to an unexpected AI response.

---

## Zod Schemas

**File**: `src/lib/validations/recommend.ts`

| Schema | Purpose |
|---|---|
| `recommendRequestSchema` | Validates incoming POST body (`symptoms` 10–1000 chars, trimmed) |
| `ollamaResponseSchema` | Validates the JSON produced by the LLM |
| `SUPPORTED_SPECIALIZATIONS` | Const tuple — single source of truth for the 5 valid values |
| `RecommendedDoctor` | Plain TS interface for API response shape |
| `RecommendResponse` | Full API response shape |

---

## Frontend

### Hook: `useRecommendDoctor`
**File**: `src/hooks/useRecommendDoctor.ts`

Uses TanStack Query `useMutation`. States exposed:
- `isPending` — triggers loading skeleton
- `isSuccess` + `data` — triggers result display
- `isError` + `error.message` — triggers inline Alert
- `reset()` — clears results, resets form state

### Component: `SymptomChecker`
**File**: `src/components/doctors/SymptomChecker.tsx`

State machine driven by mutation status:

```
idle → [user types + submits] → pending → success | error
                                              ↓
                                         [reset()] → idle
```

| State | UI shown |
|---|---|
| `idle` | Textarea + submit button |
| `pending` | Skeleton: thinking indicator + 3 skeleton doctor cards |
| `success` | AI reasoning card (sky gradient) + doctor list |
| `error` | Destructive Alert with error message |

### Page: `DoctorRecommendPage`
**File**: `src/app/(patient)/doctors/recommend/page.tsx`

Server Component — adds `metadata` for SEO, renders `SymptomChecker` inside a card container. Medical disclaimer at the bottom.

---

## Data Flow (MongoDB query)

```ts
// 1. Find profiles matching specialization
const profiles = await DoctorProfile.find({
  specialization: specialization,   // exact match in array
  isAcceptingPatients: true,
}).limit(6).lean();

// 2. Batch fetch user display info
const users = await User.find({ _id: { $in: userIds } })
  .select('name profilePictureUrl')
  .lean();

// 3. Join in application layer (Map by _id)
```

Max 6 doctors returned per recommendation. The `isAcceptingPatients: true` filter ensures patients only see available doctors.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OLLAMA_KEY` | Yes | Ollama Cloud API key |

Add to `.env.local` and Vercel project settings. Never commit the real value.

---

## Tests

**File**: `tests/unit/lib/recommend.test.ts`

| Test | What it checks |
|---|---|
| `recommendRequestSchema` | Accepts ≥10 chars, rejects <10, rejects >1000, trims whitespace |
| `ollamaResponseSchema` | All 5 valid specializations pass, unknown strings fail, missing reasoning fails |
| `SUPPORTED_SPECIALIZATIONS` | Exactly 5 entries, correct values present |

Run: `npm run test:unit`

---

## Security Notes

- Route is behind `withAuth({ roles: ['patient'] })` — doctors and anonymous users get 401/403
- `OLLAMA_KEY` is server-only — never exposed to the browser
- Symptoms text is validated and length-capped (Zod) before being sent to the AI
- The AI response is never directly injected into the DOM — it goes through React state
- `AbortSignal.timeout(30_000)` prevents hanging requests from blocking the server
