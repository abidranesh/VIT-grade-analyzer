export type Grade = "S" | "A" | "B" | "C" | "D" | "E" | "F" | "N" | "P" | "W" | "U";

export interface Course {
  slNo: number;
  code: string;
  title: string;
  type: string;
  credits: number;
  grade: Grade;
  examMonth: string;
  distribution: string;
}

export interface CurriculumLine {
  category: string;
  required: number;
  earned: number;
}

export interface Transcript {
  registerNo: string;
  name: string;
  program: string;
  school: string;
  courses: Course[];
  curriculum: CurriculumLine[];
  statedCgpa?: number;
  creditsRequiredTotal?: number;
}

export interface SemesterStat {
  term: string;
  label: string;
  gpa: number;
  gradedCredits: number;
  passCredits: number;
}

export interface Analysis {
  cgpa: number;
  gradedCredits: number;
  qualityPoints: number;
  totalCreditsEarned: number;
  percentEquivalent: number;
  semesters: SemesterStat[];
  distribution: Record<string, number>;
  creditsToGraduate: number;
}

