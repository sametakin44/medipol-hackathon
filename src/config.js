// AYNA — merkezi konfigürasyon.
// Model adları SADECE burada tutulur. İleride OpenRouter çağrılarında kullanılacak.

export const MODEL_ROLES = {
  // orchestrator: "Yumuşat" gibi yeniden yazma akışlarında kullanılır.
  // Adım 5'te maliyet için Sonnet'ten gpt-4o'ya alındı; Türkçe doğallık etkilenmedi.
  orchestrator: "openai/gpt-4o",
  personaPrimary: "google/gemini-2.5-flash",
  personaSharp: "openai/gpt-4o",
  // councilA = başkan (Sonnet kalır — sentez kalitesi için).
  councilA: "anthropic/claude-sonnet-4.5",
  councilB: "openai/gpt-4o",
  // councilC: Gemini 2.5 Pro JSON yerine markdown / commentary dönüyordu (parser kurtarmıyordu).
  // Flash'a alındı — Google vendor diversity korundu, JSON tutarlılığı kazanıldı.
  councilC: "google/gemini-2.5-flash",
  // Tree-of-Thoughts Yumuşat akışında 3 dalın puanlanması için ucuz değerlendirici.
  // Council başkanı (councilA) DEĞİŞMEZ; ToT değerlendirmesi ayrı bu rolle yapılır.
  softenEvaluator: "google/gemini-2.5-flash",
};

// 8 persona — her birinin bir yorum kartı olacak.
// modelRole = MODEL_ROLES anahtarı: personaPrimary (hızlı/ucuz) veya personaSharp (ince argo/ironi kritik).
export const PERSONAS = [
  {
    id: "apolitik-z",
    label: "Apolitik Z'li",
    avatarEmoji: "🧃",
    archetype: "Politikadan uzak duran, mizah ve trende odaklı Z kuşağı kullanıcısı.",
    modelRole: "personaPrimary",
  },
  {
    id: "muhafazakar-ebeveyn",
    label: "Muhafazakar Ebeveyn",
    avatarEmoji: "👨‍👩‍👧",
    archetype: "Aile değerlerini ön planda tutan, geleneksel bakış açılı orta yaş kullanıcı.",
    modelRole: "personaPrimary",
  },
  {
    id: "liberal-akademisyen",
    label: "Liberal Akademisyen",
    avatarEmoji: "🎓",
    archetype: "Eleştirel düşünen, kaynak ve nüans arayan üniversite çevresinden kullanıcı.",
    // Sharp model — ince ironi, kavramsal eleştiri tonu kritik.
    modelRole: "personaSharp",
  },
  {
    id: "anonim-troll",
    label: "Anonim Troll",
    avatarEmoji: "👹",
    archetype: "Provokatif, sert dilli, anonim hesaplı kullanıcı.",
    // Sharp model — argo/sınır dilini doğal taşıması kritik.
    modelRole: "personaSharp",
  },
  {
    id: "marka-yoneticisi",
    label: "Marka Yöneticisi",
    avatarEmoji: "💼",
    archetype: "Tonu ve itibar riskini değerlendiren kurumsal iletişim profili.",
    modelRole: "personaPrimary",
  },
  {
    id: "gazeteci",
    label: "Gazeteci",
    avatarEmoji: "📰",
    archetype: "Haber değeri ve doğrulama refleksiyle yaklaşan medya profili.",
    modelRole: "personaPrimary",
  },
  {
    id: "esprili-mizahci",
    label: "Esprili Mizahçı",
    avatarEmoji: "🎭",
    archetype: "Her şeyden espri çıkaran, ironi ve gönderme yapan kullanıcı.",
    // Sharp model — Flash'ta Türkçesi pürüzlü/kopuk cümleler çıkarıyordu.
    modelRole: "personaSharp",
  },
  {
    id: "siradan-takipci",
    label: "Sıradan Takipçi",
    avatarEmoji: "👤",
    archetype: "Pasif izleyici, kısa ve duygusal tepkiler veren ortalama kullanıcı.",
    modelRole: "personaPrimary",
  },
];
