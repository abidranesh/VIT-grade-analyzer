export async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const doc = await (pdfjs as any).getDocument({
    data,

    disableWorker: true,
    useSystemFonts: true,
    isEvalSupported: false,

    disableFontFace: true,
  }).promise;

  let out = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => (it.str ?? "")).join(" ") + "\n";
  }
  return out;
}

