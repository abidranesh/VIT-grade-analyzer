"use client";
import {
  Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import { Analysis, Transcript } from "@/lib/types";
import { useCountUp, usePrefersReducedMotion } from "@/lib/useAnim";

const ACCENT = "#e8ff00";
const PURPLE = "#f5f5f5";
const AMBER = "#ff5252";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      {label != null && <div className="tip-label">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="tip-row">
          <span className="tip-dot" style={{ background: p.color || p.fill }} />
          <span>{p.name}</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ t, a }: { t: Transcript; a: Analysis }) {
  const reduced = usePrefersReducedMotion();

  let cumQp = 0, cumCr = 0;
  const trend = a.semesters.map((s) => {
    cumQp += s.gpa * s.gradedCredits;
    cumCr += s.gradedCredits;
    return {
      label: s.label.split(" ")[1] + s.label.split("(")[1].replace(")", ""),
      gpa: +s.gpa.toFixed(2),
      cgpa: +(cumQp / cumCr).toFixed(2),
    };
  });

  const order = ["S", "A", "B", "C", "D", "E", "F", "N"];
  const dist = order.filter((g) => a.distribution[g]).map((g) => ({ grade: g, count: a.distribution[g] }));

  const curr = t.curriculum
    .filter((l) => l.required > 0 || l.earned > 0)
    .map((l) => ({ name: l.category.replace("Discipline-linked Engineering Sciences", "Eng Sciences"), Required: l.required, Earned: l.earned }));

  const animMs = reduced ? 0 : 900;

  return (
    <>
      <header className="head reveal" style={{ animationDelay: "0ms" }}>
        <h1>{t.name || "Student"}</h1>
        <p className="muted">{t.registerNo} · {t.program}</p>
      </header>

      <div className="metrics">
        <Metric label="CGPA" value={a.cgpa} decimals={2} delay={60} />
        <Metric label="% equivalent" value={a.percentEquivalent} decimals={1} suffix="%" delay={120} />
        <Metric label="Credits earned" value={a.totalCreditsEarned} decimals={0}
          suffix={` / ${a.totalCreditsEarned + a.creditsToGraduate}`} delay={180} />
        <Metric label="To graduate" value={a.creditsToGraduate} decimals={0} suffix=" cr" delay={240} />
      </div>

      <section className="card reveal" style={{ animationDelay: "300ms" }}>
        <h2>GPA trajectory</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trend} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={{ opacity: 0.3 }} />
            <YAxis domain={[7.5, 10]} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: ACCENT, strokeOpacity: 0.2 }} />
            <Legend />
            <Line type="monotone" dataKey="gpa" name="Semester GPA" stroke={ACCENT} strokeWidth={2.5}
              dot={{ r: 3 }} activeDot={{ r: 6 }} animationDuration={animMs} />
            <Line type="monotone" dataKey="cgpa" name="Cumulative CGPA" stroke={PURPLE} strokeWidth={2.5}
              strokeDasharray="6 4" dot={{ r: 3 }} activeDot={{ r: 6 }} animationDuration={animMs} animationBegin={reduced ? 0 : 300} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <div className="two-col">
        <section className="card reveal" style={{ animationDelay: "380ms" }}>
          <h2>Grade distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dist}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="grade" fontSize={12} tickLine={false} axisLine={{ opacity: 0.3 }} />
              <YAxis fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: ACCENT, fillOpacity: 0.06 }} />
              <Bar dataKey="count" name="Courses" radius={[4, 4, 0, 0]} animationDuration={animMs}>
                {dist.map((d, i) => (
                  <Cell key={i} fill={["C", "D", "E", "F", "N"].includes(d.grade) ? AMBER : ACCENT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card reveal" style={{ animationDelay: "460ms" }}>
          <h2>Curriculum progress</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={curr} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis type="number" fontSize={11} tickLine={false} axisLine={{ opacity: 0.3 }} />
              <YAxis type="category" dataKey="name" width={120} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: ACCENT, fillOpacity: 0.06 }} />
              <Bar dataKey="Required" fill="#3d3d3d" radius={[0, 4, 4, 0]} animationDuration={animMs} />
              <Bar dataKey="Earned" fill={ACCENT} radius={[0, 4, 4, 0]} animationDuration={animMs} animationBegin={reduced ? 0 : 200} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </>
  );
}

function Metric({ label, value, decimals, suffix = "", delay }:
  { label: string; value: number; decimals: number; suffix?: string; delay: number }) {
  const shown = useCountUp(value, 650, decimals);
  return (
    <div className="metric reveal" style={{ animationDelay: `${delay}ms` }}>
      <p className="muted">{label}</p>
      <p className="num">{shown.toFixed(decimals)}{suffix}</p>
    </div>
  );
}

