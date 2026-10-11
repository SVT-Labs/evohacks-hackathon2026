# Bridge

Bridge turns lecture notes into explanations built around something the student already loves. Upload a PDF or paste notes, name an interest (football tactics, baking, chess), and get back the key concepts, an analogy for each one with an honest note on where it breaks down, a concept map, a quiz and next steps.

Next.js 14 (App Router), TypeScript, Tailwind. No database and no auth: a report lives in the browser tab that requested it.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. With `DEMO_MODE=true` in `.env.local` the app works without an API key and always returns the English sample report (whatever language is chosen), and the report page says it is a demo. To generate real reports, set `LLM_API_KEY` to an OpenAI key and `DEMO_MODE=false`, then restart the dev server.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `LLM_API_KEY` | unless `DEMO_MODE=true` | OpenAI API key |
| `LLM_MODEL` | no | Model id, default `gpt-6-luna` |
| `LLM_REASONING_EFFORT` | no | `none`, `low`, `medium` or `high` for reasoning models |
| `LLM_BASE_URL` | no | Any OpenAI-compatible endpoint |
| `DEMO_MODE` | no | `true` returns the cached sample and skips the LLM |
| `RATE_LIMIT_PER_MINUTE` | no | Requests per client IP per minute, default 10 |

## API

`POST /api/generate` takes `multipart/form-data`:

| Field | Notes |
| --- | --- |
| `file` | PDF, optional, up to 10 MB |
| `text` | Pasted notes, optional. At least one of `file` and `text` is required |
| `interest` | Required, up to 120 characters |
| `level` | Optional, defaults to `undergraduate` |
| `language` | Optional, `en` (default) or `tr` |

It answers `200` with a `Report`, or `{ "error": string }` with a 4xx or 5xx status. Notes longer than 15,000 characters are shortened section by section, and the response then carries `X-Bridge-Notes-Truncated: true`.

```bash
curl -X POST http://localhost:3000/api/generate -F "file=@lecture.pdf;type=application/pdf" -F "interest=football tactics" -F "language=en"
```

More example calls, with the expected result of each, are at the bottom of `app/api/generate/route.ts`.

## Where things are

`ARCHITECTURE.md` explains how the pieces fit together: the request flow, the report contract, the concept-map layout, the PDF pipeline and the design system.

| Path | What it holds |
| --- | --- |
| `lib/types.ts` | The `Report` contract: Zod schemas and the types inferred from them |
| `lib/sample.ts` | A complete sample report (chemical equilibrium bridged to football tactics) and its Turkish translation |
| `lib/labels.ts` | The fixed words of a report in English and Turkish, shared by the report page and the PDF |
| `lib/concept-map-layout.ts` | Concept-map geometry (columns, curves, wrapped labels), shared by the report page and the PDF |
| `lib/prompt.ts` | The system prompt and the messages sent to the LLM |
| `lib/llm.ts` | The LLM call, reply validation and the single corrective retry |
| `lib/notes.ts` | Text clean-up and heading-aware shortening of long notes |
| `lib/pdf.ts` | PDF text extraction |
| `lib/rate-limit.ts` | In-memory rate limiter |
| `lib/constants.ts` | Limits shared by the form and the API |
| `app/api/generate/route.ts` | The endpoint |
| `app/page.tsx`, `components/GenerateForm.tsx` | Landing page and form |
| `app/report/page.tsx`, `components/ReportView.tsx` | Report viewer; `/report?sample=1` shows the English sample, `/report?sample=tr` the Turkish one |
| `components/ConceptMapDiagram.tsx` | The concept map drawn as SVG on the report page |
| `components/ReportPDF.tsx` | The downloadable A4 PDF, rendered in the browser with `@react-pdf/renderer` |
| `public/fonts` | DejaVu Sans (regular and bold) for the PDF, with its licence; it covers Turkish letters and the science symbols |
| `scripts/self-check.test.mjs` | `npm test`: the samples against `ReportSchema`, the map layout, and the PDF font's glyph coverage |

The form stores the returned report in `sessionStorage` under the key `bridge:report`, and `/report` reads it from there. It also stores `bridge:demo` (`"true"` when the response carried `X-Bridge-Demo: true`), so the report page can say it is showing the demo sample.

The PDF is built in the browser when you click "Download PDF", so it needs no server work and works offline: the fonts are served from `public/fonts`.

## Limits to know about

- The rate limiter keeps its counts in the memory of one server process, so they reset on restart and are not shared between serverless instances.
- Scanned PDFs contain no selectable text and are rejected with a message asking for pasted text.
- Vercel rejects request bodies over 4.5 MB before they reach the app, so the 10 MB PDF limit only applies in full on other hosts and locally.
- The route allows up to 120 seconds per request (`maxDuration`), which needs Fluid compute on Vercel's Hobby plan.
- The PDF font covers Latin, Turkish and common science symbols. Characters outside DejaVu Sans, such as emoji, would show as empty boxes in the PDF.
