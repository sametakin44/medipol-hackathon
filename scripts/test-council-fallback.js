// AYNA — Council fallback testi.
// Senaryo: councilC modelini geçersiz bir slug'a çevir. runCouncil:
//   - stage1'de C başarısız olur, A ve B çalışır
//   - stage2'de A ve B birbirini eleştirir
//   - stage3 başkanı A çalışır
//   - Final skor üretilir, null DÖNMEZ
// 3 üye de başarısız olursa (örn. tümüne bad slug verirsek) null dönmeli.

import { loadDotEnv } from "../server/loadEnv.js";
loadDotEnv();

import { MODEL_ROLES } from "../src/config.js";
import { runCouncil } from "../server/council.js";

const sampleTweet = "Türkiye'nin eğitim sistemi tamamen baştan tasarlanmalı, mevcut yapı çocuklarımızın geleceğini öldürüyor.";

const samplePersonaResults = [
  { personaId: "apolitik-z", comment: "yine eğitim drama xd boşver kanka", stance: "alayci", intensity: 2, willEngage: false, replyType: "reply" },
  { personaId: "muhafazakar-ebeveyn", comment: "Allah'a şükür kıymetli öğretmenlerimiz var, çocuklarımız emin ellerde.", stance: "destek", intensity: 3, willEngage: false, replyType: "reply" },
  { personaId: "liberal-akademisyen", comment: "Sistem 'baştan tasarlanmalı' diyor ama önerilen yapı ne? Eleştiri argümansız.", stance: "karsit", intensity: 4, willEngage: true, replyType: "reply" },
  { personaId: "anonim-troll", comment: "sen sistemi bilmeyensin önce 8 sınıf bitir kralım", stance: "alayci", intensity: 5, willEngage: true, replyType: "quote" },
  { personaId: "marka-yoneticisi", comment: "Bu kadar mutlak yargı içeren tweet eğitimciler nezdinde tepkiye yol açabilir.", stance: "karsit", intensity: 3, willEngage: false, replyType: "reply" },
  { personaId: "gazeteci", comment: "Hangi rapora dayanarak 'çöküyor' diyorsunuz? Kaynak rica edebilir miyim?", stance: "notr", intensity: 2, willEngage: true, replyType: "quote" },
  { personaId: "esprili-mizahci", comment: "müfredat 1923'ten beri aynı diyenler şimdi yeniden yazılsın diyor 🫠", stance: "alayci", intensity: 3, willEngage: true, replyType: "quote" },
  { personaId: "siradan-takipci", comment: "ay ben de aynısını düşünüyorum 😩", stance: "destek", intensity: 2, willEngage: false, replyType: "reply" },
];

function header(s) {
  console.log(`\n=== ${s} ===`);
}

async function senaryoA_OneMemberFails() {
  header("Senaryo A: 3 üyeden 1'i hata (councilC = geçersiz slug)");
  const orig = MODEL_ROLES.councilC;
  MODEL_ROLES.councilC = "this-model/definitely-does-not-exist";
  try {
    const result = await runCouncil({ tweet: sampleTweet, personaResults: samplePersonaResults });
    if (!result) {
      console.log("✗ FAIL: result null geldi, oysa 2 üye çalışmalıydı");
      return false;
    }
    console.log(`✓ OK: final = v${result.virallik}, p${result.polarizasyon}, i${result.itibarRiski}`);
    console.log(`  stage1 ok: ${result.council.stage1.length}, hata: ${result.council.stage1Failed.length}`);
    console.log(`  stage1 fails: ${result.council.stage1Failed.map((f) => `${f.memberKey}=${f.reason.slice(0, 80)}`).join("; ")}`);
    console.log(`  stage2 critiques: ${result.council.stage2.length}`);
    console.log(`  başkan: ${result.council.president}`);
    return true;
  } finally {
    MODEL_ROLES.councilC = orig;
  }
}

async function senaryoB_AllMembersFail() {
  header("Senaryo B: 3 üye de hata (her üye bad slug)");
  const origs = {
    councilA: MODEL_ROLES.councilA,
    councilB: MODEL_ROLES.councilB,
    councilC: MODEL_ROLES.councilC,
  };
  MODEL_ROLES.councilA = "bad/a";
  MODEL_ROLES.councilB = "bad/b";
  MODEL_ROLES.councilC = "bad/c";
  try {
    const result = await runCouncil({ tweet: sampleTweet, personaResults: samplePersonaResults });
    if (result === null) {
      console.log("✓ OK: 3'ü de hata verince null döndü (heuristic fallback'i tetikler)");
      return true;
    } else {
      console.log("✗ FAIL: null bekleniyordu, sonuç döndü");
      return false;
    }
  } finally {
    Object.assign(MODEL_ROLES, origs);
  }
}

(async () => {
  const a = await senaryoA_OneMemberFails();
  const b = await senaryoB_AllMembersFail();
  const ok = a && b;
  console.log(`\nToplam: ${[a, b].filter(Boolean).length}/2 başarılı`);
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error("Beklenmedik hata:", err);
  process.exit(1);
});
