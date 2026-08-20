/**
 * Ingestion script.
 * Reads all markdown documents from the docs/ folder,
 * chunks them, and stores in the local SQLite vector store.
 *
 * Usage: node src/ingest.js
 */
import fs from "fs";
import path from "path";
import { config } from "./config.js";
import { chunkText } from "./chunker.js";
import { loadDocument } from "./docLoader.js";
import { VectorStore } from "./vectorStore.js";

async function ingest() {
  console.log("=== Gas Field RAG – Document Ingestion ===\n");

  const docsDir = config.docsDir;
  if (!fs.existsSync(docsDir)) {
    console.error(`Docs directory not found: ${docsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".txt") || f.endsWith(".pdf"))
    .sort();

  if (files.length === 0) {
    console.error("No documents found in docs/ (.md, .txt, .pdf)");
    process.exit(1);
  }

  console.log(`Found ${files.length} documents.\n`);

  const store = new VectorStore(config.dbPath);
  store.clear(); // Fresh ingestion each time

  let totalChunks = 0;

  for (const file of files) {
    const buffer = fs.readFileSync(path.join(docsDir, file));
    const { docId, title, category, body } = await loadDocument(file, buffer);

    const chunks = chunkText(body, config.chunkSize, config.chunkOverlap);

    for (let i = 0; i < chunks.length; i++) {
      store.insert(docId, title, category, i, chunks[i]);
    }

    console.log(`  ✓ ${file} → ${chunks.length} chunk(s)  [${category}]`);
    totalChunks += chunks.length;
  }

  console.log(`\nIngestion complete: ${totalChunks} chunks from ${files.length} documents.`);
  console.log(`Database: ${config.dbPath}`);
  store.close();
}

ingest().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
