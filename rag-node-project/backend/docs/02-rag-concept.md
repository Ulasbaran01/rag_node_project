---
id: rag-concept
title: RAG Nedir
category: Kavramlar
---

Retrieval-Augmented Generation (RAG), bir dil modelinin cevaplarını kendi verilerinize dayandırmak için kullanılan bir tasarım desenidir.

RAG üç adımdan oluşur: Retrieve (ilgili bilgiyi bir doküman kümesinden bulma), Augment (bulunan bilgiyi modelin girdisine ekleme) ve Generate (modelin bu bağlamı kullanarak cevap üretmesi).

RAG'ın temel faydası, modelin halüsinasyon yapma olasılığını azaltması ve cevapların gerçek kaynaklara dayandırılmasıdır. Bu sayede model, eğitim verisinde olmayan veya güncel olmayan konularda bile doğru cevaplar verebilir.

Bu projede benzerlik araması için embedding modelleri yerine TF-IDF (terim sıklığı) tabanlı kosinüs benzerliği kullanılır. Bu yaklaşım tamamen çevrimdışıdır, ek bir embedding modeli indirmeyi gerektirmez ve küçük doküman kümeleri için yeterince iyi sonuç verir.
