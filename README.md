# VIT Grade Analyzer

Upload a VIT FFCS "Provisional Grade History" PDF and get a CGPA dashboard, grade
analytics, curriculum-progress tracking, a CSV export, and a what-if calculator that
tells you the semester GPA needed to hit a target CGPA. Built for Vercel.

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000  -> click "Load sample"
```

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import it at vercel.com -> it auto-detects Next.js, no config needed.
3. (Optional) add the env var `ANTHROPIC_API_KEY` to enable robust LLM PDF extraction.

## How extraction works (three tiers, picked automatically)
1. Pasted text -> deterministic VIT parser (`lib/parser.ts`). Free, local.
2. PDF upload + `ANTHROPIC_API_KEY` set -> Claude extraction. Robust across layouts (paid API).
3. PDF upload + no key -> free server-side text extraction via `pdfjs-dist`
   (`lib/pdfText.ts`), then the VIT parser. $0, runs locally and on Vercel.

So PDF upload works with NO API key on VIT FFCS grade-history PDFs. The "Load
sample" button needs no key either. Set a key only if you need robust extraction
of non-VIT or future-format transcripts.

## The grading logic (FFCS Academic Regulations v4.0)
`lib/vit.ts` encodes the official rules:
- Grade points (Table 4): S=10, A=9, B=8, C=7, D=6, E=5, F/N=0.
- CGPA = sum(Ci x GPi) / sum(Ci) over graded courses only -- P (pass-fail), audit (U)
  and withdrawn (W) courses are excluded from the average (reg 9.10).
- % equivalent = CGPA x 10.
- Projection (`requiredGpa`): solves for the semester GPA needed to reach a target
  CGPA given fresh credits, with an optional grade-improvement term (re-registered
  courses count their credits once, reg 9.10).

## Structure
- `lib/vit.ts` -- grade scale, CGPA, semester GPA, projection engine
- `lib/parser.ts` -- VIT grade-history text parser
- `lib/sampleData.ts` -- bundled sample transcript (demo without a key)
- `components/Dashboard.tsx` -- metrics, GPA trend, grade distribution, curriculum
- `components/ProjectionCalculator.tsx` -- the what-if CGPA calculator
- `app/api/extract/route.ts` -- serverless PDF -> JSON extraction

> Verify grade-improvement treatment with the CoE -- the regulations confirm it is
> permitted but do not fully specify whether the new grade replaces or best-of applies.

## Security note
Next is pinned to `^14.2.33` to pick up the patched 14.2.x line (a December 2025
advisory affected 14.2.5). A fresh `npm install` resolves the safe version.
