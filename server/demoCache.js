// AYNA — Demo cache (otomatik üretildi).
// Üretici: scripts/generate-demo-cache.js
// Tarih: 2026-05-17T13:56:09.806Z
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
    "startedAt": 1779026104797
  },
  "personas": [
    {
      "personaId": "siradan-takipci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "ay bu kadar da değil ya bence, çok genel konuşuyosun 🙄",
      "stance": "karsit",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "gazeteci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Sosyal medya kullanımının gençler üzerindeki etkileri tartışmalı ancak toptan yasaklama radikal bir çözüm değil. Bu iddia, kapsamlı araştırmalarla desteklenmeli.",
      "stance": "notr",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "anonim-troll",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "vay be, bir sosyal medya uzmanı daha! herkes senin fikrini bekliyordu zaten.",
      "stance": "alayci",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "muhafazakar-ebeveyn",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Vallahi billahi doğru söylenmiş, bu telefonlar, bu internet çocuklarımızın elinden alınmalı. Ne hale geldik Allah aşkına, çocuklar sokakta oynamayı unuttu.",
      "stance": "destek",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "apolitik-z",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "kanka noldu ya durup dururken sosyal medyaya sardın, sanki eskiler çok doğru düzgün de şimdi patladı ortalık ne alaka. bi git ya.",
      "stance": "karsit",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "marka-yoneticisi",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Bu denli kategorik bir yasaklama önerisi, hedef kitle algısında geri tepme yaratabilir ve markanızın gençlerle olan bağını koparabilir. İletişimde bu kadar keskin ifadeler yerine daha yapıcı yaklaşımlar kurumsal itibar açısından daha sağlıklı olacaktır.",
      "stance": "karsit",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "esprili-mizahci",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "18 yaş altına yasaklayalım da, annemiz babamızdan internet için izin alalım. 😂 O zaman aile toplantılarında 'Like' butonu olur muydu acaba?",
      "stance": "alayci",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "liberal-akademisyen",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "Bu tip genellemeler sorunlu. Sosyal medyanın etkileri üzerine yeterli sayıda çalışma yapılmadan böyle kesin yargılar vermek, 'hasty generalization' tuzağına düşmek demektir.",
      "stance": "karsit",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    }
  ],
  "risk": {
    "virallik": 80,
    "polarizasyon": 85,
    "itibarRiski": 83,
    "gerekce": {
      "virallik": "Gençlik, ebeveynlik ve teknoloji kesişimindeki kategorik yasaklama önerisi Türkiye'de hem destekçi hem karşıt kampların yoğun paylaşımıyla hızla yayılacak ve alıntı tweet bombardımanına uğrayacaktır.",
      "polarizasyon": "'Nesil çöp olacak' gibi aşırı genelleyici ifade muhafazakar ebeveynler ile liberal/dijital okuryazarlık savunucuları arasında keskin bir ayrışma yaratarak iki karşıt kampa bölecektir.",
      "itibarRiski": "Kategorik dil ve hakaret boyutundaki genelleme kombinasyonu organize linç kampanyası tetikleyecek, tweet sahibinin profesyonel itibarını uzun vadede ciddi şekilde zedeleyecektir."
    },
    "source": "council",
    "president": "councilA",
    "elapsedMs": 39765,
    "councilStage1": [
      {
        "memberKey": "councilA",
        "model": "anthropic/claude-sonnet-4.5",
        "virallik": 72,
        "polarizasyon": 78,
        "itibarRiski": 81
      },
      {
        "memberKey": "councilB",
        "model": "openai/gpt-4o",
        "virallik": 75,
        "polarizasyon": 80,
        "itibarRiski": 70
      },
      {
        "memberKey": "councilC",
        "model": "google/gemini-2.5-flash",
        "virallik": 85,
        "polarizasyon": 90,
        "itibarRiski": 75
      }
    ]
  },
  "done": {
    "elapsedMs": 44030,
    "total": 8,
    "riskSource": "council",
    "cacheState": "miss"
  }
};

