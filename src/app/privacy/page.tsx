import { Card } from "@/components/ui/card";
import { Lock, Database, Eye, Trash2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">سياسة الخصوصية</h1>
        <p className="text-muted-foreground text-sm">آخر تحديث: 2026</p>
      </div>

      <Card className="p-4 bg-emerald-500/5 border-emerald-500/30">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-500">
              خصوصية أولًا
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              منصة الصادق لا تجمع أي بيانات شخصية. كل ما تفعله يبقى على جهازك.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <section>
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            البيانات المحفوظة محليًا
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            تحفظ المنصة البيانات التالية على جهازك فقط (localStorage و IndexedDB):
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• المفضلة — العناصر التي اخترت حفظها.</li>
            <li>• قائمة الانتظار — الطابور الحالي.</li>
            <li>• سجل الاستماع — آخر المحتويات التي استمعت إليها.</li>
            <li>• موضع الاستماع — لإكمال الاستماع من حيث توقفت.</li>
            <li>• الإعدادات — القارئ، السرعة، المظهر.</li>
            <li>• الإحصائيات — وقت الاستماع اليومي والأسبوعي.</li>
            <li>• التنزيلات — الملفات الصوتية المنزّلة.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            ما الذي لا نجمعه
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• لا نجمع معلوماتك الشخصية (الاسم، البريد، الهاتف).</li>
            <li>• لا نستخدم ملفات تعريف الارتباط للتتبع.</li>
            <li>• لا نرسل بياناتك لأي خادم.</li>
            <li>• لا نستخدم أدوات تحليلية تتبع المستخدم.</li>
            <li>• لا نبيع بياناتك لأي طرف ثالث.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-primary" />
            التحكم في بياناتك
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            يمكنك في أي وقت مسح بياناتك المحلية من صفحة الإعدادات. يمكنك مسح سجل الاستماع
            فقط، أو مسح جميع البيانات دفعة واحدة. لا يمكن استرجاع البيانات بعد مسحها.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">مصادر الصوت</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            تُحمَّل ملفات الصوت من مصادر خارجية معتمدة (EveryAyah.com و QuranicAudio.com)
            مباشرةً إلى متصفحك. لا تمر عبر خوادمنا. عند تنزيل محتوى للعمل دون إنترنت،
            يُحفظ على جهازك فقط.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">الإشعارات</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            الإشعارات اختيارية وتتطلب إذنك الصريح. لا نطلب الإذن إلا عند اختيارك تفعيلها.
            تعمل الإشعارات محليًا على جهازك فقط.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">التغييرات على السياسة</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            قد نُحدّث هذه السياسة مستقبلًا. أي تغييرات ستُنشر على هذه الصفحة. نلتزم
            دائمًا بمبدأ الخصوصية أولًا.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">التواصل</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            لأي استفسار حول الخصوصية، يمكنك مراجعة صفحة الأسئلة الشائعة. نحن ملتزمون
            بشفافية كاملة في تعاملنا مع بياناتك — أو في الواقع، عدم تعاملنا معها.
          </p>
        </section>
      </div>

      <Card className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          منصة الصادق © 2026 — إعداد وتطوير علي محمد الصادق
        </p>
      </Card>
    </div>
  );
}
