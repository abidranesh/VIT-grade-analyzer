import { Analysis, Course, Grade, SemesterStat, Transcript } from "./types";

export const GRADE_POINTS: Record<string, number> = {
  S: 10, A: 9, B: 8, C: 7, D: 6, E: 5, F: 0, N: 0,
};

export const GRADED = new Set(["S", "A", "B", "C", "D", "E", "F", "N"]);

export function countsTowardCgpa(c: Course): boolean {
  return GRADED.has(c.grade);
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function termKey(examMonth: string): number {
  const [mon, yr] = examMonth.split("-");
  return parseInt(yr) * 12 + MONTHS.indexOf(mon);
}

function semLabel(examMonth: string, idx: number): string {
  const [mon, yr] = examMonth.split("-");
  const season = ["Nov", "Dec"].includes(mon) ? "Fall" : "Win";
  return `Sem ${idx + 1} (${season} ${yr.slice(2)})`;
}

export function dedupeForCgpa(courses: Course[]): Course[] {
  const best = new Map<string, Course>();
  for (const c of courses) {
    if (!GRADED.has(c.grade)) continue;
    const prev = best.get(c.code);
    if (!prev || GRADE_POINTS[c.grade] > GRADE_POINTS[prev.grade]) {
      best.set(c.code, c);
    }
  }
  return [...best.values()];
}

export function semesterGpa(courses: Course[]): number {
  let qp = 0, cr = 0;
  for (const c of courses) {
    if (!countsTowardCgpa(c)) continue;
    qp += GRADE_POINTS[c.grade] * c.credits;
    cr += c.credits;
  }
  return cr === 0 ? 0 : qp / cr;
}

export function analyze(t: Transcript): Analysis {

  const graded = dedupeForCgpa(t.courses);
  const qualityPoints = graded.reduce((s, c) => s + GRADE_POINTS[c.grade] * c.credits, 0);
  const gradedCredits = graded.reduce((s, c) => s + c.credits, 0);
  const cgpa = gradedCredits === 0 ? 0 : qualityPoints / gradedCredits;

  const byTerm = new Map<string, Course[]>();
  for (const c of t.courses) {
    if (!byTerm.has(c.examMonth)) byTerm.set(c.examMonth, []);
    byTerm.get(c.examMonth)!.push(c);
  }
  const terms = [...byTerm.keys()].sort((a, b) => termKey(a) - termKey(b));

  let cumQp = 0, cumCr = 0;
  const semesters: SemesterStat[] = terms.map((term, idx) => {
    const list = byTerm.get(term)!;
    const g = list.filter(countsTowardCgpa);
    const qp = g.reduce((s, c) => s + GRADE_POINTS[c.grade] * c.credits, 0);
    const cr = g.reduce((s, c) => s + c.credits, 0);
    cumQp += qp; cumCr += cr;
    return {
      term,
      label: semLabel(term, idx),
      gpa: cr === 0 ? 0 : qp / cr,
      gradedCredits: cr,
      passCredits: list.filter(c => !countsTowardCgpa(c)).reduce((s, c) => s + c.credits, 0),
    };
  });

  const distribution: Record<string, number> = {};
  for (const c of graded) distribution[c.grade] = (distribution[c.grade] || 0) + 1;

  const earnedCodes = new Map<string, number>();
  for (const c of graded) {
    if (c.grade !== "F" && c.grade !== "N") earnedCodes.set(c.code, c.credits);
  }
  const passCredits = new Map<string, number>();
  for (const c of t.courses) {
    if (c.grade === "P") passCredits.set(c.code, c.credits);
  }
  const totalCreditsEarned =
    [...earnedCodes.values()].reduce((s, v) => s + v, 0) +
    [...passCredits.values()].reduce((s, v) => s + v, 0);

  const requiredTotal = t.creditsRequiredTotal
    ?? t.curriculum.find(l => /total/i.test(l.category))?.required
    ?? 0;

  return {
    cgpa,
    gradedCredits,
    qualityPoints,
    totalCreditsEarned,
    percentEquivalent: cgpa * 10,
    semesters,
    distribution,
    creditsToGraduate: Math.max(0, requiredTotal - totalCreditsEarned),
  };
}

export interface ProjectionInput {
  qualityPoints: number;
  gradedCredits: number;
  newCredits: number;
  targetCgpa: number;
  improvementQp?: number;
}

export interface ProjectionResult {
  requiredSemesterGpa: number;
  feasible: boolean;
  maxAchievableCgpa: number;
}

export function requiredGpa(i: ProjectionInput): ProjectionResult {
  const qp = i.qualityPoints + (i.improvementQp ?? 0);
  const denom = i.gradedCredits + i.newCredits;
  const required = i.newCredits === 0
    ? NaN
    : (i.targetCgpa * denom - qp) / i.newCredits;
  const maxAchievableCgpa = (qp + i.newCredits * 10) / denom;
  return {
    requiredSemesterGpa: required,
    feasible: required <= 10,
    maxAchievableCgpa,
  };
}

export function improvementQp(credits: number, from: Grade, to: Grade): number {
  return credits * (GRADE_POINTS[to] - GRADE_POINTS[from]);
}

export interface ImprovementCandidate {
  code: string;
  title: string;
  credits: number;
  grade: Grade;
  gradePoints: number;
  maxGainToS: number;
}

export function improvementCandidates(t: Transcript): ImprovementCandidate[] {
  return dedupeForCgpa(t.courses)
    .filter((c) => GRADE_POINTS[c.grade] < GRADE_POINTS["S"])
    .map((c) => ({
      code: c.code,
      title: c.title,
      credits: c.credits,
      grade: c.grade,
      gradePoints: GRADE_POINTS[c.grade],
      maxGainToS: c.credits * (GRADE_POINTS["S"] - GRADE_POINTS[c.grade]),
    }))
    .sort((a, b) => b.maxGainToS - a.maxGainToS);
}

