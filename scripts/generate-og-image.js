// Regenerate og-image.png (1200x630) matching the brand identity exactly:
// Burgundy #6B0F1A background with subtle arabesque, gold #C9A15A accents,
// cream #F5EFE6 text. Uses sharp (already in dependencies).
const sharp = require("sharp");
const path = require("path");

const W = 1200;
const H = 630;

// Subtle arabesque tile — eight-point star lattice, very low opacity
function arabesquePattern() {
  let tiles = "";
  const step = 120;
  for (let x = 0; x < W + step; x += step) {
    for (let y = 0; y < H + step; y += step) {
      const cx = x + step / 2;
      const cy = y + step / 2;
      const r = 34;
      // Eight-point star (two overlapping squares rotated 45°)
      tiles += `
        <g transform="translate(${cx},${cy})" opacity="0.05">
          <rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" fill="none" stroke="#C9A15A" stroke-width="1.4"/>
          <rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" fill="none" stroke="#C9A15A" stroke-width="1.4" transform="rotate(45)"/>
        </g>`;
    }
  }
  return tiles;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6B0F1A"/>
      <stop offset="55%" stop-color="#5A0C15"/>
      <stop offset="100%" stop-color="#3E090F"/>
    </linearGradient>
    <radialGradient id="glow1" cx="18%" cy="12%" r="45%">
      <stop offset="0%" stop-color="#C9A15A" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#C9A15A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="85%" cy="92%" r="50%">
      <stop offset="0%" stop-color="#C9A15A" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#C9A15A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow1)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  ${arabesquePattern()}

  <!-- Top & bottom gold hairlines -->
  <rect x="0" y="0" width="${W}" height="6" fill="#C9A15A" opacity="0.85"/>
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="#C9A15A" opacity="0.85"/>

  <!-- Logo mark: gold rounded square + open book -->
  <g transform="translate(${W / 2 - 52},86)">
    <rect width="104" height="104" rx="26" fill="#C9A15A"/>
    <g transform="translate(52,52)" stroke="#6B0F1A" stroke-width="4.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 -26 V26"/>
      <path d="M-28 -20 c8 0 16 4 28 7 12 -3 20 -7 28 -7 V20 c-8 0 -16 4 -28 7 -12 -3 -20 -7 -28 -7 Z"/>
    </g>
  </g>

  <!-- Title -->
  <text x="${W / 2}" y="292" text-anchor="middle" fill="#C9A15A"
        font-family="Noto Kufi Arabic, Cairo, sans-serif" font-weight="700"
        font-size="118">الصادق</text>

  <!-- Subtitle -->
  <text x="${W / 2}" y="372" text-anchor="middle" fill="#F5EFE6"
        font-family="Cairo, sans-serif" font-weight="600"
        font-size="40">منصة الاستماع الإسلامي</text>

  <!-- Divider ornament -->
  <g transform="translate(${W / 2},416)" opacity="0.9">
    <line x1="-130" y1="0" x2="-22" y2="0" stroke="#C9A15A" stroke-width="1.6"/>
    <line x1="22" y1="0" x2="130" y2="0" stroke="#C9A15A" stroke-width="1.6"/>
    <g transform="scale(0.8)">
      <rect x="-10" y="-10" width="20" height="20" fill="none" stroke="#C9A15A" stroke-width="1.6"/>
      <rect x="-10" y="-10" width="20" height="20" fill="none" stroke="#C9A15A" stroke-width="1.6" transform="rotate(45)"/>
    </g>
  </g>

  <!-- Content line -->
  <text x="${W / 2}" y="486" text-anchor="middle" fill="#F5EFE6" fill-opacity="0.82"
        font-family="Cairo, sans-serif" font-weight="500"
        font-size="30">القرآن الكريم  •  الرقية الشرعية  •  الأذكار  •  الصلاة على النبي ﷺ</text>

  <!-- Footer -->
  <text x="${W / 2}" y="556" text-anchor="middle" fill="#F5EFE6" fill-opacity="0.5"
        font-family="Cairo, sans-serif" font-weight="400"
        font-size="22">بلا حساب  •  بلا إعلانات  •  يعمل بدون إنترنت</text>
</svg>`;

const out = path.join(__dirname, "..", "public", "icons", "og-image.png");

sharp(Buffer.from(svg))
  .resize(W, H)
  .png({ compressionLevel: 9 })
  .toFile(out)
  .then((info) => console.log("og-image written:", out, info))
  .catch((err) => {
    console.error("failed:", err);
    process.exit(1);
  });
