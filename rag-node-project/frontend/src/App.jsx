import { useState, useRef, useEffect } from "react";

const API_URL = "http://127.0.0.1:3000";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState(null);

  // isReady durumunu burada tanımlıyoruz
  const [status] = useState({
    phase: "ready",
    message: "Yerel model hazır",
  });
  const isReady = status.phase === "ready";

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function handleAsk(e) {
    e.preventDefault();

    const question = input.trim();

    if (!question || loading) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: question,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          history: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Backend isteği başarısız oldu.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.text,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      console.error("Chat error:", err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            err.message ||
            "Backend'e ulaşılamadı. Node.js sunucusunun çalıştığından emin ol.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; 

    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isAllowed = fileName.endsWith(".md") || fileName.endsWith(".txt") || fileName.endsWith(".pdf");
    
    if (!isAllowed) {
      setUploadNote({ ok: false, text: "Sadece .md, .txt veya .pdf dosyaları yüklenebilir." });
      return;
    }

    setUploading(true);
    setUploadNote(null);

    try {
      // Backend express.raw() ile x-filename header'ı bekliyor
      const fileBuffer = await file.arrayBuffer();

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "X-Filename": file.name,
        },
        body: fileBuffer,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Yükleme başarısız oldu.");
      }

      setUploadNote({
        ok: true,
        text: `"${data.title}" yüklendi (${data.chunks} parça, toplam ${data.totalChunks}).`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setUploadNote({ ok: false, text: err.message || "Yükleme sırasında hata oluştu." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="header-title">
          <span
            className={`dot ${isReady ? "" : "dot-pending"}`}
            aria-hidden="true"
          />

          Yerel Bilgi Asistanı
        </div>

        <div className="header-actions">
          <input
            type="file"
            ref={fileInputRef}
            accept=".md,.txt,.pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Yükleniyor…" : "Doküman Yükle"}
          </button>

          <div className="header-status">{status.message}</div>
        </div>
      </header>

      {uploadNote && (
        <div className={`upload-note ${uploadNote.ok ? "ok" : "error"}`}>
          {uploadNote.text}
        </div>
      )}

      <main className="chat" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            Dokümanların hakkında bir soru sor. Cevaplar yalnızca kendi
            belgelerinden üretilir — hiçbir veri internete gitmez.
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`bubble ${message.role}`}>
            <div className="bubble-text">{message.text}</div>

            {message.sources && message.sources.length > 0 && (
              <div className="sources">
                {message.sources.map((source, sourceIndex) => (
                  <span className="source-tag" key={sourceIndex}>
                    {source.title} · {source.score}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bubble assistant">
            <div className="bubble-text typing">
              Yerel model düşünüyor…
            </div>
          </div>
        )}
      </main>

      <form className="composer" onSubmit={handleAsk}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bir şey sor..."
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
        >
          Gönder
        </button>
      </form>
    </div>
  );
}