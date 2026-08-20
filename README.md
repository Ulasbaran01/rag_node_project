🤖 Yerel RAG Asistanı (Node.js/Express + TF-IDF + React + Qwen 2.5 7B) Bu proje, yerel makinenizde çalışan bir Büyük Dil Modeli (LLM) ve vektör benzerlik araması (RAG) altyapısı kullanarak dokümanlarınızla etkileşim kurmanızı sağlayan tam yığın (full-stack) bir yapay zeka asistanıdır.

Kullanıcı arayüzü React (Vite) ile geliştirilmiş olup, arka planda Express.js ve yerel model çalıştırıcı altyapısı bulunur.

🏛️ Proje Mimarisi React (Frontend, Vite) ──fetch──> Express (Backend, Port: 3000) │ ├── SQLite (TF-IDF Vektör Veritabanı) └── Local LLM (Qwen 2.5 7B) 💡 Vektör Arama & Embedding Yaklaşımı Arama işlemi için harici bir embedding modeli yüklenmez. Benzerlik aramaları, metinler üzerinden hesaplanan TF-IDF (terim sıklığı) tabanlı kosinüs benzerliği algoritması ile gerçekleştirilir. Bu sayede yalnızca tek bir dili/modeli (Qwen 2.5 7B) indirilip çalıştırılarak sistem hızlı ve hafif bir şekilde yönetilebilir.

🛠️ Kullanılan Yapay Zeka Modeli Ana Model: Qwen 2.5 7B (Instruct)

Geliştirici: Alibaba Cloud

Model Boyutu: ~4.5 - 5 GB (4-bit/8-bit Quantized)

Özellikler: Türkçe dahil birçok dilde üstün performans, 128k bağlam (context) penceresi desteği, güçlü akıl yürütme ve RAG uyumluluğu.

Gizlilik: Veriler dışarı çıkmaz, %100 yerel (local) çalışır.

🚀 Kurulum ve Çalıştırma

Gereksinimler & Model Kurulumu Projenin Qwen 2.5 7B modelini çalıştırabilmesi için yerel bir model sunucusuna (Ollama, LM Studio veya Foundry Local) ihtiyacı vardır.
Örnek olarak Ollama ile Qwen 2.5 7B çalıştırmak için:

Ollama'yı indirin ve kurun.

Terminalden modeli indirin ve başlatın:

Bash ollama run qwen2.5:7b 2. Arka Yüz (Backend) Kurulumu ⚠️ Önemli: Windows, macOS veya Linux ortamları arasında node_modules klasörünü doğrudan kopyalamayın. better-sqlite3 gibi C++ bağımlılıklarının doğru derlenmesi için her makinede npm install komutunu çalıştırın.

Bash cd backend npm install config.js Güncellemesi backend/src/config.js dosyanızda kullanılan model adının Qwen 2.5 7B olarak ayarlandığından emin olun:

JavaScript module.exports = { modelName: "qwen2.5:7b", // veya entegrasyonunuza göre qwen2.5-7b // ...diğer konfigürasyonlar }; 3. Dokümanları İşleme ve Indeksleme (Ingestion) backend/docs/ klasöründeki .md veya metin dosyalarınızı SQLite veritabanına indekslemek için:

Bash npm run ingest 4. Backend Sunucusunu Başlatma Bash npm start API servisi varsayılan olarak http://127.0.0.1:3000 portunda yayına başlayacaktır.

Ön Yüz (Frontend) Kurulumu ve Çalıştırma Yeni bir terminal sekmesi açarak frontend klasörüne gidin:
Bash cd frontend npm install npm run dev Tarayıcınızda http://localhost:5173 adresini açarak asistanı kullanmaya başlayabilirsiniz.

📝 Doküman Yönetimi docs/ dizinine front-matter yapısına uygun yeni .md belgeleri ekleyebilirsiniz:

Markdown
id: benzersiz-dokuman-id title: Doküman Başlığı category: Kategori
Buraya dokümanınızın içeriğini yazabilirsiniz... Yeni doküman ekledikten sonra şu iki adımı tekrarlayın:

npm run ingest

Backend servisini yeniden başlatın (npm start).
