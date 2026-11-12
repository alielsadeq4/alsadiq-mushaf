// Generate PNG icons from SVG using sharp
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ICONS_DIR = "/home/z/my-project/public/icons";
const svgPath = path.join(ICONS_DIR, "icon.svg");

async function main() {
  const svgBuffer = fs.readFileSync(svgPath);

  await sharp(svgBuffer, { density: 384 }).resize(192, 192).png().toFile(path.join(ICONS_DIR, "icon-192.png"));
  console.log("Generated icon-192.png");

  await sharp(svgBuffer, { density: 1024 }).resize(512, 512).png().toFile(path.join(ICONS_DIR, "icon-512.png"));
  console.log("Generated icon-512.png");

  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6B0F1A"/>
        <stop offset="100%" stop-color="#C9A15A"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <text x="600" y="280" font-family="serif" font-size="120" fill="#F5EFE6" text-anchor="middle" font-weight="bold">الصادق</text>
    <text x="600" y="370" font-family="sans-serif" font-size="36" fill="#F5EFE6" text-anchor="middle" opacity="0.85">منصة الاستماع الإسلامي</text>
    <text x="600" y="450" font-family="sans-serif" font-size="22" fill="#F5EFE6" text-anchor="middle" opacity="0.7">القرآن · الرقية · الأذكار · الصلاة على النبي ﷺ</text>
  </svg>`;
  await sharp(Buffer.from(ogSvg), { density: 200 }).resize(1200, 630).png().toFile(path.join(ICONS_DIR, "og-image.png"));
  console.log("Generated og-image.png");

  await sharp(svgBuffer, { density: 384 }).resize(180, 180).png().toFile(path.join(ICONS_DIR, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
