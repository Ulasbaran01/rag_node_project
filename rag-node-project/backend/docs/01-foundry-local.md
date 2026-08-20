---
id: foundry-local
title: Foundry Local Nedir
category: Platform
---

Foundry Local, yapay zeka modellerini tamamen cihaz üzerinde, internet bağlantısı olmadan çalıştırmayı sağlayan Microsoft'un yerel çalışma zamanıdır (runtime).

Foundry Local SDK; Python, C#, JavaScript ve Rust dillerini destekler. Geliştiriciler bu SDK üzerinden modelleri indirip yükleyebilir ve OpenAI uyumlu bir istemci ile sohbet tamamlama (chat completion) veya embedding üretimi yapabilir.

Foundry Local, model çıkarımını verimli hale getirmek için ONNX Runtime kullanır ve CPU, GPU ve NPU hızlandırmasını otomatik olarak tercih eder. Model kataloğu, farklı donanımlara göre önceden optimize edilmiş modeller sunar.

Foundry Local kurulumu macOS üzerinde Homebrew ile yapılır: "brew tap microsoft/foundrylocal" ve ardından "brew install foundrylocal" komutları çalıştırılır. Windows üzerinde ise PowerShell'de "winget install Microsoft.FoundryLocal" komutuyla kurulur.
