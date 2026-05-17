// AYNA — Demo cache (otomatik üretildi).
// Üretici: scripts/generate-demo-cache.js
// Tarih: 2026-05-17T12:56:49.754Z
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
    "startedAt": 1779022557976
  },
  "personas": [
    {
      "personaId": "siradan-takipci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "ay bu kadar da değil ya 🙄 biraz abartı olmuş sanki",
      "stance": "karsit",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "apolitik-z",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "hee kanka kesin gençlik sosyal medyada diye çöp olacak başka derdimiz kalmadı sanki ya sjshshs ne abartmışsın ablam",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "anonim-troll",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "sen ciddi misin kanka, sosyal medyayı kapatınca gençler bir anda Einstein mı olacak? bu bakış açısı ne kadar derin!",
      "stance": "alayci",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "muhafazakar-ebeveyn",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Allah sonumuzu hayretsin... Haklı valla, elimizden kayıp gidiyor çocuklar, hiçbir şeye yetişemiyoruz artık.",
      "stance": "destek",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "marka-yoneticisi",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Bu denli keskin bir ifade, hedef kitle içinde hem gençlerin hem de ebeveynlerin ciddi tepkisini çekebilir. Marka imajı açısından, genellemelerden kaçınmak ve kapsayıcı bir dil kullanmak her zaman daha sağlıklı bir yaklaşımdır.",
      "stance": "karsit",
      "intensity": 4,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "gazeteci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Sosyal medyanın gençler üzerindeki etkisine dair endişeler anlaşılır. Ancak derhal yasaklama önerisi, sorunu ne kadar çözecek? Bu bilginin dayanağı nedir?",
      "stance": "notr",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "esprili-mizahci",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "Bizim zamanımızda da televizyon ve walkman gençliği mahvediyor derlerdi, şimdi telefon kablosuz internetsiz çalışmıyor diye üzülüyoruz. Her nesil bir şeyle 'mahvoluyor' zaten. 🎬",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "liberal-akademisyen",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "Bu iddiada apaçık bir 'hasty generalization' var. Sosyal medyanın negatif etkileri olabilir ama tüm bir nesli 'çöp' olarak etiketlemek problemin çözümüne dair hiçbir somut veri sunmuyor.",
      "stance": "karsit",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    }
  ],
  "risk": {
    "virallik": 82,
    "polarizasyon": 88,
    "itibarRiski": 87,
    "gerekce": {
      "virallik": "Gençlik ve sosyal medya gibi evrensel hassas konuya 'çöp nesil' gibi bomba ifade eklenince, hem destek hem öfke kamplarından masif alıntı tweet ve tartışma dalgası kaçınılmaz.",
      "polarizasyon": "'Çöp nesil' ifadesi Z kuşağı, ebeveynler, eğitimciler ve dijital özgürlük savunucuları arasında keskin kamplaşma yaratıyor; uzlaşma zemini yok, sadece savaş hattı var.",
      "itibarRiski": "Tüm bir nesli 'çöp' ilan etmek Türk sosyal medyasında linç garantisi; tweet sahibi kalıcı 'gençlik düşmanı' etiketi alır ve kariyer/imaj hasarı uzun vadeli olur."
    },
    "source": "council",
    "president": "councilA",
    "elapsedMs": 16339
  },
  "done": {
    "elapsedMs": 24402,
    "total": 8,
    "riskSource": "council",
    "cacheState": "miss"
  }
};

export const DEMO_SOFTEN_RESPONSE = {
  "yumusatilmisTweet": "Sosyal medyanın gençler üzerinde olumsuz etkileri olabilir; belki 18 yaş altına sınırlamalar getirilmesi faydalı olur. Bu konuyu ciddiyetle ele almalıyız.",
  "neDegisti": "'Çöp nesil' ve 'derhal yasaklanmalı' gibi sert ifadeler yumuşatıldı. Gençlerin sosyal medya kullanımıyla ilgili endişeler dile getirildi, ama daha yapıcı ve dengeli bir tonla.",
  "model": "openai/gpt-4o",
  "elapsedMs": 1874
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
    "startedAt": 1779022584261
  },
  "personas": [
    {
      "personaId": "marka-yoneticisi",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Gençlerin sosyal medya kullanımı konusundaki endişeler anlaşılabilir, ancak sınırlamaların hedef kitle algısı üzerindeki potansiyel etkileri ve uygulama zorlukları derinlemesine değerlendirilmeli.",
      "stance": "notr",
      "intensity": 2,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "apolitik-z",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "hee ya kesin sosyal medya yüzünden oluyo her şey sanki başka derdimiz yok he ulan asıl kafa rahatlığına sınırlama getirseler daha iyi ciddiyetle ele alacak başka şeyler var bence",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "esprili-mizahci",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "18 yaş altına sınırlama getiririz de, sonra ergenler neden duvarlarla konuşmaya başladı diye merak ederiz 😂",
      "stance": "alayci",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "muhafazakar-ebeveyn",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Allah razı olsun, sonunda aklı başında birileri de böyle şeyler söylüyor. Çocuklarımız elden gidiyor bu meret yüzünden, yazık değil mi yavrularımızın geleceğine?",
      "stance": "destek",
      "intensity": 4,
      "willEngage": true,
      "replyType": "reply"
    },
    {
      "personaId": "liberal-akademisyen",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "Sosyal medya elbette riskler taşır ama yasaklama yerine eğitimle bilinçlendirme daha etkili olmaz mı? Toptan kısıtlama yerine, gençleri doğru bilgilendirme üzerinde düşünmek gerekir.",
      "stance": "karsit",
      "intensity": 3,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "anonim-troll",
      "model": "openai/gpt-4o",
      "roleKey": "personaSharp",
      "comment": "ya senin bu ciddiyet merakın niye? 18 yaş altına yasak getiriyor da sanki sen mi kurtaracaksın dünyayı?",
      "stance": "alayci",
      "intensity": 4,
      "willEngage": true,
      "replyType": "quote"
    },
    {
      "personaId": "siradan-takipci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "ay bu hep konuşuluyor ama yine de bir şey olmuyor gibi sanki 🤔",
      "stance": "notr",
      "intensity": 2,
      "willEngage": false,
      "replyType": "reply"
    },
    {
      "personaId": "gazeteci",
      "model": "google/gemini-2.5-flash",
      "roleKey": "personaPrimary",
      "comment": "Gençler üzerinde olası olumsuz etkiler konusunda somut veriler var mı? Hangi araştırmalar bu yönde bir sınırlamayı destekliyor?",
      "stance": "notr",
      "intensity": 3,
      "willEngage": true,
      "replyType": "quote"
    }
  ],
  "risk": {
    "virallik": 45,
    "polarizasyon": 58,
    "itibarRiski": 35,
    "gerekce": {
      "virallik": "Tweet klişe bir endişeyi dile getirse de '18 yaş sınırı' önerisi tartışma başlatacak kadar somut, ancak ılımlı ton ve jenerik ifade viral patlama engelliyor.",
      "polarizasyon": "Ebeveyn-genç, özgürlükçü-korumacı eksenlerde net bir bölünme var ama tweetin yumuşak dili keskin kamplaşmayı körüklemiyor, orta düzey kutuplaşma yaratıyor.",
      "itibarRiski": "Öneri tartışmalı olsa da 'belki' ve 'ciddiyetle ele almalıyız' gibi temkinli ifadeler linç riskini düşürüyor, ancak genç kitle tarafından 'boomer' damgası yeme ihtimali mevcut."
    },
    "source": "council",
    "president": "councilA",
    "elapsedMs": 18549
  },
  "done": {
    "elapsedMs": 25491,
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
