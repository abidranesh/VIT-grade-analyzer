"use client";
import { useMemo, useState } from "react";
import Dashboard from "@/components/Dashboard";
import ProjectionCalculator from "@/components/ProjectionCalculator";
import { analyze } from "@/lib/vit";
import { parseTranscript } from "@/lib/parser";
import { SAMPLE } from "@/lib/sampleData";
import { Transcript } from "@/lib/types";

const STEPS = [
  "Log in to VTOP.",
  "Open Examinations in the menu bar.",
  'Under General, select "Grade History".',
  'Click the green "Download History" button.',
  "Open the downloaded PDF, select all (Ctrl+A / Cmd+A), and copy (Ctrl+C / Cmd+C).",
  "Paste it into the box below and click Analyze.",
];

export default function Page() {
  const [t, setT] = useState<Transcript | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const a = useMemo(() => (t ? analyze(t) : null), [t]);

  function analyzePasted() {
    if (text.trim().length < 50) {
      setErr("Paste your full Grade History text first.");
      return;
    }
    try {
      const parsed = parseTranscript(text);
      if (parsed.courses.length === 0) {
        setErr("No course rows found. Make sure you copied the whole Grade History PDF.");
        return;
      }
      setErr("");
      setT(parsed);
    } catch (e) {
      setErr(String(e));
    }
  }

  function reset() {
    setT(null); setText(""); setErr("");
  }

  function exportCsv() {
    if (!t) return;
    const rows = [["SlNo", "Code", "Title", "Type", "Credits", "Grade", "ExamMonth", "Distribution"]];
    t.courses.forEach((c) => rows.push([c.slNo, c.code, c.title, c.type, c.credits, c.grade, c.examMonth, c.distribution].map(String)));
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${t.registerNo || "transcript"}.csv`; link.click();
  }

  return (
    <main>
      <div className="topbar">
        <strong>VIT Grade Analyzer<span className="tick">.</span></strong>
        <div className="actions">
          {!t && <button onClick={() => setT(SAMPLE)}>Load sample</button>}
          {t && <button onClick={reset}>New transcript</button>}
          {t && <button onClick={exportCsv}>Export CSV</button>}
        </div>
      </div>

      {err && <p className="err">{err}</p>}

      {!t && (
        <div className="empty reveal">
          <h2 className="empty-title">Paste your VIT grade history to analyze it</h2>
          <p className="muted">Your data stays in your browser — nothing is uploaded.</p>
          <ol className="steps">
            {STEPS.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <textarea
            placeholder="Paste the copied Grade History text here…"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="empty-actions">
            <button className="primary" onClick={analyzePasted}>Analyze</button>
            <span className="muted small">or <button className="link" onClick={() => setT(SAMPLE)}>load the sample</button></span>
          </div>
        </div>
      )}

      {t && a && (
        <>
          <Dashboard t={t} a={a} />
          <ProjectionCalculator a={a} t={t} />
        </>
      )}
    </main>
  );
}

