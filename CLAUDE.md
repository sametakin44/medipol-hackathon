# AYNA — Proje Bağlamı

## Ne yapıyoruz
AYNA: bir tweet'in yaratacağı yorum bölümünü PAYLAŞMADAN ÖNCE simüle eden araç.
8 yapay persona tweet'e Türkçe tepki yorumu yazar; bir risk skoru hesaplanır.
Hackathon projesi — jüri Türk, içinde CS akademisyenleri var.

## Teknoloji (değiştirme)
- Frontend: Vite + React + JavaScript (TypeScript YOK) + Tailwind v4 + shadcn-stili primitifler + framer-motion + lucide-react
- Backend: Node + Express, SSE streaming
- LLM: OpenRouter. Model adları SADECE src/config.js MODEL_ROLES'ta. Hardcode YASAK.

## Kesin kurallar
- Sunucuyu `npm run server` ile DEĞİL, doğrudan `node server/index.js` ile başlat (npm orphan process bırakıyor).
- Persona yorumları DOĞAL Türkçe olmalı — çeviri kokan dil yasak. Bu projenin kalbi.
- Her adımda SADECE istenen kapsamı yap; ileri adımların işine girme.
- mockData.js fallback olarak duruyor, silme.
- Her persona yapılandırılmış JSON döndürür: comment, stance, intensity, willEngage, replyType.

## Her görev sonunda
- npm run build hatasız olmalı.
- Sunucular background process olarak ayakta kalmalı.
- STEP[N]_REPORT.md üret: değişen dosyalar, test sonuçları, sorunlar+çözümler, açık noktalar.

## Bilinen ortam
- Windows. Port çakışmasında EADDRINUSE'u yakala, anlamlı mesaj ver.
- API key .env içinde OPENROUTER_API_KEY.