export const DEMO_SOFTEN_RESPONSE = {
  "yumusatilmisTweet": "Sosyal medya gençlerin gelişimini olumsuz etkileyebiliyor; bu yüzden 18 yaş altı için daha dikkatli düzenlemeler yapılmalı, aksi halde bu nesil zorlanabilir.",
  "neDegisti": "Mutlak ifadeleri ve aşağılayıcı dili yumuşattım, daha dikkatli bir ton kullandım.",
  "secilenDal": "olculu",
  "secimGerekcesi": "Ölçülü alternatif, orijinal mesajın ana fikrini korurken riskli ifadeleri önemli ölçüde yumuşatarak en iyi dengeyi sunmaktadır.",
  "branches": [
    {
      "strategy": "olculu",
      "label": "Ölçülü",
      "yumusatilmisTweet": "Sosyal medya gençlerin gelişimini olumsuz etkileyebiliyor; bu yüzden 18 yaş altı için daha dikkatli düzenlemeler yapılmalı, aksi halde bu nesil zorlanabilir.",
      "neDegisti": "Mutlak ifadeleri ve aşağılayıcı dili yumuşattım, daha dikkatli bir ton kullandım.",
      "skor": null
    },
    {
      "strategy": "soruya-cevir",
      "label": "Soruya çevir",
      "yumusatilmisTweet": "Sosyal medyanın gençler üzerindeki gerçek etkisi nedir? 18 yaş altına yasaklanmalı mı? Yoksa bu nesil risk altında mı?",
      "neDegisti": "Tweet'in iddialarını soru formuna çevirerek tartışmaya açtım ve hüküm kipini sorgulama kipine dönüştürdüm.",
      "skor": {
        "riskDusus": 90,
        "niyetKorunma": 60
      }
    },
    {
      "strategy": "kisiselden-genele",
      "label": "Kişiselden genele",
      "yumusatilmisTweet": "Sosyal medyanın gençler üzerindeki etkileri tartışılmalı; 18 yaş altı için bazı kısıtlamalar düşünülmeli, aksi halde bu durumun olumsuz etkileri olabilir.",
      "neDegisti": "Genelleme ve suçlama dili gözlem ve tartışma önerisine dönüştürüldü.",
      "skor": {
        "riskDusus": 80,
        "niyetKorunma": 75
      }
    }
  ],
  "model": "openai/gpt-4o",
  "evaluatorModel": "google/gemini-2.5-flash",
  "elapsedMs": 4242
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
    "startedAt": 1779026153080
  },
  "personas": [
    {
      "personaId": "muhafazakar-ebeveyn",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Ah ne kadar da doğru sözler, evlatlarımızın elinden kayıp gitmesinden korkuyorum vallahi. Eskiden sokakta oynardık, şimdi ekran başından kalkmıyoruz, Rabbim sonumuzu hayretsin.",
      "stance": "destek",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "siradan-takipci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "aynen ya, özellikle de bu filtreler falan mahvediyor çocukları 🤦🏼‍♀️",
      "stance": "destek",
      "intensity": 3,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "marka-yoneticisi",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Sosyal medya kullanımının genelde algılanan olumsuz etkileri üzerine bir vurgu görüyorum. Düzenleme çağrısı, marka kimliği veya hedef kitle algısı açısından dikkatle ele alınması gereken hassas bir konu.",
      "stance": "notr",
      "intensity": 2,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "gazeteci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Sosyal medyanın gençler üzerindeki etkisi tartışılıyor, bu doğru. 'Zorlanabilir' ifadesini somutlaştıran bir çalışma veya rapor var mı?",
      "stance": "notr",
      "intensity": 2,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "apolitik-z",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "aga yine mi aynı muhabbet ya çocuklar zihgir gibi büyütülmese bu kadar sorun olmaz bence abartmayın her şeyi.",
      "stance": "notr",
      "intensity": 2,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "anonim-troll",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "vay be, bir eğitim bilimci daha konuşmuş. gençlerin sosyal medya kullanımı seni neden bu kadar geriyor ki?",
      "stance": "alayci",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "esprili-mizahci",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "18 yaş altı için sosyal medya düzenlemesi mi? Zaten internet yavaş; belki bu hızla sorun çözülür 😂",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "liberal-akademisyen",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "Sosyal medyanın gençleri olumsuz etkilediği iddiası geniş bir genelleme. Kimin ne şekilde etkilendiği üzerine somut veriler olmadan tüm nesli kapsayan bir sonuca varmak aceleci bir yaklaşım.",
      "stance": "karsit",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    }
  ],
  "risk": {
    "virallik": 35,
    "polarizasyon": 48,
    "itibarRiski": 20,
    "gerekce": {
      "virallik": "Gençlik ve sosyal medya konusu ilgi çekici olsa da tweet'in ılımlı tonu ve yeni bir perspektif sunmaması viral patlamayı engelliyor, sınırlı paylaşım alacak.",
      "polarizasyon": "Persona yorumları farklı bakış açıları içerse de keskin kamplaşma yok; tweet genel bir endişeyi ifade ettiği için orta düzey fikir ayrılığı yaratır ama bölücü değil.",
      "itibarRiski": "Mainstream bir kaygıyı ılımlı dille dile getirmek linç tetiklemez, en fazla hafif alaycı yorumlar alır; kariyer veya imaj için ciddi tehdit yok."
    },
    "source": "council",
    "president": "councilA",
    "elapsedMs": 13958,
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
        "polarizasyon": 55,
        "itibarRiski": 30
      }
    ]
  },
  "done": {
    "elapsedMs": 16725,
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
