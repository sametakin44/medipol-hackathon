// AYNA — Demo cache (otomatik üretildi).
// Üretici: scripts/generate-demo-cache.js
// Tarih: 2026-05-17T13:27:55.397Z
//
// Bu dosya production cache değil — DEMO/video çekimi için sabit sonuç.
// AYNA_DEMO_MODE=1 ile server/index.js bu sabit cevapları SSE üzerinden replay eder.

export const DEMO_TWEET = "Sosyal medya gençleri tamamen mahvediyor; 18 yaş altına derhal yasaklanmalı, yoksa bu nesil çöp olacak.";

export const DEMO_SIMULATE_BEFORE = {
  "meta": {
    "expectedPersonaIds": [
      "apolitik-z",
      "muhafazakar-ebeveyn",
      "liberal-akademisyen",
      "anonim-troll",
      "marka-yoneticisi",
      "gazeteci",
      "esprili-mizahci",
      "siradan-takipci"
    ],
    "model": "google/gemini-2.5-flash",
    "sharpModel": "openai/gpt-4o",
    "startedAt": 1779024422054
  },
  "personas": [
    {
      "personaId": "muhafazakar-ebeveyn",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Allah muhafaza, ne günlere kaldık. Çocuklarımızın elinden telefon düşmüyor, ben de görüyorum, haklısınız.",
      "stance": "destek",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "marka-yoneticisi",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Bu derece keskin ve genellemeci bir söylem, hedef kitlenizin önemli bir kesiminde ciddi bir kopuşa neden olabilir. İletişim stratejilerinde bu gibi 'ya hep ya hiç' yaklaşımlar genellikle istenen pozitif algıyı yaratmaz ve itibar riskini yükseltir.",
      "stance": "karsit",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "apolitik-z",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "kanka abartmışsın ya, yasaklayınca süper nesil mi olucaz yani? boş yapma bence.",
      "stance": "karsit",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "gazeteci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Sosyal medya kullanımının gençler üzerindeki etkisi tartışılıyor. 'Mahvediyor', 'çöp olacak' gibi ifadeler bilimsel bir zemine dayanıyor mu? Bu kadar kesin yargılar için elimizde hangi veriler var?",
      "stance": "notr",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "anonim-troll",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "vay be, 18 yaş altını kurtarma görevi kendine verilmiş kanka. bence hükümet seni dinlemeli.",
      "stance": "alayci",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "esprili-mizahci",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "18 yaşındaki ben, sosyal medyayı keşfetmeseydim şu an taş devrinden kalma bir mağarada olurdum herhalde. 😂",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "siradan-takipci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "aynen yaa, bazen ben bile kendimi kaptırıyorum düşün yani. haklısın.",
      "stance": "destek",
      "intensity": 3,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "liberal-akademisyen",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "18 yaş altına sosyal medya yasağı önerisi, tek değişkenle kocaman bir nesli 'çöp' ilan etme cesareti taşıyor. Sosyal medya etkisini anlamak daha derin bir analiz gerektirir.",
      "stance": "karsit",
      "intensity": 4,
      "willEngage": false,
      "replyType": "reply"
    }
  ],
  "risk": {
    "virallik": 78,
    "polarizasyon": 85,
    "itibarRiski": 82,
    "gerekce": {
      "virallik": "Gençlik ve ebeveynlik hassasiyetine dokunan, radikal yasaklama önerisi içeren tweet, Türk sosyal medyasında yüksek alıntı tweet ve tartışma potansiyeli taşıyor; benzer görüşler sık paylaşılsa da 'çöp nesil' ifadesi ekstra tıklama çekecek.",
      "polarizasyon": "'Çöp nesil' gibi genelleyici ifade ve 18 yaş altı yasak önerisi, ebeveyn/muhafazakar kesim ile Z kuşağı/liberal kesim arasında keskin bir bölünme yaratıyor; uzmanların en yüksek konsensüsü bu metrikte.",
      "itibarRiski": "Gençleri 'çöp' ilan eden sert dil, özellikle genç kullanıcıların organize alıntı tweet saldırılarına ve 'boomer/gerici' damgasına yol açabilir; tweet sahibi için orta-yüksek düzeyde linç ve itibar kaybı riski mevcut."
    },
    "source": "council",
    "president": "councilA",
    "elapsedMs": 21275,
    "councilStage1": [
      {
        "memberKey": "councilA",
        "model": "anthropic/claude-sonnet-4.5",
        "virallik": 72,
        "polarizasyon": 78,
        "itibarRiski": 68
      },
      {
        "memberKey": "councilB",
        "model": "openai/gpt-4o",
        "virallik": 70,
        "polarizasyon": 80,
        "itibarRiski": 75
      },
      {
        "memberKey": "councilC",
        "model": "google/gemini-2.5-flash",
        "virallik": 85,
        "polarizasyon": 90,
        "itibarRiski": 90
      }
    ]
  },
  "done": {
    "elapsedMs": 28944,
    "total": 8,
    "riskSource": "council",
    "cacheState": "miss"
  }
};

