# Bridge

**Your lecture notes, explained through what you love.**

Upload your notes, name an interest such as football, gaming or cooking, and Bridge explains every key concept of the lecture through that interest. Each comparison comes with an honest note on where it stops working, so the analogy never replaces the real subject.

**Demo video (2:45):** VIDEO_LINK_HERE

## What you get

- **The key concepts** of the lecture (four to six), each explained first the way the notes put it and then through your interest, with a worked example and a common misconception.
- **Where the analogy breaks.** Every comparison states its limits and gets a match score from 1 to 5.
- **A concept map** of how the ideas connect, **a five-question quiz** on the lecture itself, and three next steps.
- **A PDF** of the whole report to download.
- **Typed, handwritten or mixed notes.** Bridge reads handwriting, highlighting and diagrams in PDFs of up to 30 pages, or you can paste text.
- **Reports in English or Turkish.**

If the upload is not lecture material, Bridge says so instead of inventing content.

## How it works

1. The form sends the PDF or pasted text, the interest, the level and the language to one API route.
2. A PDF of up to 30 pages goes to OpenAI's GPT-6 Luna model as the file itself, so the model gets each page's text and an image of the page. A longer PDF is read by its typed text alone.
3. The model has to answer in a fixed JSON structure. The server checks the answer against that structure and asks once more if it does not fit.
4. The report is shown in the browser and kept only in that tab. The PDF is built in the browser too.

There is no database and there are no accounts. Built with Next.js 14, TypeScript, Tailwind, Zod, the OpenAI SDK, unpdf and @react-pdf/renderer.

## Run it locally

Needs Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

With `DEMO_MODE=true` in `.env.local` the app needs no API key and always answers with the built-in sample report. For real reports, set `LLM_API_KEY` to an OpenAI key and `DEMO_MODE=false`, then restart.

`npm test` runs the self-checks, which need Node 22.18 or newer.

## Settings

These go in `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `LLM_API_KEY` | unless `DEMO_MODE=true` | OpenAI API key |
| `LLM_MODEL` | no | Model id, default `gpt-6-luna` |
| `LLM_REASONING_EFFORT` | no | `none`, `low`, `medium` or `high` for reasoning models |
| `LLM_BASE_URL` | no | Any OpenAI-compatible endpoint |
| `DEMO_MODE` | no | `true` returns the built-in sample and skips the model |
| `RATE_LIMIT_PER_MINUTE` | no | Requests per client address per minute, default 10 |

## API

`POST /api/generate` takes `multipart/form-data` and answers with a report as JSON, or with `{ "error": string }` and a 4xx or 5xx status.

| Field | Notes |
| --- | --- |
| `file` | PDF, optional, up to 10 MB |
| `text` | Pasted notes, optional. At least one of `file` and `text` is required |
| `interest` | Required, up to 120 characters |
| `level` | Optional, defaults to `undergraduate` |
| `language` | Optional, `en` (default) or `tr` |

Response headers say whether the notes were shortened (`X-Bridge-Notes-Truncated`), whether the model saw the pages as images (`X-Bridge-Notes-Images`), and whether the answer is the demo sample (`X-Bridge-Demo`).

Example calls, with the result to expect from each, are at the bottom of `app/api/generate/route.ts`.

## Limits

- Handwriting, highlighting and diagrams are only read in PDFs of 30 pages or fewer. In a longer PDF only the typed text counts.
- Handwriting was tested with neat writing in English. Messy handwriting and notes written in Turkish have not been tested.
- A report has at most six concepts, even when the notes cover more.
- A report takes about half a minute and, with `gpt-6-luna`, costs roughly 0.2 to 0.4 US cents (measured in October 2026).
- Pasted text over 15,000 characters is shortened section by section before the model reads it.
- The rate limiter keeps its counts in the memory of one server process, so they reset on restart.
- Characters outside the PDF font, such as emoji, show as empty boxes in the downloaded PDF.

## More detail

`ARCHITECTURE.md` describes the request flow, the structure of a report, the concept-map layout, the PDF and the design system.

## Team

SVT Labs: NAME_1 and NAME_2
