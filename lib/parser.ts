import { Course, CurriculumLine, Grade, Transcript } from "./types";

const COURSE_ROW =
  /(\d+)\s+([A-Z]{2,4}\d{2,3}[A-Z])\s+(.+?)\s+(TH|LO|ETL|SS|OC|PJT|ECA)\s+(\d\.\d)\s+([SABCDEFNPWU])\d?\s+([A-Z][a-z]{2}-\d{4})\s+\d{1,2}-[A-Z][a-z]{2}-\d{4}\s+(\S+)\s+([A-Z]{2,5})/g;

const CURRICULUM_ROW =
  /([A-Z][A-Za-z][A-Za-z\- ]+?)\s+(\d+\.\d)\s+(\d+\.\d)(?=\s|$)/g;

export function parseTranscript(raw: string): Transcript {
  const text = raw.replace(/\s+/g, " ").trim();

  const courses: Course[] = [];
  for (const m of text.matchAll(COURSE_ROW)) {
    courses.push({
      slNo: parseInt(m[1]),
      code: m[2],
      title: m[3].trim(),
      type: m[4],
      credits: parseFloat(m[5]),
      grade: m[6] as Grade,
      examMonth: m[7],
      distribution: m[9],
    });
  }

  const curriculum: CurriculumLine[] = [];
  let creditsRequiredTotal: number | undefined;
  const curSection = text.match(/Curriculum Details(.*?)(Basket Details|CGPA Details|$)/i)?.[1] ?? "";
  for (const m of curSection.matchAll(CURRICULUM_ROW)) {
    const category = m[1].trim();
    if (/credits required|distribution type/i.test(category)) continue;
    const line = { category, required: parseFloat(m[2]), earned: parseFloat(m[3]) };
    if (/total/i.test(line.category)) creditsRequiredTotal = line.required;
    else curriculum.push(line);
  }

  const reg = text.match(/Register No\.?\s*([0-9A-Z]+)/i)?.[1] ?? "";
  const name = text.match(/Name\s+([A-Z][A-Z .]+?)\s+Program/i)?.[1]?.trim() ?? "";
  const program = text.match(/Program\s+(.+?)\s+School/i)?.[1]?.trim() ?? "";
  const school = text.match(/School\s+(.+?)\s+(Note|Grade History|$)/i)?.[1]?.trim() ?? "";
  const statedCgpa = parseFloat(text.match(/\b(\d\.\d{2})\b(?=\s+\d+\s+\d+\s+\d+)/)?.[1] ?? "") || undefined;

  return { registerNo: reg, name, program, school, courses, curriculum, statedCgpa, creditsRequiredTotal };
}

