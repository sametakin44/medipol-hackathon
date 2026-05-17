# AYNA — Son Adım Raporu (demo cache + UI fit)

**Kapsam:** Sadece iki iş. Reply zinciri (Adım 6) **DOKUNULMADI**, ayrı görevde ele alınacak.

---

## 1. Demo Cache — `AYNA_DEMO_MODE`

Amaç: video çekiminde **sıfır canlı API riski**, her seferinde aynı deterministik sonuç.

### Dosyalar (yeni)
| Dosya | İş |
|---|---|
| `server/demoCache.js` | Otomatik üretilen ES modülü. `DEMO_TWEET`, `DEMO_SIMULATE_BEFORE` (meta + 8 persona + risk + done), `DEMO_SOFTEN_RESPONSE`, `DEMO_SIMULATE_AFTER` + `matchDemoSimulate(tweet)`, `matchDemoSoften(tweet)` helper'ları. |
| `scripts/generate-demo-cache.js` | Canlı API'yi bir kez vurur, sonucu `server/demoCache.js`'e ES modül olarak yazar. |
| `scripts/test-demo-mode.js` | E2E: simulate→soften→simulate, persona aralarındaki gecikmelerin doğru olduğunu ve `demo:true` bayrağının her event'te geldiğini doğrular. |

### `server/index.js` — DEMO MODE wiring

- Sunucu açılırken `process.env.AYNA_DEMO_MODE === "1"` okunur, `DEMO_MODE` sabiti olarak tutulur.
- `POST /api/simulate`: demo modda `matchDemoSimulate(tweet)` eşleşirse:
  - `meta` event hemen yazılır (`demo: true` bayrağıyla).
  - 8 persona event'i **300-700 ms rastgele aralıklarla** akıtılır (canlı SSE hissi).
  - `risk` + `done` event'leri sonunda gönderilir (`demo: true`).
  - Tweet eşleşmezse log basıp canlı API'ye düşer.
- `POST /api/soften`: demo modda `matchDemoSoften(tweet)` eşleşirse 1.2 sn'lik makul gecikmenin ardından sabit yumuşatılmış tweet döner. Eşleşmezse canlı API'ye düşer.
- Demo modda gelen tüm cevaplar payload'a `demo: true` koyar; UI tarafında istenirse bir rozet eklenebilir.

### Kullanım

```bash
# 1) Cache'i bir kez gerçek API ile üret (server canlı modda 3001'de olmalı):
node scripts/generate-demo-cache.js
#   isteğe bağlı farklı bir demo tweet için:
#   node scripts/generate-demo-cache.js --tweet="..."

# 2) Demo modunda server'ı başlat:
AYNA_DEMO_MODE=1 node server/index.js
# PowerShell:  $env:AYNA_DEMO_MODE="1"; node server/index.js

# 3) Normal canlı moda dönmek için env değişkenini kaldır:
node server/index.js
```

### DEMO_TWEET'i değiştirme

1. `--tweet="yeni tweet"` ile `generate-demo-cache.js` çalıştır → `server/demoCache.js` yeniden yazılır.
2. Demo modunda server'ı yeniden başlat. Frontend tarafında değişiklik gerekmez (DEMO_TWEET sunucudan okunur).

### Doğrulama (`node scripts/test-demo-mode.js`)

```
=== 1) DEMO simulate (BEFORE) ===
  meta.demo=true, personalar=8, toplam=4498ms
  risk: V=82 P=88 İ=87, demo=true
  persona aralarındaki gecikmeler (ms): 716, 557, 499, 408, 489, 708, 356, 559

=== 2) DEMO soften ===
  süre: 1220ms, demo=true
  yumusatilmis: "Sosyal medyanın gençler üzerinde olumsuz etkileri olabilir; belki 18 yaş altına sınırlamalar getiril…"

=== 3) DEMO simulate (AFTER) ===
  meta.demo=true, personalar=8, toplam=4433ms
  risk: V=45 P=58 İ=35

--- DELTA ---
virallik     : 82 → 45  (Δ -37)
polarizasyon : 88 → 58  (Δ -30)
itibarRiski  : 87 → 35  (Δ -52)

=== 4) Eşleşmeyen tweet (fallback to live) ===
  meta demo=false  ✓ live moda düşüldü

All OK ✓
```

- Persona gecikmeleri 300-700 ms aralığında ✓
- Tüm payload'larda `demo:true` bayrağı ✓
- Eşleşmeyen tweet canlı API'ye düştü ✓ (regresyon yok)

### Canlı mod regression

DEMO_MODE değişkeni olmadan `node server/index.js` başlatıldı, `/api/health` 200 döndü, `/api/simulate` meta event'i `demo` bayrağı olmadan yazdı. Adım 5'ten beri var olan tüm canlı kod yolları aynen çalışıyor.

---

## 2. UI Fit — 1080p scroll-free

Adım 5 raporunda not edilen sorun: sağ sütunun 1080p viewport'a tam sığmaması (gerekçe + delta + Yumuşat panel kırpılıyordu).

### Değişiklikler (`src/components/RiskGauge.jsx` + `src/App.jsx`)

| Değişen | Önce | Sonra |
|---|---|---|
| Gauge boyutu (SVG) | 168 px | **132 px** |
| Stroke kalınlığı | 14 | 12 |
| Merkez büyük rakam | `text-4xl` | `text-3xl` |
| Card padding | `p-4` | `p-3` |
| İç gap | `gap-3` | `gap-2` |
| Gerekçe metni | `text-[11px] leading-relaxed` | `text-[10.5px] leading-snug` + `line-clamp-3` |
| Sağ sütun gap | `gap-3` | `gap-2` |
| Yumuşat kutusu padding | `p-3` | `p-2.5` |

`line-clamp-3` ile gerekçe metni 3 satırla sınırlı; uzun cümlede taşma yok.

### 1080p doğrulama screenshot'u (DEMO MODE)

![AYNA — 1080p scroll-free, before/after](docs/screenshots/step-final-1080p.png)

> 1920×1080 viewport, deviceScaleFactor 1. `AYNA_DEMO_MODE=1 node server/index.js` + `node scripts/screenshot-1080p.js`.

Viewport'ta SCROLL **olmadan** görünenler (yukarıdan aşağı, sağ sütun):
1. Risk paneli başlığı + "önce → sonra" amber rozeti
2. **VİRALLİK**: 45 (amber) + gerekçe + delta `önce 82 → şimdi 45 (-37)`
3. **POLARİZASYON**: 58 (amber) + gerekçe + delta `önce 88 → şimdi 58 (-30)`
4. **İTİBAR RİSKİ**: 35 (yeşil) + gerekçe + delta `önce 87 → şimdi 35 (-52)`
5. **YUMUŞATILDI** amber kutusu + neDegisti açıklaması + **Geri al** butonu

Hepsi tek bakışta. Video bu çözünürlükte çekilebilir.

---

## 3. Build + Sunucu

```
$ npm run build
✓ 2149 modules transformed.
✓ built in 501ms
```

**Çalışan sunucular:**
- Backend (demo modda): [http://localhost:3001](http://localhost:3001) — `AYNA_DEMO_MODE=1 node server/index.js`
- Frontend: [http://localhost:5173](http://localhost:5173)

---

## 4. Bu Görevin DIŞINDA Bırakılanlar

- **Reply zinciri (Adım 6).** Personaların birbirine cevap vermesi. Bu görevde **hiç dokunulmadı** — ayrı görevde ele alınacak.
- UI'a "DEMO" rozeti eklemek mümkün (payload'larda `demo:true` var) ama explicit olarak istenmediği için eklenmedi.
