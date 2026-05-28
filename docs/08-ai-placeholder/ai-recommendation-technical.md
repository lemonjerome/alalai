# AI Doctor Recommendation — Technical Documentation

## Architecture

```
src/app/(patient)/doctors/recommend/
└── page.tsx               — Client Component: symptom picker page
src/components/doctors/
└── SymptomChecker.tsx     — Client Component: symptom selection UI + result display
```

No API route is required for the static implementation. The symptom-to-specialization mapping is a plain `Record<string, string[]>` in the component module.

---

## Static Mapping (`SymptomChecker.tsx`)

```ts
const SYMPTOM_MAP: Record<string, string[]> = {
  'chest pain': ['Cardiology', 'Internal Medicine'],
  'heart palpitations': ['Cardiology'],
  'shortness of breath': ['Pulmonology', 'Cardiology'],
  // ... 25 more entries
};
```

When the user clicks "Get Recommendation":
1. Iterate over all selected symptoms
2. For each symptom, look up `SYMPTOM_MAP[symptom]`
3. Accumulate all specializations into a `Set<string>` (deduplicated)
4. Sort alphabetically
5. Display as badges; link to `/doctors?specialization={results[0]}`

The first specialization in the result array is used for the "Browse doctors" CTA link because it's the one deemed most specific by the mapping order.

---

## `SymptomChecker` Component

**Props**:
```ts
interface SymptomCheckerProps {
  onSpecializations?: (specs: string[]) => void; // callback for parent state
}
```

**State**:
- `selected: Set<string>` — currently checked symptoms
- `results: string[] | null` — null = not yet searched; array = results shown

**Key behavior**: clicking a symptom clears `results` (forces a new search after changing selection).

**Link generation**:
```ts
href={`/doctors?specialization=${encodeURIComponent(results[0])}`}
```
This links to the doctor discovery page with the specialization filter pre-applied via URL search params (consistent with the rest of the filter state architecture).

---

## Future Ollama Integration Point

The planned AI endpoint would replace the static mapping with a call to a local Ollama instance:

```ts
// /api/ai/recommend — POST (future)
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'llama3',
    prompt: `Patient symptoms: "${symptoms}". Suggest appropriate medical specializations. Reply with a JSON array of specialization strings only.`,
    stream: false,
  }),
});
```

The `SymptomChecker` page is architected to accept this — the `/doctors/recommend` page only renders `SymptomChecker` as a child. Replacing the static component with an `OllamaChecker` component that calls `/api/ai/recommend` would be a drop-in swap.

**Why Ollama?**
- **Local LLM**: No API costs, no data sent to external AI services
- **Privacy-friendly**: Patient symptom data stays on the server
- **Self-hosted**: Works without internet connectivity once the model is pulled
- **Flexible**: Any Ollama-compatible model can be used (llama3, mistral, etc.)

---

## Security Notes

- The symptom checker page at `/doctors/recommend` is inside the `(patient)` route group and protected by the `DoctorLayout`'s session check (patients only)
- The middleware enforces that only authenticated users can access any `/doctors/...` page
- No PII is stored when a patient uses the symptom checker — it's purely client-side computation

---

## Known Limitations

- The static mapping is a rough approximation — a symptom like "fatigue" appears under many specializations (Endocrinology + Internal Medicine) and a real AI would give a more nuanced result
- Only 26 common symptoms are mapped — uncommon or highly specific symptoms won't have a mapping and will return an empty result (user is guided to Internal Medicine)
- The tool doesn't account for symptom duration, severity, or combinations beyond simple set union
- The recommended specialization is the first in alphabetical order of results — no clinical ranking or weighting is applied
