import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");

function cleanText(text) {
  if (!text) return "";
  return text
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
/**
 * PDF buffer verisinden düz metin çıkarır.
 * hem pdf-parse v1 (fonksiyon) hem de v2 (PDFParse sınıfı) sürümlerini destekler.
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
export async function extractPdfText(buffer) {
  try {
    // 1. pdf-parse v2 Sürümü Kontrolü
    if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      return result.text || "";
    } 

    // 2. pdf-parse v1 Sürümü Kontrolü (Fonksiyon olarak çağrılan varsayılan yapı)
    const parseFn = typeof pdfParseModule === "function" ? pdfParseModule : pdfParseModule.default;
    if (typeof parseFn === "function") {
      const data = await parseFn(buffer);
      return data.text || "";
    }

    throw new Error("pdf-parse kütüphanesi düzgün yüklenemedi.");
  } catch (error) {
    console.error("[pdfUtils] PDF okuma hatası:", error);
    throw new Error("PDF dosyası okunamadı veya metin içeriği çözülemedi.");
  }
}