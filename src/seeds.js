// AYNA / Mirror — Hazır demo seed'leri.
// Her seed: bir tweet metni + bunu yazan kişinin profil bilgisi (avatar, isim, handle, tarih).
// UI'de küçük chip'lerle gösterilir; tıklanınca tweet textarea'ya yüklenir
// ve composer kartının kimliği o seed'in profiline döner.

import ruhiAvatar from "@/assets/ruhi_cenet.jpg";

export const DEMO_SEEDS = [
  {
    id: "ruhi-cenet-taklit",
    label: "Ruhi Çenet — taklit ithamı",
    profile: {
      name: "Ruhi Çenet",
      handle: "@RuhiCenet",
      avatarSrc: ruhiAvatar,
      dateLabel: "13 Şub 2025",
      verified: true,
    },
    tweet: `Türkiye'den bazı izleyiciler videomuzun başlığını Joe Hattab'ın videosuyla benzer bulup bizi taklit etmekle itham ediyor. Joe Hattab'ı tanırım, ancak videomuz çok izlenince, kendisi başlığını bizimkiyle aynı yaptı ve onun videosu bizden önce yayınlandığı için herkes bizim onu kopyaladığımızı düşündü.
Ayrıca biz videoyu 30 Ekim'de çekmiştik, bu detayı videomuzun 2. dakikası, 20. saniyesinde görebilirsiniz.
Titizlikle çalıştığımız için ve 17 dilde hazırladığımız için geç yayınladık.`,
  },
];
