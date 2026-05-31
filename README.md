# VIT Grade Analyzer

Paste a VIT FFCS "Provisional Grade History" and get a CGPA dashboard, grade
analytics, curriculum-progress tracking, a CSV export, and a what-if calculator
that tells you the semester GPA needed to hit a target CGPA. Fully static, no
server or API key required. Built for Vercel.

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000  -> click "Load sample"
```

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import it at vercel.com -> it auto-detects Next.js, no config needed.
3. Deploy. No environment variables required.

## Getting your transcript
Log in to VTOP -> Examinations -> General -> Grade History -> Download History.
Open the PDF, select all (Ctrl+A / Cmd+A), copy, and paste into the app, then
click Analyze. Everything runs in your browser; nothing is uploaded.

## The grading logic (FFCS Academic Regulations v4.0)
`lib/vit.ts` encodes the official rules:
- Grade points (Table 4): S=10, A=9, B=8, C=7, D=6, E=5, F/N=0.
- CGPA = sum(Ci x GPi) / sum(Ci) over graded courses only -- P (pass-fail),
  audit (U) and withdrawn (W) are excluded (reg 9.10).
- Re-registered courses count their credits once, best attempt only (reg 9.10).
- % equivalent = CGPA x 10.
- Projection solves for the semester GPA needed to reach a target CGPA, with an
  optional per-course grade-improvement term.

## Structure
- `lib/vit.ts` -- grade scale, CGPA, semester GPA, dedup, projection engine
- `lib/parser.ts` -- VIT grade-history text parser
- `lib/sampleData.ts` -- bundled demo transcript
- `lib/useAnim.ts` -- count-up + reduced-motion hooks
- `components/Dashboard.tsx` -- metrics, GPA trend, distribution, curriculum
- `components/ProjectionCalculator.tsx` -- the what-if CGPA calculator

> Verify grade-improvement treatment with the CoE -- the regulations confirm it
> is permitted but do not fully specify replace vs best-of.