export const DEMO_SOFTEN_RESPONSE = {
  "yumusatilmisTweet": "Sosyal medyanın gençler üzerinde olumsuz etkileri olabileceğini düşünüyorum. Belki 18 yaş altı için bazı kısıtlamalar getirilebilir, aksi halde gençlerimiz için uzun vadede sorunlar ortaya çıkabilir.",
  "neDegisti": "'Tamamen mahvediyor' ve 'çöp nesil' gibi sert ifadeler yumuşatıldı; yasak önerisi yerine 'kısıtlama' ifadesi kullanılarak daha ılımlı bir yaklaşım benimsendi.",
  "model": "openai/gpt-4o",
  "elapsedMs": 1585
};

export const DEMO_SIMULATE_AFTER = {
  "meta": {
    "expectedPersonaIds": [
      "apolitik-z",
      "muhafazakar-ebeveyn",
      "liberal-akademisyen",
      "anonim-troll",
      "marka-yoneticisi",
      "gazeteci",
      "esprili-mizahci",
      "siradan-takipci"
    ],
    "model": "google/gemini-2.5-flash",
    "sharpModel": "openai/gpt-4o",
    "startedAt": 1779024452594
  },
  "personas": [
    {
      "personaId": "apolitik-z",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "kanka valla 18 yaş altı kısıtlamaları falan ne alaka ya, sanki biz kendi kendimizi yönetemiyoruz hepsi boş yapıyor 🤡",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "anonim-troll",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "vay be, sosyal medya uzmanı karşımızda. bravo, gençleri kurtarmanın formülünü buldun!",
      "stance": "alayci",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "liberal-akademisyen",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "Gençler üzerindeki etkiler hakkında somut veriler veya ampirik araştırma olmadan bu tür genellemeler yapmak metodolojik olarak yanıltıcı. Sosyal medyanın olumsuz etkileri kadar olumlu yanları da olabilir; dikkatli inceleme şart.",
      "stance": "karsit",
      "intensity": 3,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "marka-yoneticisi",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Gençlerin sosyal medya kullanımına yönelik bu endişeler, marka itibarımız açısından dikkatle takip etmemiz gereken bir alan zira hedef kitlemizin önemli bir kısmını etkiliyor.",
      "stance": "notr",
      "intensity": 2,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "siradan-takipci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "aynen yaa, ben de bazen çok korkuyorum bu durumdan 😔",
      "stance": "destek",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "gazeteci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Gençler üzerindeki olumsuz etkiler konusunda ne tür veriler var? Kısıtlamaların somut olarak nasıl uygulanacağı ve hangi sorunları çözeceği önemli.",
      "stance": "notr",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "muhafazakar-ebeveyn",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Allah razı olsun, ne kadar doğru bir tespit. Ben de evlatlarım için bu durumdan çok muzdaribim, geceleri uyku girmiyor gözüme.",
      "stance": "destek",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "esprili-mizahci",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "açık arttırmada sanki! 'belki'yi duyan gençler hemen bir yasak hayali kurdu 😂 sosyal medyada kısıtlamalar, tamam da abartmadan tabii.",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    }
  ],
  "risk": {
    "virallik": 35,
    "polarizasyon": 48,
    "itibarRiski": 22,
    "gerekce": {
      "virallik": "Tweet güncel bir konuya değinse de yumuşatıcı dil ('belki', 'düşünüyorum') ve genel ifadeler nedeniyle sınırlı yayılma potansiyeline sahip, trend olmaktan çok ılımlı tartışma başlatır.",
      "polarizasyon": "Gençlik-sosyal medya kısıtlaması konusu iki taraf yaratsa da keskin kamplaşma yerine destekçi-karşıt-alaycı arasında dağılmış ılımlı tepkiler gözlemleniyor, ciddi bölünme yok.",
      "itibarRiski": "Yumuşak ton ve genel endişe ifadesi sayesinde linç potansiyeli minimal, en fazla hafif eleştiri ve alaycı yorumlarla karşılaşabilir ancak kariyer/imaj zararı riski düşük."
    },
    "source": "council",
    "president": "councilA",
    "elapsedMs": 17021,
    "councilStage1": [
      {
        "memberKey": "councilA",
        "model": "anthropic/claude-sonnet-4.5",
        "virallik": 28,
        "polarizasyon": 42,
        "itibarRiski": 15
      },
      {
        "memberKey": "councilB",
        "model": "openai/gpt-4o",
        "virallik": 55,
        "polarizasyon": 60,
        "itibarRiski": 40
      },
      {
        "memberKey": "councilC",
        "model": "google/gemini-2.5-flash",
        "virallik": 45,
        "polarizasyon": 60,
        "itibarRiski": 35
      }
    ]
  },
  "done": {
    "elapsedMs": 22802,
    "total": 8,
    "riskSource": "council",
    "cacheState": "miss"
  }
};

// Demo modunda /api/simulate gelen tweet'i bu helper'la eşleştir.
export function matchDemoSimulate(tweet) {
  const t = (tweet || "").trim();
  if (t === DEMO_TWEET.trim()) return DEMO_SIMULATE_BEFORE;
  if (t === DEMO_SOFTEN_RESPONSE.yumusatilmisTweet.trim()) return DEMO_SIMULATE_AFTER;
  return null;
}

export function matchDemoSoften(tweet) {
  const t = (tweet || "").trim();
  if (t === DEMO_TWEET.trim()) return DEMO_SOFTEN_RESPONSE;
  return null;
}
