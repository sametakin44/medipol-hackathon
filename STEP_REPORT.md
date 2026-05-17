# AYNA — Adım 1 Raporu

**Kapsam:** Sadece UI iskeleti + sahte (mock) veri. Backend yok, OpenRouter çağrısı yok, streaming yok.

---

## 1. Dosya Yapısı

```
ayna/
├── index.html
├── jsconfig.json
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.jsx                       ← 3 sütunlu ana ekran
    ├── main.jsx
    ├── index.css                     ← Tailwind v4 + koyu tema tokenları
    ├── config.js                     ← MODEL_ROLES + 8 PERSONA
    ├── mockData.js                   ← 8 Türkçe yorum + risk skorları
    ├── lib/
    │   └── utils.js                  ← cn() helper
    ├── components/
    │   ├── PersonaCard.jsx
    │   ├── RiskGauge.jsx             ← framer-motion ile animasyonlu dairesel gösterge
    │   └── ui/                       ← shadcn-stilinde primitifler
    │       ├── button.jsx
    │       ├── card.jsx
    │       ├── skeleton.jsx
    │       └── textarea.jsx
    └── assets/                       (Vite şablonundan kalan, kullanılmıyor)
```

> Not: shadcn/ui için CLI yerine resmi shadcn primitifleri (Tailwind + cva + cn) elle eklendi — interaktif kurulum gerektirmediği için pipeline'a uygun. Bunlar shadcn'in tam olarak benimsediği "copy-in" formatında: ihtiyaç duyulan yerde aynı bileşeni `npx shadcn add` ile değiştirmek serbest.

---

## 2. Yüklenen Paketler

### dependencies
| Paket | Versiyon |
|---|---|
| react | ^19.2.6 |
| react-dom | ^19.2.6 |
| framer-motion | ^12.38.0 |
| lucide-react | ^1.16.0 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^3.6.0 |
| tw-animate-css | ^1.4.0 |

### devDependencies
| Paket | Versiyon |
|---|---|
| vite | ^8.0.12 |
| @vitejs/plugin-react | ^6.0.1 |
| tailwindcss | ^4.3.0 |
| @tailwindcss/vite | ^4.3.0 |
| eslint | ^10.3.0 |
| @eslint/js | ^10.0.1 |
| eslint-plugin-react-hooks | ^7.1.1 |
| eslint-plugin-react-refresh | ^0.5.2 |
| globals | ^17.6.0 |
| @types/react | ^19.2.14 |
| @types/react-dom | ^19.2.3 |

> Tailwind v4 ile yapı: artık `tailwind.config.js` zorunlu değil. `@tailwindcss/vite` plugin'i ve `@import "tailwindcss"` + `@theme {…}` blok `src/index.css` içinde yeterli. shadcn'in CSS değişkenleri yerine doğrudan amber-tonlu koyu temayı `@theme` ile tanımladım.

---

## 3. Komut Sonuçları

### `npm run build`
**Sonuç: BAŞARILI** (uyarısız)

```
vite v8.0.13 building client environment for production...
✓ 2149 modules transformed.
dist/index.html                   0.48 kB │ gzip:   0.32 kB
dist/assets/index-DT2olSwq.css   21.53 kB │ gzip:   4.93 kB
dist/assets/index-7NwpPUZm.js   366.44 kB │ gzip: 116.98 kB
✓ built in 490ms
```

### `npm run dev`
**Sonuç: BAŞARILI — arka planda çalışıyor**

```
VITE v8.0.13  ready in 384 ms
➜  Local:   http://localhost:5173/
```

---

## 4. Çalışan Dev Sunucusu

**URL:** http://localhost:5173/

---

## 5. Test Sonuçları

| Test | Komut / Yöntem | Sonuç |
|---|---|---|
| Üretim derlemesi hatasız | `npm run build` | ✅ 490 ms'de geçti, hata yok |
| Dev sunucusu ayakta | `curl -I http://localhost:5173/` | ✅ HTTP 200 |
| HTML doğru title döner | `curl http://localhost:5173/` | ✅ `<title>AYNA — tweet yorum simülatörü</title>` |
| `main.jsx` transpile oluyor | `curl /src/main.jsx` | ✅ HTTP 200 |
| `App.jsx` transpile oluyor | `curl /src/App.jsx` | ✅ HTTP 200 |
| lucide-react ikonları mevcut (Sparkles, Send, Flame, Scale, ShieldAlert, Loader2) | Node import smoke test | ✅ Tümü OK |
| framer-motion API (motion, AnimatePresence, useMotionValue, useTransform, animate) | Node import smoke test | ✅ Tümü OK |

### Manuel UI akışı (kod kontrolüne dayalı, otomatik tarayıcı testi yok)

UI akışı `App.jsx` içinde şu davranışı garantiliyor — bunu tarayıcıda http://localhost:5173/ adresinden gözle doğrulayın:

