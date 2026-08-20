/**
 * Express sunucusu — Yerel RAG Uygulaması (Foundry Local + Node.js).
 * /api/chat, /api/chat/stream, /api/upload, /api/docs, /api/health, /api/status
 * uçlarını sağlar. React frontend (Vite, localhost:5173) buraya fetch ile bağlanır.
 */
import express from "express";
import path from "path";
import fs from "fs";
import { config } from "./config.js";
import { ChatEngine } from "./chatEngine.js";
import { chunkText } from "./chunker.js";
// docLoader.js importunu silip yerine bu basit regex fonksiyonunu ekle:
function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text };

  const rawMeta = match[1];
  const body = match[2];
  const meta = {};

  rawMeta.split("\n").forEach((line) => {
    const [key, ...val] = line.split(":");
    if (key && val.length) {
      meta[key.trim()] = val.join(":").trim();
    }
  });

  return { meta, body };
}
import { extractPdfText } from "./pdfUtils.js"; // PDF ayıklayıcı eklendi

const app = express();

// React geliştirme sunucusundan gelen isteklere izin ver
const ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
app.use("/api", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Filename");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Güvenlik başlıkları ──
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.text({ type: "text/markdown", limit: "2mb" }));
app.use(express.static(config.publicDir));

// ── Chat engine örneği ──
const engine = new ChatEngine();

// ── API: Chat (streaming olmayan) ──
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, compact } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    if (compact !== undefined) engine.setCompactMode(!!compact);

    const result = await engine.query(
      message,
      Array.isArray(history) ? history : []
    );
    res.json(result);
  } catch (err) {
    console.error("[API] Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── API: Chat (SSE ile streaming) ──
app.post("/api/chat/stream", async (req, res) => {
  try {
    const { message, history, compact } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    if (compact !== undefined) engine.setCompactMode(!!compact);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = engine.queryStream(
      message,
      Array.isArray(history) ? history : []
    );

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[API] Stream error:", err.message);
    res.write(`data: ${JSON.stringify({ type: "error", data: "Internal server error" })}\n\n`);
    res.end();
  }
});

// ── API: Doküman yükleme (.md, .txt ve .pdf destekli) ──
app.post("/api/upload", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
  try {
    const filename = req.headers["x-filename"];
    if (!filename || typeof filename !== "string") {
      return res.status(400).json({ error: "x-filename header is required" });
    }

    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = path.extname(safeName).toLowerCase();

    // Uzantı Kontrolü
    if (![".md", ".txt", ".pdf"].includes(ext)) {
      return res.status(400).json({ error: "Sadece .md, .txt ve .pdf dosyaları kabul edilir." });
    }

    const fileBuffer = req.body;
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: "Dosya içeriği boş olamaz." });
    }

    let content = "";

    // Dosya türüne göre metin çıkarma
    if (ext === ".pdf") {
      content = await extractPdfText(fileBuffer);
    } else {
      content = fileBuffer.toString("utf-8");
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: "Dosya içeriği okunamadı veya çok kısa." });
    }

    // Dosyayı diske kaydet
    const filePath = path.resolve(config.docsDir, safeName);
    if (!filePath.startsWith(path.resolve(config.docsDir))) {
      return res.status(400).json({ error: "Geçersiz dosya adı." });
    }
    if (!fs.existsSync(config.docsDir)) {
      fs.mkdirSync(config.docsDir, { recursive: true });
    }

    // PDF ise çıkartılan metni kaydet
    if (ext === ".pdf") {
      const textFileName = `${path.basename(safeName, ".pdf")}.txt`;
      fs.writeFileSync(path.resolve(config.docsDir, textFileName), content, "utf-8");
    } else {
      fs.writeFileSync(filePath, content, "utf-8");
    }

    // Front-Matter ve Veritabanı İndeksleme
    const { meta, body } = parseFrontMatter(content);
    const docId = meta.id || path.basename(safeName, path.extname(safeName));
    const title = meta.title || safeName;
    const category = meta.category || "Uploaded";

    const store = engine.getStore();
    store.removeByDocId(docId);

    const chunks = chunkText(body, config.chunkSize, config.chunkOverlap);
    for (let i = 0; i < chunks.length; i++) {
      store.insert(docId, title, category, i, chunks[i]);
    }

    console.log(`[Upload] ${safeName} → ${chunks.length} chunk(s) ingested`);

    res.json({
      success: true,
      filename: safeName,
      docId,
      title,
      category,
      chunks: chunks.length,
      totalChunks: store.count(),
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// ── API: Doküman listesi ──
app.get("/api/docs", (_req, res) => {
  try {
    const docs = engine.getStore().listDocs();
    res.json({ docs });
  } catch (err) {
    console.error("[API] Docs list error:", err.message);
    res.status(500).json({ error: "Failed to list documents" });
  }
});

// ── API: Sağlık kontrolü ──
let engineReady = false;
let lastStatus = { phase: "init", message: "Starting..." };

app.get("/api/health", (_req, res) => {
  res.json({ status: engineReady ? "ok" : "loading", model: config.model, ...lastStatus });
});

// ── API: Başlangıç durumu (SSE) ──
const statusClients = new Set();

app.get("/api/status", (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify(lastStatus)}\n\n`);

  if (engineReady) {
    res.write(`data: ${JSON.stringify({ phase: "ready", message: "Ready" })}\n\n`);
    res.end();
    return;
  }

  statusClients.add(res);
  _req.on("close", () => statusClients.delete(res));
});

function broadcastStatus(status) {
  lastStatus = status;
  for (const client of statusClients) {
    client.write(`data: ${JSON.stringify(status)}\n\n`);
    if (status.phase === "ready") {
      client.end();
    }
  }
  if (status.phase === "ready") statusClients.clear();
}

// ── Sunucuyu başlat ──
async function start() {
  console.log("=== Yerel RAG — Foundry Local + Node.js ===\n");

  engine.onStatus((status) => broadcastStatus(status));

  app.listen(config.port, config.host, () => {
    console.log(`[Server] API şurada: http://${config.host}:${config.port}/api`);
    console.log("[Server] Model arka planda başlatılıyor...\n");
  });

  await engine.init();
  engineReady = true;
  broadcastStatus({ phase: "ready", message: "Ready" });

  console.log("[Server] Tamamen çevrimdışı — dışarıya hiçbir istek gitmiyor.\n");
}

start().catch((err) => {
  console.error("Başlatma başarısız:", err);
  broadcastStatus({ phase: "error", message: err.message || "Failed to start" });
  process.exit(1);
});