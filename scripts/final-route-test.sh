#!/bin/bash
# اختبار إنتاج نهائي لكل مسارات منصة "الصادق" على خادم standalone
PORT=3100
BASE="http://localhost:$PORT"
LOG=/tmp/prod-server.log

cd /home/z/my-project
PORT=$PORT NODE_ENV=production nohup node .next/standalone/server.js > "$LOG" 2>&1 &
SERVER_PID=$!
sleep 3

echo "=== حالة الخادم ==="
ss -tlnp 2>/dev/null | grep ":$PORT" >/dev/null && echo "server UP on :$PORT" || { echo "server DOWN"; cat "$LOG"; exit 1; }

ROUTES=(
  "/" "/quran" "/hifdh" "/kids" "/ruqyah" "/morning" "/evening" "/after-prayer"
  "/adhkar-misc" "/names" "/salawat" "/tasbih" "/prayer-times" "/ramadan"
  "/library" "/search" "/settings" "/about" "/faq" "/privacy" "/sources"
  "/quran/1" "/quran/36" "/robots.txt" "/sitemap.xml"
  "/manifest.json" "/sw.js" "/offline.html"
  "/icons/og-image.png" "/icons/icon-512.png" "/quran-text/chunk-0.json"
  "/tafsir/chunk-0.json" "/translations/en/chunk-0.json"
  "/api"
)
FAIL=0
echo "=== اختبار المسارات ==="
for r in "${ROUTES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE$r")
  if [ "$code" = "200" ]; then
    echo "200  $r"
  else
    echo "FAIL($code)  $r"
    FAIL=1
  fi
done

echo "=== اختبار 404 ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/not-exist-page")
[ "$code" = "404" ] && echo "404 OK للمسار غير الموجود" || { echo "FAIL: غير موجود أعاد $code"; FAIL=1; }

echo "=== فحص محتوى الصفحات الجديدة ==="
check() {
  local path="$1"; shift
  local html=$(curl -s --max-time 10 "$BASE$path")
  for kw in "$@"; do
    if echo "$html" | grep -q "$kw"; then
      echo "OK  $path ← «$kw»"
    else
      echo "MISS  $path ← «$kw»"
      FAIL=1
    fi
  done
}
check "/hifdh" "الحفظ" "الختمة"
check "/after-prayer" "بعد كل صلاة" "اللهم أنت السلام"
check "/kids" "سور" "للصغار\|للأطفال\|ابدأ من هنا"
check "/ramadan" "رمضان"
check "/names" "الرَّحْمَن\|الرحمن"
check "/" "الصادق"

kill $SERVER_PID 2>/dev/null
sleep 1
[ $FAIL -eq 0 ] && echo "=== النتيجة: كل الاختبارات ناجحة ✅ ===" || echo "=== النتيجة: توجد إخفاقات ❌ ==="
exit $FAIL
