import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink } from "lucide-react";
import { RECITERS } from "@/data/reciters";

export default function SourcesPage() {
  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">المصادر والتراخيص</h1>
        <p className="text-muted-foreground text-sm">
          نلتزم بالشفافية الكاملة في مصادر المحتوى الديني والتراخيص
        </p>
      </div>

      <Card className="p-4 bg-emerald-500/5 border-emerald-500/30">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-500">
              التزامنا
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              جميع المصادر الدينية موثقة ومُتحقَّق منها. لا نستخدم أي محتوى مجهول المصدر
              أو أحاديث ضعيفة أو مزورة. كل نص يذكر مصدره ومرجعه الصحيح.
            </p>
          </div>
        </div>
      </Card>

      {/* Quran sources */}
      <section>
        <h2 className="text-xl font-bold mb-3">القرآن الكريم — النص والصوت</h2>
        <Card className="p-4 space-y-3">
          <div>
            <p className="font-semibold text-sm">نص القرآن الكريم</p>
            <p className="text-xs text-muted-foreground mt-1">
              بيانات السور الـ 114 — أسماء السور، عدد الآيات، نوع الوحي، توزيع الأجزاء —
              من المراجع الإسلامية المعتمدة (مصحف المدينة النبوية، رواية حفص عن عاصم).
            </p>
          </div>
          <div className="border-t border-border pt-3">
            <p className="font-semibold text-sm">الصوت — Per-Ayah</p>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              المصدر: <a href="https://everyayah.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                EveryAyah.com <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              موقع EveryAyah.com يوفر ملفات صوتية لكل آية من القرآن الكريم لعدد من القراء،
              برخصة تسمح بالاستخدام المجاني. ملفات الصوت تُحمَّل مباشرة من الموقع إلى متصفحك.
            </p>
          </div>
          <div className="border-t border-border pt-3">
            <p className="font-semibold text-sm">الصوت — Surah-level</p>
            <p className="text-xs text-muted-foreground mt-1 mb-2">
              المصدر: <a href="https://quranicaudio.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                QuranicAudio.com <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              موقع QuranicAudio.com يوفر ملفات صوتية كاملة لكل سورة لعدد من القراء،
              ويسمح بالاستماع والتنزيل مجانًا.
            </p>
          </div>
        </Card>
      </section>

      {/* Reciters */}
      <section>
        <h2 className="text-xl font-bold mb-3">القراء المعتمدون</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {RECITERS.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{r.arabicName}</p>
                  <p className="text-xs text-muted-foreground">{r.name}</p>
                </div>
                {r.verified && (
                  <Badge variant="secondary" className="text-[10px]">
                    <CheckCircle className="h-3 w-3 ml-1" />
                    موثّق
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{r.style}</p>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                {r.source}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Adhkar source */}
      <section>
        <h2 className="text-xl font-bold mb-3">الأذكار</h2>
        <Card className="p-4 space-y-2">
          <p className="font-semibold text-sm">حصن المسلم</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            أذكار الصباح والمساء من كتاب "حصن المسلم" للشيخ سعيد بن علي القحطاني —
            من أشهر كتب الأذكار وأوسعها انتشارًا. كل ذكر مذكور مع مرجعه من الكتاب
            أو السنة (البخاري، مسلم، أبو داود، الترمذي، النسائي، ابن ماجه، أحمد).
          </p>
        </Card>
      </section>

      {/* Ruqyah source */}
      <section>
        <h2 className="text-xl font-bold mb-3">الرقية الشرعية</h2>
        <Card className="p-4 space-y-2">
          <p className="font-semibold text-sm">القرآن الكريم والسنة النبوية</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            نصوص الرقية مأخوذة من آيات القرآن الكريم (الفاتحة، آية الكرسي، أواخر البقرة،
            الإخلاص، الفلق، الناس، وآيات أخرى) والأدعية الثابتة عن النبي ﷺ في كتب الحديث
            الصحيحة. كل مقطع يذكر مصدره ومرجعه. لا نَعِد بأي شفاء مضمون — الرقية أسباب
            والشفاء من الله وحده.
          </p>
        </Card>
      </section>

      {/* Salawat source */}
      <section>
        <h2 className="text-xl font-bold mb-3">الصلاة على النبي ﷺ</h2>
        <Card className="p-4 space-y-2">
          <p className="font-semibold text-sm">صيغ من السنة الصحيحة</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            صيغ الصلاة على النبي ﷺ مأخوذة من صحيح البخاري ومسلم وسنن أبي داود والترمذي
            وموطأ مالك. لا ننسب فضلًا أو عددًا معينًا لصيغة إلا إذا كان المحتوى والمصدر
            يدعمان ذلك. الأهداف (10، 100، 500) أهداف اختيارية للممارسة الشخصية فقط.
          </p>
        </Card>
      </section>

      {/* Tafsir source */}
      <section>
        <h2 className="text-xl font-bold mb-3">التفسير الميسر</h2>
        <Card className="p-4 space-y-2">
          <p className="font-semibold text-sm">التفسير الميسر — مجمع الملك فهد لطباعة المصحف الشريف</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            تفسير ميسر لكل آية متاح داخل نص السورة (زر «التفسير» تحت كل آية).
            النص كامل ومخزَّن داخل التطبيق (6236 آية) — يعمل بدون إنترنت،
            وتم جلبه من واجهة Quran.com البرمجية المجانية (tafsir: ar-tafsir-muyassar).
          </p>
          <p className="text-[10px] text-muted-foreground">
            المصدر:{" "}
            <a href="https://quran.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Quran.com
            </a>{" "}
            — التفسير الميسر بإصدار مجمع الملك فهد
          </p>
        </Card>
      </section>

      {/* Translation source */}
      <section>
        <h2 className="text-xl font-bold mb-3">الترجمة الإنجليزية</h2>
        <Card className="p-4 space-y-2">
          <p className="font-semibold text-sm">Saheeh International — معاني القرآن بالإنجليزية</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ترجمة معاني القرآن إلى الإنجليزية متاحة اختياريًا داخل نص السورة
            (زر «الترجمة الإنجليزية» أعلى البطاقة)، مخزَّنة محليًا داخل التطبيق
            وتُجلب من واجهة Quran.com البرمجية المجانية. الاستخدام غير تجاري مع
            الإسناد الكامل للمصدر.
          </p>
          <p className="text-[10px] text-muted-foreground">
            المصدر:{" "}
            <a href="https://quran.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Quran.com
            </a>{" "}
            — Translation resource 20 (Saheeh International)
          </p>
        </Card>
      </section>

      {/* Kids & Ramadan content note */}
      <section>
        <h2 className="text-xl font-bold mb-3">قسم الأطفال ووضع رمضان</h2>
        <Card className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">
            الفوائد والأحاديث المذكورة في قسم «سور للصغار» و«وضع رمضان» تقتصر على
            الروايات المتفق عليها أو الصحيحة المعروفة (البخاري، مسلم، أبو داود، الترمذي)
            مع ذكر المصدر أسفل كل فائدة. وما لم يثبت لم تُنسب له فضيلة.
          </p>
        </Card>
      </section>

      {/* Prayer times source */}
      <section>
        <h2 className="text-xl font-bold mb-3">مواقيت الصلاة والقبلة</h2>
        <Card className="p-4 space-y-2">
          <p className="font-semibold text-sm">Aladhan.com — طريقة الهيئة المصرية العامة للمساحة</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            المواقيت تُجلب من واجهة Aladhan البرمجية المجانية وبطريقة الحساب
            «الهيئة المصرية العامة للمساحة» (method 5)، وتُخزَّن محليًا ليعمل القسم بدون إنترنت.
            اتجاه القبلة يُحسب رياضيًا داخل الجهاز (زاوية الدائرة العظمى إلى الكعبة المشرفة)
            بدون أي خدمة خارجية.
          </p>
          <p className="text-[10px] text-muted-foreground">
            المصدر:{" "}
            <a href="https://aladhan.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Aladhan.com
            </a>{" "}
            — مجاني وبلا مفاتيح
          </p>
        </Card>
      </section>

      <Card className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          منصة الصادق © 2026 — إعداد وتطوير علي محمد الصادق
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          نرحب بأي ملاحظات حول المصادر عبر صفحة الأسئلة الشائعة
        </p>
      </Card>
    </div>
  );
}