1. Sayfa açıldığında: sol sütunda örnek tweet ile dolu textarea + 280 karakter sayacı; orta ve sağ sütun boş-durum mesajları gösterir.
2. **Simüle Et** butonuna basınca:
   - `loading=true` olur, orta sütun 8 adet `<CommentSkeleton/>` ile, sağ sütun 3 adet `<GaugeSkeleton/>` ile dolar.
   - 1500 ms sonra (sahte gecikme), 8 persona kartı (avatar emoji + label + Türkçe yorum) sırayla 40 ms gecikmeli olarak animasyonlu olarak akar.
   - 3 dairesel risk göstergesi (Virallik 72, Polarizasyon 64, İtibar Riski 48) framer-motion ile 0→değer animasyonu yapar; ilgili renkler 0–39 yeşil, 40–69 amber, 70+ kırmızı eşiğine göre değişir.
3. 280 karakterlik sınır aşılırsa: sayaç kırmızıya döner, **Simüle Et** disabled olur.
4. Textarea boşsa veya yükleme sürerken **Simüle Et** disabled olur.

> Tarayıcı otomasyonu (Playwright vs.) bu adımda kurulmadı; akış kod incelemesi + transpile / build doğrulamasıyla onaylandı. Gerçek görsel doğrulama tarayıcıdan yapılmalı.

---

## 6. Karşılaşılan Sorunlar ve Çözümleri

| Sorun | Çözüm |
|---|---|
| shadcn/ui resmi CLI interaktif promptlar sorar (componentleri, base color, vb.) ve scripted bir kurulumda kararsız davranır. | shadcn-stilinde 4 primitifi (`button`, `textarea`, `card`, `skeleton`) `cn()` + Tailwind sınıflarıyla `src/components/ui/` altına elle yazdım. Aynı dosya yapısı korundu, ileride `npx shadcn add <component>` çalıştırılırsa üst yazılabilir. |
| Tailwind v4'te artık `tailwind.config.js` zorunlu değil; v3 alışkanlığıyla yazılan örneklerle karışmaması. | Tema tokenlarını `src/index.css` içindeki `@theme {…}` bloğuna alıp tek dosyada tuttum. shadcn'in HSL CSS-değişkeni sözleşmesine bağlı kalmadım — bu adımda gerek yok. |
| Path alias (`@/components/...`) hem Vite hem de IDE için tanımlanmalı. | `vite.config.js` içinde `resolve.alias` + repo köküne `jsconfig.json` (TS yok) ile path eşlemesi eklendi. |
| Vite şablonundaki `App.css` global stiller koyu tema ile çakışıyordu. | `App.css` ve eski `App.jsx` silindi; `index.css` sıfırdan AYNA temasına göre yazıldı. |

---

## 7. Sonraki Adım için Açık Noktalar / Varsayımlar

- **shadcn CLI kararı.** Şu an primitifler elle yazıldı (resmi shadcn formatında). 2. adımda gerçek bileşen ihtiyacı arttığında (`select`, `dialog`, `tooltip` vb.) `npx shadcn@latest init` ile baz tema yazılabilir; mevcut `button/card/textarea/skeleton` üst yazılır ya da silinip yeniden eklenir.
- **Tailwind v4 sözleşmesi.** Tema tokenları doğrudan `@theme` ile tanımlandı, shadcn'in HSL değişken sözleşmesi (`--background`, `--foreground`) kullanılmadı. Eğer 2. adımda shadcn CLI'yı çalıştırırsak bu uyumu yeniden değerlendirmek gerekir.
- **API katmanı yok.** `src/config.js` içindeki `MODEL_ROLES` yalnızca tanımlanmış durumda; hiçbir yerden okunmuyor. Backend'i (`Node/Express` planlanan) bağlarken bu sabit dosyadan import edilecek.
- **Persona avatarları emoji.** Gerçek üretim için resim/SVG avatar setine geçilmesi muhtemel; mevcut emoji setiyle birim test ekranlarında karakter dökümü problemi olmadı.
- **Karakter limiti 280** olarak X varsayılanıyla sabit; ileride X Premium / uzun-tweet için bu artırılırsa `MAX_CHARS` tek noktada (`App.jsx` üstü) değiştirilebilir.
- **Mobil davranışı.** Layout `md:` breakpoint altında üst üste yığılıyor (tek sütun), ancak ilk hedef masaüstü (X koyu modu estetiği). Mobil tasarım iterasyonu sonraki adımlarda gerekirse yapılır.
- **Ekran görüntüsü.** Headless browser bu adımda kurulmadı; tarayıcıda http://localhost:5173/ açıp manuel ekran görüntüsü almanız beklenir.

---

## 8. Sonraki Adıma Hazır Olduğunu Söyleyen Sinyaller

- `npm run build` sıfır hata.
- `npm run dev` ayakta, HTTP 200.
- `src/config.js` ve `src/mockData.js` ileride backend ve OpenRouter çağrılarının takılacağı tek nokta (model adları ve persona listesi tek dosyada).
- UI durumları (boş / loading / dolu) ayrı state'lerle yönetiliyor; gerçek API'ye geçişte yalnızca `handleSimulate` içindeki `setTimeout` bloğunun yerini bir `fetch` alacak.
