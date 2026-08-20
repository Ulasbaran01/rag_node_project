// Uygulama yapılandırması – tüm yollar proje kökenine göre
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

export const config = {
  // Model — Qwen2.5-7B (~7B), cross-platform (foundry-local-sdk, WinML değil)
  model: "qwen2.5-7b",

  // RAG
  docsDir: path.join(ROOT, "docs"),
  dbPath: path.join(ROOT, "data", "rag.db"),
  chunkSize: 200,       // token (yaklaşık) — NPU uyumluluğu için küçük tutuldu
  chunkOverlap: 25,     // chunk'lar arası örtüşme (token)
  topK: 3,              // çekilecek chunk sayısı

  // Sunucu
  port: 3000,
  host: "127.0.0.1",

  // Statik dosyalar (React build'i buradan servis edilebilir, isteğe bağlı)
  publicDir: path.join(ROOT, "public"),
};
