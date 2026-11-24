
## T63 — 2026-11-24 — ممر 4 (الموت الترانزيدي) بقرار CEO بعد «انطلق في الباقي»
1. **إعادة استنساخ**: إعادة تدوير البيئة فقدت مجلد الاستنساخ (العمل كان آمنًا في 8d7540d على GitHub — هذا هو عائد نظام الدفع بعد كل التزام) + الهوية ضُبطت قبل أول commit (درس ممر 3) + التوكنات الجديدة محفوظة في config/deploy.env (+نسخة download) وتحقق عملها.
2. **الماسح على الشجرة النظيفة** (scripts/t63_deadcode.py): مرشحو pass-3 اختفوا وظهر 8 مرشحين جدد = ملفات تُرملت بحذف مستهلكيها (الموت الترانزيدي): toggle/tooltip/skeleton/table/collapsible في mushaf/ui + toggle/tooltip الجذريان + lib/mushaf/hooks/use-mobile — + hooks/use-mobile الجذري (الماسح خدعه ذكر وثائقية في worklog؛ الفحص الدقيق أثبت صفر استيراد).
3. **فحص أدلة صارم** (scripts/t63_pass4_sweep.py — نمط الاستيراد فقط): 9/9 صفر إشارات.
4. **تعداد deps شامل** (configs/styles داخل النطاق، package.json/locks مستثناة): 12 صفرًا مطلقًا + tooltip/collapsible/vaul بأدلة الاستيراد الدقيق (إشارات vaul كلها كانت كلمة vault في تعليقات!) + postcss dedup من dependencies = **16 إزالة**. بقيت بالأدلة: react-toggle (qayma/ui/toggle.tsx حي!) + react-slider (mushaf/ui/slider.tsx حي) + react-scroll-area (jalasat+pos) + أدوات ضمنية (@types-*/commitlint/eslintrc/vitest-ui — تُستخدم عبر hooks/skripts/tsc لا كنص مصدري).
5. **منطقة POS UI العميقة (بند ب)**: صفر مرشحين — نظيفة تمامًا (كانت مغطاة في ممر 3).
6. **البوابات**: vitest 229 ملفًا/4,526 اختبارًا (خط الأساس بالضبط) ✓ · eslint صفر أخطاء (تحذيرات 3,009→2,999 — 10 كانت في المحذوفات) ✓ · tsc 180 (خط الأساس بالضبط) ✓ · lock ‑2,213 سطرًا صافيًا (أشجار radix المتيمة).
