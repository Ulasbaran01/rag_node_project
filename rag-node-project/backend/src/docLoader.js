/**
 * Loads a single source document (markdown/text with front-matter, or PDF)
 * into a normalised {docId, title, category, body} shape ready for chunking.
 * Shared between the ingest script and the /api/upload endpoint.
 */
import path from "path";
import { parseFrontMatter } from "./chunker.js";
import { extractPdfText } from "./pdfUtils.js";

export async function loadDocument(filename, buffer) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".pdf") {
    const body = await extractPdfText(buffer);
    return {
      docId: path.basename(filename, ext),
      title: filename,
      category: "PDF",
      body,
    };
  }

  const content = buffer.toString("utf-8");
  const { meta, body } = parseFrontMatter(content);
  return {
    docId: meta.id || path.basename(filename, ext),
    title: meta.title || filename,
    category: meta.category || "Uncategorised",
    body,
  };
}
