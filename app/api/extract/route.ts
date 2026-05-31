import { NextRequest, NextResponse } from "next/server";
import { parseTranscript } from "@/lib/parser";
import { extractPdfText } from "@/lib/pdfText";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const text = form.get("text") as string | null;

  if (text) {
    try {
      return NextResponse.json({ transcript: parseTranscript(text), source: "parser" });
    } catch (e) {
      return NextResponse.json({ error: "Parse failed: " + String(e) }, { status: 422 });
    }
  }

  if (!file) {
    return NextResponse.json({ error: "Upload a PDF or post extracted text." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const key = process.env.ANTHROPIC_API_KEY;

  if (key) {
    const b64 = Buffer.from(bytes).toString("base64");
    const schema = `Return ONLY JSON, no prose, matching:
{"registerNo":string,"name":string,"program":string,"school":string,"statedCgpa":number,
 "creditsRequiredTotal":number,
 "courses":[{"slNo":number,"code":string,"title":string,"type":string,"credits":number,"grade":string,"examMonth":string,"distribution":string}],
 "curriculum":[{"category":string,"required":number,"earned":number}]}
Grades are one of S,A,B,C,D,E,F,N,P,W,U. examMonth like "Nov-2025".`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
            { type: "text", text: "Extract this academic transcript. " + schema },
          ],
        }],
      }),
    });
    const data = await r.json();
    const raw = (data.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    try {
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return NextResponse.json({ transcript: json, source: "llm" });
    } catch {
      return NextResponse.json({ error: "Model did not return valid JSON", raw }, { status: 502 });
    }
  }

  try {
    const pdfText = await extractPdfText(bytes);
    const transcript = parseTranscript(pdfText);
    if (transcript.courses.length === 0) {
      return NextResponse.json(
        { error: "Extracted the PDF but found no course rows. This parser is tuned to the VIT FFCS grade-history layout; for other formats set ANTHROPIC_API_KEY to use AI extraction." },
        { status: 422 }
      );
    }
    return NextResponse.json({ transcript, source: "pdfjs" });
  } catch (e) {
    return NextResponse.json({ error: "PDF extraction failed: " + String(e) }, { status: 500 });
  }
}

