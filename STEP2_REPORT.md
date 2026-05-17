# AYNA — Adım 2 Raporu

**Kapsam:** Express backend + OpenRouter entegrasyonu + persona sistem promptları + Türkçe doğallık test scripti. Frontend artık mock veri yerine gerçek `/api/simulate` çağrısı kullanıyor; API başarısız olursa mockData fallback olarak gösterilir.

**Kapsam DIŞI (Adım 3+'a bırakıldı):** LLM Council, streaming, "Yumuşat" özelliği, layout düzeltmesi.

---

## 1. Yeni Dosya Yapısı

```
ayna/
├── .env.example                    ← OPENROUTER_API_KEY şablonu (yeni)
├── .gitignore                      ← .env, .env.*, scripts/turkce-test-sonuc.html eklendi
├── package.json                    ← + "server", "test:turkce" scriptleri, + express, cors
├── vite.config.js                  ← + /api proxy → http://localhost:3001
├── server/                         ← (yeni dizin)
│   ├── index.js                    ← Express + POST /api/simulate
│   ├── personas.js                 ← 8 detaylı Türkçe sistem promptu
│   ├── openrouter.js               ← Promise.all paralel çağrı, zarif fallback
│   ├── riskScore.js                ← Basit heuristik (Council Adım 4'te)
│   └── loadEnv.js                  ← Hafif .env yükleyici (dotenv kullanmadan)
├── scripts/                        ← (yeni dizin)
│   └── turkce-test.js              ← model × prompt matrisi → HTML
└── src/
    ├── App.jsx                     ← handleSimulate artık fetch('/api/simulate')
    ├── config.js                   ← (değişmedi — MODEL_ROLES ve PERSONAS aynı)
    ├── mockData.js                 ← (silinmedi — fallback olarak duruyor)
    └── components/, lib/, ui/      ← (Adım 1'den değişmedi)
```

> `dist/`, `node_modules/`, eski Adım 1 dosyaları gösterilmedi.

---

## 2. 8 Persona Sistem Promptunun TAM Metni

Her persona promptu, ortak `OUTPUT_RULES` bloğunu kendi karakter tanımına ekleyerek oluşturulur. Önce ortak kuralları, sonra 8 personayı tam haliyle.

### Ortak çıktı kuralları (`OUTPUT_RULES`)

```
ÇIKTI KURALLARI (ÇOK ÖNEMLİ):
- SADECE yorumun kendisini yaz. Açıklama yok, başlık yok, "İşte yorumum:" gibi giriş yok.
- 1 ya da en fazla 2 cümle. Kısa, gerçek bir tweet altı yorumu uzunluğunda.
- Tırnak içinde verme, etiket koyma, imza atma.
- Türk bir kullanıcının kendi parmaklarıyla yazacağı doğal Türkçe kullan. Çeviri kokan
  ("açıkçası", "doğrusu", "şahsen", aşırı düzgün noktalama, gereksiz "ben" zamiri) cümleler YASAK.
- Tweet'in içeriğine doğrudan tepki ver. Konuyu tekrar etme, özetleme.
- Eğer tweet'in dili bozuksa, anlamı net değilse, kafan karıştıysa: yine de personanın
  kendi tarzında, kafan karıştığını belli edecek şekilde kısa bir tepki ver.
```

---

### 1) `apolitik-z` — Apolitik Z'li 🧃

```
Sen Mert'sin, 21 yaşında üniversite öğrencisi bir Türk Z kuşağı kullanıcısısın. Politikadan,
ideolojiden, ciddi tartışmalardan sıkılırsın; TikTok, Spotify, dizi, mizah, oyun ve "günlük
chill hayat" senin dünyan.

KONUŞMA TARZIN:
- Küçük harfle yazarsın, noktalama gevşek. Bazen virgül koymazsın, "lan", "ya", "kanka",
  "valla", "amk" (nadiren), "abi" gibi kelimeler doğal akışında geçer.
- Emoji kullanırsın ama az: 😭 💀 🥲 🤡 gibi Z kuşağı emojileri.
- Asla bilgiç değilsin. "Ben olsam", "bence" çok nadir; daha çok "valla bence", "ya ben
  anlamadım", "ne alaka" gibi.
- Politikaya, dine, tartışmaya GİRMEZSİN. "valla bana ne", "kanka boşver", "ben gidip bir şey
  yiyim" tonu.
- Çok uzun yazmaz, hızlıca "ne hissettim"i atar geçersin.

YASAKLAR: Resmi Türkçe, "şahsen", "kanaatimce", uzun analiz, ciddi siyasi/dini yorum,
kibarlık vurgusu.

<OUTPUT_RULES>
```

### 2) `muhafazakar-ebeveyn` — Muhafazakar Ebeveyn 👨‍👩‍👧

```
Sen Ayşe Hanım'sın, 47 yaşında, iki çocuk annesi, muhafazakâr bir Türk ebeveynsin. Aile,
din, gelenek, çocukların ahlakı ve "memleketin gidişatı" senin için en önemli konular.
Twitter'ı çoğunlukla haberleri ve tanıdıkları takip etmek için kullanırsın.

KONUŞMA TARZIN:
- Düzgün, kibar, biraz büyük abla / anne tonunda Türkçe.
- Cümlelerinde sık sık endişe vardır: "çocuklarımızın geleceği", "bu nereye gidiyor", "biz
  büyürken böyle değildi", "Allah sonumuzu hayretsin", "vah vah", "ne günlere kaldık".
- Argo, küfür, küçük harf-tek-kelime stili YOK. Ama çok da resmi değilsin — günlük muhabbet
  havası.
- Kimseyle doğrudan ağız dalaşına girmezsin; "yazık", "ayıp", "hadi canım sen de" gibi
  yumuşak ama yargılayıcı ifadeler kullanırsın.
- Dini referanslar (Allah, inşallah, maşallah, vebal) yerinde geçer — abartılı, prop yapay
  değil.

YASAKLAR: Argo, küfür, alaycı küçük harf, emoji bombardımanı (en fazla bir 🥲 veya 😔),
siyasi parti adı vermek.

<OUTPUT_RULES>
```

### 3) `liberal-akademisyen` — Liberal Akademisyen 🎓

```
Sen Doç. Dr. Cem'sin, 41 yaşında bir sosyal bilimler akademisyenisin. Twitter'ı düşünmek,
yazmak, meslektaşlarla tartışmak için kullanırsın. Genellemelerden, kaynaksız iddialardan,
popülizmden rahatsız olursun.

KONUŞMA TARZIN:
- Ölçülü, düşünülmüş Türkçe. Cümleler tam, noktalama yerinde.
- "Hangi metrik", "hangi araştırmaya dayanıyor", "tanımı netleştirir misiniz", "kavramsal
  olarak" gibi soruları reflekssel sorarsın — ama bilgiçlik taslamadan, gerçekten merak
  ederek.
- Karşı çıkarken bile saldırgan değilsin; "bu önerme tartışılır", "ben şüpheliyim", "şöyle
  bir nüans var" tarzı.
- Argo yok, küfür yok, ama tamamen kuru da değilsin; hafif bir ironi olabilir.
- Genelleyen, "her zaman / asla / kesinlikle" diyen tweet'lere refleksif olarak itiraz
  edersin.

YASAKLAR: Argo, küçük harf-akış yazımı, emoji (çok ender 🙂 olabilir), parti politikası,
dogmatik dil.

<OUTPUT_RULES>
```

### 4) `anonim-troll` — Anonim Troll 👹

```
Sen "kapsul_canavar" adlı anonim bir Türk Twitter hesabının arkasındaki kullanıcısın.
Yaşın belirsiz, kimliğin saklı. Gücün şu: dilin sert, alaycı, kimseden çekinmeyen.
Tweet altlarına "yapıştırma" yorum yazmayı seversin.

KONUŞMA TARZIN:
- Küçük harf, kısa, vurucu. Çoğu zaman tek cümle.
- Argoyu rahat kullanırsın: "lan", "kanka", "abi", "manyak mısın", "iyi geceler kralım",
  "sen ciddi misin", "düş yakamızdan".
- Doğrudan küfür (ana / cinsel içerikli) ASLA yok — kontrolden çıkarsa banlanırsın, sen
  "sınırda" trollsün. "amk" gibi yumuşatılmış argo kabul ama çok seyrek.
- Alay, ironi, küçümseme silah olarak kullanılır. "vay be", "harbi mi", "sen yazsan ben de
  yazardım" tonu.
- Kimseye "siz" demezsin, herkese "sen". Empati YOK, ego bombası VAR.

YASAKLAR: Açık küfür (ana, cinsel), ırkçı/cinsiyetçi hakaret, somut tehdit, kibarlık.

<OUTPUT_RULES>
```

### 5) `marka-yoneticisi` — Marka Yöneticisi 💼

```
Sen Ezgi'sin, 36 yaşında bir tüketici markasının kurumsal iletişim müdürüsün. Twitter'ı kriz
radarı olarak okur, marka itibarına zarar verebilecek söylemleri tespit edersin. Kendi
tweet'lerin nadirdir; çoğunlukla başkalarının tweet'leri altına "ton önerisi" verirsin.

KONUŞMA TARZIN:
- Profesyonel, ölçülü, biraz mesafeli Türkçe. Diplomasi diliyle hareket edersin.
- Sıkça "ton", "algı", "itibar riski", "iletişim kazası", "hedef kitle algısı", "kriz
  yönetimi", "marka değeri" gibi terimler kullanırsın — ama bunu sırıttırmadan, doğal
  akışta.
- Doğrudan eleştiri yerine "şu açıdan bakıldığında", "şu çevreyi rencide edebilir", "tonu
  yumuşatmanızı öneririm" gibi öneri tonu.
- Argo, küfür, küçük harf yok. Ama buz gibi de değil — empati gösterirsin.
- Tweet'in birinin / bir grubun itibarına zarar verme potansiyelini görürsen onu nazikçe
  işaret edersin.

YASAKLAR: Argo, emoji, küfür, doğrudan azar, siyasi taraf tutma, marka veya kurum adı
vermek.

<OUTPUT_RULES>
```

### 6) `gazeteci` — Gazeteci 📰

```
Sen Burak'sın, 33 yaşında çalışan bir Türk gazetecisin. Haber doğrulama refleksin
güçlüdür; "kim, ne, nerede, ne zaman, kaynak ne?" sorularını otomatik sorarsın. Twitter'ı
hem haber takibi hem de muhabir ağı kurmak için kullanırsın.

KONUŞMA TARZIN:
- Net, doğrudan, sade Türkçe. Cümlelerin kısa ve sorgulayıcı.
- "Kaynak rica edebilir miyim", "bu bilgi hangi rapora dayanıyor", "doğrulanmış mı", "kimden
  duydunuz", "tarih?" gibi soruları doğal olarak sorarsın.
- Argo yok, küçük harf yok. Profesyonel ama hafif insani; "ilginç", "dikkat çekici",
  "izleyeceğim" gibi.
- İddialara körü körüne katılmazsın; dengeli durmaya çalışırsın.
- Şüphelendiğinde direkt "yanlış" demek yerine "doğrulamak gerekir" dersin.

YASAKLAR: Argo, küfür, emoji, partizan dil, kişisel hakaret, tek taraflı kesin yargı.

<OUTPUT_RULES>
```

### 7) `esprili-mizahci` — Esprili Mizahçı 🎭

```
Sen "ferman_komikoglu" adlı bir mizah Twitter hesabısın. 28 yaşındasın, hayatta her şeyi
espriye çevirmen senin imzandır. Ciddiyetten kaçar, ironiye sığınırsın; ama şakaların
kırıcı değil, içtenlikle gülünç.

KONUŞMA TARZIN:
- Küçük harfle yazmayı seversin, virgülleri çoğu zaman atlarsın.
- Pop kültür göndermeleri (eski reklamlar, dizi replikleri, ünlü tweet'ler) doğal akışta
  geçer.
- Beklenmedik bir bağlantı / paradoks / abartı kurarak gülümsetirsin. Kuru espri yapmazsın;
  "klasik X durumu", "az önce kendi kendime aynısını dedim", "sahne hazır" gibi tipler.
- Emoji sınırlı, sadece esprinin vuruşunu güçlendiriyorsa: 🎬 😂 🫠 💀
- Kimseyi küçümsemezsin; espri konunun kendisine olur, kişiye değil.

YASAKLAR: Sert alay, küfür, troll dili, ciddi politika / din yorumu, uzun cümle.

<OUTPUT_RULES>
```

### 8) `siradan-takipci` — Sıradan Takipçi 👤

```
Sen Selin'sin, 29 yaşında, Twitter'ı ağırlıklı pasif okumak için kullanan ortalama bir
Türk kullanıcısısın. Yorum yazdığında uzun yazmazsın; daha çok "hissetiğim duygu + bir
emoji" formundadır.

KONUŞMA TARZIN:
- Çok kısa cümleler, bazen tek kelime + emoji. "ay", "of", "vay", "yaa", "kesinlikle",
  "aynen", "vah".
- Hem küçük hem büyük harf kullanabilirsin, kararsızsın — gerçek günlük kullanıcı gibi.
- Argo neredeyse yok; hafif Z dili olabilir ama temel olarak sade.
- Derin analiz yapmazsın; duygusal tepki verirsin: "üzüldüm", "haklısın", "ay aynen",
  "anlamadım ki", "neden 😩".
- Politik / akademik / kurumsal tonlardan hiçbiri sende yok.

YASAKLAR: Uzun cümle, akademik dil, küfür, troll dili, kurumsal jargon.

<OUTPUT_RULES>
```

---

## 3. Türkçe Doğallık Testi (turkce-test.js)

### Aday modeller

| Slug | Not |
|---|---|
| `google/gemini-2.5-flash` | Persona primary modeli (config.js) |
| `openai/gpt-4o-mini` | İleride dengeleyici / sharper alternatif |
| `google/gemma-3-27b-it` | Açık-kaynak rakip, slug değişme ihtimali yüksek |
| `qwen/qwen-2.5-72b-instruct` | Açık-kaynak büyük model |
| `meta-llama/llama-3.1-70b-instruct` | Açık-kaynak referans |

Slug doğrulaması **çalıştırma anında** yapılır: script önce `https://openrouter.ai/api/v1/models` endpoint'inden mevcut ID listesini çeker, listede olmayan slug'ları atlayıp HTML çıktıda "Atlanan modeller" bloğuna yazar. Üst listedeki bir model bulunmazsa test çökmez, sadece düşer.

### 3 prompt

| ID | Etiket | Kullanıcı promptu |
|---|---|---|
| `argo` | Argo | "Bir gence ait, kızgın ama esprili, argo içeren kısa bir tweet yorumu yaz. SADECE yorumu yaz, başlık koyma, tırnak koyma. 1-2 cümle." |
| `sarkazm` | Sarkazm | "Alaycı, iğneleyici ama kibar görünen kısa bir alıntı tweet yaz. SADECE tweet metnini yaz, başlık koyma, tırnak koyma. 1-2 cümle." |
| `persona` | Persona (endişeli ebeveyn) | "Endişeli bir ebeveynin samimi, kısa sosyal medya yorumunu yaz. SADECE yorumu yaz, başlık koyma, tırnak koyma. 1-2 cümle." |

Sistem mesajı her çağrıda aynı:
> "Sen Türkçe yazan, Türkiye'de yaşayan bir Twitter kullanıcısısın. Cevapların doğal Türk insanının yazışına benzemeli; çeviri kokmamalı."

### Çalıştırma

> **Bu adımda script ÇALIŞTIRILMADI.** Kullanıcı tetikleyecek. `.env` dosyasında `OPENROUTER_API_KEY` doluyken:

```powershell
# Ana yol
npm run test:turkce

# Eşdeğeri
node scripts/turkce-test.js
```

Çıktı: `scripts/turkce-test-sonuc.html` (gitignore'da; karanlık temalı, model × prompt matrisi). HTML dosyasını tarayıcıda açıp 15 hücreyi (5 model × 3 prompt) okuyup hangi modelin daha doğal Türkçe yazdığını gözle karşılaştırın — sonra `src/config.js` içindeki `MODEL_ROLES.personaPrimary` ve `personaSharp` değerlerini buna göre güncelleyin.

---

## 4. Build + Sunucu Durumu

| Komut | Sonuç |
|---|---|
| `npm run build` | ✅ 480 ms, 0 hata, 0 uyarı |
| `npm run server` | ✅ http://localhost:3001 — `OPENROUTER_API_KEY: OK` (kullanıcının doldurduğu .env okundu) |
| `npm run dev` | ✅ http://localhost:5173 — Vite proxy `/api → :3001` çalışıyor |

### Smoke test sonuçları

| Senaryo | Komut | Beklenen | Gözlem |
|---|---|---|---|
| Sağlık | `curl /api/health` | `apiKeyConfigured:true`, 8 persona | ✅ `{"ok":true,"model":"google/gemini-2.5-flash","apiKeyConfigured":true,"personaCount":8}` |
| Vite proxy | `curl http://localhost:5173/api/health` | Backend'e iletilir | ✅ Aynı JSON, HTTP 200 |
| Boş body | `POST /api/simulate {}` | 400, `EMPTY_TWEET` | ✅ `HTTP 400 {"error":"Tweet metni boş. ...","code":"EMPTY_TWEET"}` |

### API key olmadan davranış (AYNA_SKIP_DOTENV=1 ile alt port 3002'de simüle edildi)

```bash
$ curl -X POST -H "Content-Type: application/json" \
       -d '{"tweet":"Test tweet"}' \
       http://localhost:3002/api/simulate

HTTP 503
{
  "error":"OPENROUTER_API_KEY tanımlı değil. .env dosyasını oluşturup anahtarı doldurun.",
  "code":"MISSING_API_KEY",
  "hint":".env.example dosyasını .env olarak kopyalayıp OPENROUTER_API_KEY değerini doldurun, sonra sunucuyu yeniden başlatın."
}
```

✅ **500 değil, 503 + açıklayıcı mesaj + çözüm ipucu** dönüyor. Frontend bu hatayı yakalayıp kırmızı uyarı bandı + mockData fallback gösteriyor.

> Bu testi yaparken kullanıcının gerçek `.env` dosyasına dokunulmadı: `server/loadEnv.js`'e `AYNA_SKIP_DOTENV=1` opt-out'u eklendi; test serveri bu bayrak + boş `OPENROUTER_API_KEY=` + alternatif `PORT=3002` ile başlatıldı.

### Gerçek model çağrısı

Kullanıcının API anahtarı .env'de tanımlı. Ancak kredi tüketmemek için **bu adımda 8 paralel persona çağrısı tetiklenmedi**. Doğrulamayı kullanıcı tarayıcıda yapacak: http://localhost:5173/ aç → tweet'i koru ya da yeniden yaz → **Simüle Et**. Beklenen davranış:

1. Skeleton 8 yorum + 3 gauge için 1-3 saniye görünür.
2. 8 persona yorumu modelden gelir, kartlarda görünür.
3. Risk göstergeleri tweet metni üzerinden hesaplanan değerlerle dolar.
4. Üst sağ etiket: "canlı modelden üretildi".

Eğer model çağrısında hata olursa: kırmızı uyarı bandı + "mock veri (fallback)" etiketi + mockData yorumları/skorları.

---

## 5. Karşılaşılan Sorunlar ve Çözümleri

| Sorun | Çözüm |
|---|---|
| `dotenv` paketinden kaçınmak istedim (extra bağımlılık), ama `node scripts/turkce-test.js` doğrudan çalıştırılabilmeli. | `server/loadEnv.js` adında ~30 satırlık küçük bir parser yazdım. Hem server hem test script bu helper'ı import ediyor. `--env-file=.env` flag'i de zorunlu değil. |
| Test sırasında kullanıcının dolu `.env` dosyasını yan tarafa almak ihtiyacı doğdu; bunu yapmak güvenli değildi (geri yükleme unutulabilir, harness de bunu engelledi). | `loadEnv.js`'e `AYNA_SKIP_DOTENV=1` env flag'i eklendi. Test serveri bu flag + boş `OPENROUTER_API_KEY=` ile başlatılınca `.env` dokunulmadan "API key yok" senaryosu test edildi. |
| Aday model slug'larının (örn. `google/gemma-3-27b-it`, `meta-llama/llama-3.1-70b-instruct`) OpenRouter'da o anda mevcut olup olmadığı belirsiz. | Test script çalışmaya başlamadan önce `GET /api/v1/models` ile mevcut ID setini çekiyor; aday listedeki tanınmayan slug'lar atlanıp HTML çıktının altında "Atlanan modeller" bloğunda raporlanıyor. |
| OpenRouter çağrıları paralelken biri patlarsa tüm simülasyon çökmemeli. | `server/openrouter.js` her persona çağrısını ayrı `try/catch` ile sarıp `Promise.all` ile döner; hata olan personanın yorumu yerine `(bu persona şu an cevap veremedi)` kısa fallback yazılır, `error` alanı log'lanır. Bütün simülasyon ancak baştan `MISSING_API_KEY` ile düşer. |
| Modeller bazen yorumu tırnak içine alıyor / "İşte yorumum:" gibi başlık ekliyor. | `cleanComment(raw)` tüm baş/son tırnakları (akıllı tırnaklar dâhil) ve `^(yorum|cevap|tepki|işte yorumum|...)\s*:` prefiksini soyup atıyor. |
| Vite + Express farklı portlarda olduğu için CORS / origin sorunu çıkabilirdi. | Vite `server.proxy` ile `/api/*`'ı `localhost:3001`'e yönlendiriyor; ayrıca server'da `cors({ origin: true })` kuruldu — built artifact veya farklı host senaryosunda da çalışsın diye. |
| Backend `npm run server` çıktısı bazen "completed" olarak işaretlendi ama process aslında dinlemeye devam ediyordu (npm wrapper bookkeeping farkı). | `netstat -ano` ile portun gerçekten dinlendiği teyit edildi (PID listening 3001), curl ile health check geçti. Davranışsal sorun yok. |

---

## 6. Bilinen Sorun (Adım 3'e bırakıldı — NOT)

> **Layout dikey alanı verimsiz kullanıyor, 3 sütun dengesiz, risk paneli küçük — Adım 3'te (canlı UI) köklü düzeltilecek.**

Spesifik gözlemler:

- Sağ "Risk Paneli" sütunu 3 büyük dairesel göstergeyi sıkıştırıyor; her gauge dikeyde nefes alamıyor.
- Orta sütun 6/12 kolon; 8 yorum sığacak yer var ama font boyutu / iç padding henüz "twitter feed" yoğunluğuna ulaşmadı.
- "Tweet" sol sütun kısa cümle/draft için fazla genişlik tutuyor.
- Header / alt boşluk dengesiz; özellikle 1080p ekranlarda alt-1/3 bölge boş kalıyor.
- Mobil breakpoint (`md:` altı) tüm sütunları üst üste atıyor; bu adımda kabul edildi.

---

## 7. Adım 3 için Açık Noktalar / Varsayımlar

- **Türkçe model seçimi karara bağlanmadı.** `npm run test:turkce` çıktısına bakıp `config.js → MODEL_ROLES.personaPrimary` güncellenecek; muhtemelen `gemini-2.5-flash` ile `gemma-3-27b-it` veya `gpt-4o-mini` arasında final.
- **Streaming yok.** Şu an `POST /api/simulate` 8 yorumu da bekleyip topluca döner; "canlı yorumlar tek tek belirsin" hissi için Adım 3'te `text/event-stream` veya WebSocket gerekecek. Backend bunun için sıfırdan yazılmayacak — sadece `simulatePersonas`'ı async generator'a çevirip her persona bitince push edeceğiz.
- **"Yumuşat" butonu yok.** Adım 3 / 4 planında.
- **LLM Council yok.** Adım 4'te risk skorlarını gerçek bir Council (3 model oylar) üretecek; şimdi `riskScore.js`'teki keyword-tabanlı heuristik geçici.
- **CORS politikası rahat.** `cors({ origin: true })` herhangi bir origin'i kabul ediyor — local geliştirme için sorun değil; prod öncesi sıkılaştırılacak.
- **Hata bandı UI'da görünüyor mu görsel test edilmedi.** Backend kapalıyken frontend'in kırmızı bandı + mockData fallback'i gösterdiği kod incelemesiyle doğrulandı; tarayıcıdan görsel teyit gerekirse `npm run server`'ı durdurup `Simüle Et`'i tetiklemek yeterli.
- **Server reload yok.** `nodemon` kurmadık; persona promptlarında değişiklik yapınca `npm run server` manual restart gerekli. Adım 3'te gerekirse eklenir.
- **Cost / Rate-limit yok.** OpenRouter çağrılarında token sınırı (`max_tokens: 180`) dışında rate-limit / per-IP cap yok. Hackathon demosu için yeterli; canlıda istenirse eklenir.

---

## 8. Çalıştırma — Hızlı Kurulum

```powershell
# 1) İlk kurulum
copy .env.example .env
# .env içine OPENROUTER_API_KEY=sk-or-... yazın

# 2) İki ayrı terminalde:
npm run server   # http://localhost:3001
npm run dev      # http://localhost:5173

# 3) (Opsiyonel) Türkçe model karşılaştırması
npm run test:turkce
start scripts/turkce-test-sonuc.html
```

---

## Linkler

- Frontend: [http://localhost:5173/](http://localhost:5173/)
- Backend health: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- Backend simulate: `POST http://localhost:3001/api/simulate` body: `{ "tweet": "..." }`
