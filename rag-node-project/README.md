# Yerel RAG Asistanı — Node.js/Express + TF-IDF + React

Bu proje, Microsoft'un resmi örneği (`leestott/local-rag`) temel alınarak
uyarlanmıştır. Orijinal projeden farklı olarak arayüz React ile ayrı bir
uygulama olarak çalışır (orijinalde tek bir statik HTML dosyası vardı).

Mimari:
```
React (frontend, Vite)  --fetch-->  Express (backend, :3000)
                                          │
                                          ├── SQLite (TF-IDF vektörleri)
                                          └── Foundry Local SDK (Phi-3.5 Mini)
```

Benzerlik araması **embedding modeli değil, TF-IDF (terim sıklığı) tabanlı
kosinüs benzerliği** kullanır — bu yüzden ek bir embedding modeli indirmeye
gerek yok, sadece chat modeli (Phi-3.5 Mini, ~2 GB) indirilir.

## 1) Foundry Local kurulu olmalı

**macOS:**
```bash
brew tap microsoft/foundrylocal
brew install foundrylocal
```

**Windows** (PowerShell):
```powershell
winget install Microsoft.FoundryLocal
```

Kurulumdan sonra yeni bir terminal açıp `foundry --version` ile doğrulayabilirsin.

## 2) Backend kurulumu

> **Not (Windows):** Bu proje `better-sqlite3` gibi platforma özgü derlenmiş
> native modüller kullanır. `node_modules` klasörünü başka bir işletim
> sisteminden **kopyalama** — her makinede `npm install` yeniden çalıştırılmalı,
> aksi halde `better-sqlite3` gibi paketler yüklenemez/çalışmaz.

```bash
cd backend
npm install
```npm

## 3) Dokümanları işle (chunk'la + TF-IDF vektörlerini SQLite'a yaz)

`docs/` klasöründe 2 örnek `.md` dosyası var (front-matter'lı: `id`, `title`,
`category`). Kendi dosyalarını da aynı formatta ekleyip tekrar çalıştırabilirsin:

```bash
npm run ingest
```

## 4) Backend'i başlat

```bash
npm start
```

İlk çalıştırmada Phi-3.5 Mini modeli otomatik indirilecek (~2 GB, biraz zaman
alabilir). Terminalde ilerleme yüzdesini göreceksin. Model yüklenince API
`http://127.0.0.1:3000/api` üzerinden hazır olur.

## 5) Frontend kurulumu ve çalıştırma

Yeni bir terminal sekmesi aç:

```bash
cd frontend
npm install
npm run dev
```

Terminalde verilen adresi (`http://localhost:5173`) tarayıcıda aç. Sağ üstteki
nokta modelin durumunu gösterir: turuncu = yükleniyor, yeşil = hazır.

## Kullanım

Sorunu yaz, gönder. Cevap yalnızca `docs/` klasöründeki metinlerden üretilir.
Cevabın altında hangi doküman(lar)dan ve ne skorla bilgi alındığı etiketlerle
gösterilir.

## Kendi dokümanlarını eklemek

`docs/` klasörüne front-matter'lı bir `.md` dosyası ekle:

```markdown
---
id: benzersiz-id
title: Görünen Başlık
category: Kategori
---

Doküman içeriği buraya...
```

Sonra `npm run ingest` çalıştır ve backend'i yeniden başlat.

## Orijinal projeyle farkları

- Sistem promptu (`src/prompts.js`) gaz sahası senaryosundan genel amaçlı
  bir bilgi asistanına çevrildi.
- Statik HTML arayüz yerine ayrı bir React (Vite) uygulaması kullanılıyor;
  backend'de `/api/*` uçlarına CORS izni eklendi (`localhost:5173`).
- Örnek dokümanlar (`docs/`) Foundry Local ve RAG kavramları hakkında.
