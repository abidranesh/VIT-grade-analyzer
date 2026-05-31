"use client";
import { useMemo, useState } from "react";
import { Analysis, Transcript } from "@/lib/types";
import { requiredGpa, improvementCandidates } from "@/lib/vit";
import { useCountUp } from "@/lib/useAnim";

export default function ProjectionCalculator({ a, t }: { a: Analysis; t: Transcript }) {
  const [credits, setCredits] = useState(27);
  const [target, setTarget] = useState(9.0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidates = useMemo(() => improvementCandidates(t), [t]);

  const improvementQp = useMemo(
    () => candidates.filter((c) => selected.has(c.code)).reduce((s, c) => s + c.maxGainToS, 0),
    [candidates, selected]
  );

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const res = requiredGpa({
    qualityPoints: a.qualityPoints,
    gradedCredits: a.gradedCredits,
    newCredits: credits,
    targetCgpa: target,
    improvementQp,
  });

  const g = res.requiredSemesterGpa;
  const bestEver = Math.max(...a.semesters.map((s) => s.gpa));
  const color = g > 10 ? "#A32D2D" : g <= bestEver ? "#0F6E56" : "#854F0B";
  const verdict =
    g > 10
      ? `Not possible — even an all-S ${credits}-credit semester caps at CGPA ${res.maxAchievableCgpa.toFixed(3)}.`
      : g <= bestEver
      ? "Within your past performance — you have hit this before."
      : `Above your best semester (${bestEver.toFixed(2)}) — demanding but possible.`;

  const cgpaFromImprovementsOnly = (a.qualityPoints + improvementQp) / a.gradedCredits;

  const animatedG = useCountUp(g > 10 ? 10 : g, 450, 2);

  return (
    <section className="card reveal" style={{ animationDelay: "540ms" }}>
      <h2>What-if: reaching a target CGPA</h2>

      <div className="control">
        <label>Fresh graded credits next term</label>
        <input type="range" min={3} max={35} step={1} value={credits}
          onChange={(e) => setCredits(+e.target.value)} />
        <span>{credits}</span>
      </div>
      <div className="control">
        <label>Target CGPA</label>
        <input type="range" min={Math.floor(a.cgpa * 10) / 10} max={9.5} step={0.01} value={target}
          onChange={(e) => setTarget(+e.target.value)} />
        <span>{target.toFixed(2)}</span>
      </div>

      {candidates.length > 0 && (
        <div className="improve">
          <p className="improve-head">
            Improve grades via re-registration (FFCS reg 9.10 — pick any, sorted by impact)
          </p>
          <div className="improve-list">
            {candidates.map((c) => (
              <label key={c.code} className={"improve-row" + (selected.has(c.code) ? " on" : "")}>
                <input type="checkbox" checked={selected.has(c.code)} onChange={() => toggle(c.code)} />
                <span className={"gpill g-" + c.grade}>{c.grade}</span>
                <span className="improve-title">{c.title}</span>
                <span className="improve-meta">{c.credits} cr · +{c.maxGainToS.toFixed(1)} QP to S</span>
              </label>
            ))}
          </div>
          {selected.size > 0 && (
            <p className="muted small improve-sum">
              {selected.size} selected → +{improvementQp.toFixed(1)} quality points.
              Improvements alone would lift CGPA to {cgpaFromImprovementsOnly.toFixed(3)}.
            </p>
          )}
        </div>
      )}

      <div className="result">
        <p className="muted">Required semester GPA</p>
        <p className="big gpa-num" style={{ color }}>{g > 10 ? "not possible" : animatedG.toFixed(2)}</p>
        <p className="verdict-text" style={{ color }}>{verdict}</p>
        <p className="muted small">
          Ceiling at {credits} credits (all S): CGPA {res.maxAchievableCgpa.toFixed(3)}
          {selected.size > 0 ? `  ·  ${selected.size} course(s) improved (+${improvementQp.toFixed(1)} QP)` : ""}
        </p>
      </div>
    </section>
  );
}

