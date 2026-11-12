export default function AboutPage() {
  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 pattern-arabesque opacity-20" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">حول المشروع</h1>
          <p className="text-primary-foreground/80 text-sm">
            منصة الصادق — رؤية وأهداف
          </p>
        </div>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
        <div className="space-y-3">
          <h2 className="text-xl font-bold">الرؤية</h2>
          <p className="text-muted-foreground leading-relaxed">
            نسعى إلى توفير منصة استماع إسلامية صوتية فاخرة، تجمع بين القرآن الكريم بأصوات نخبة
            من القراء، والرقية الشرعية الموثقة من الكتاب والسنة، وأذكار الصباح والمساء،
            والصلاة على النبي ﷺ — في تجربة استخدام هادئة وعصرية موجهة أساسًا للهاتف.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">الأهداف</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• توفير محتوى إسلامي صوتي موثق ومجاني للوصول السهل.</li>
            <li>• تجربة استخدام فاخرة وسلسة على الهاتف والكمبيوتر.</li>
            <li>• العمل دون إنترنت للمحتوى المنزّل.</li>
            <li>• خصوصية كاملة — لا نجمع أي بيانات شخصية.</li>
            <li>• قابلية التوسع مستقبلًا دون إعادة البناء.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">عن المطوّر</h2>
          <p className="text-muted-foreground leading-relaxed">
            علي محمد الصادق — مطوّر ومؤسس منصة الصادق. يحرص على أن تكون المنصة منتجًا
            حقيقيًا جاهزًا للإنتاج والنشر، وليست مجرد نموذج تجريبي. يتم التحقق من كل مصدر
            ديني قبل اعتماده، ولا تُستخدم بيانات وهمية أو أحاديث ضعيفة.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">التقنية</h2>
          <p className="text-muted-foreground leading-relaxed">
            بُنيت المنصة باستخدام أحدث التقنيات: Next.js مع TypeScript و Tailwind CSS،
            مع دعم PWA للعمل كتطبيق على الهاتف، وService Worker للعمل دون إنترنت.
            جميع البيانات محفوظة محليًا على جهاز المستخدم فقط.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-bold">التواصل</h2>
          <p className="text-muted-foreground leading-relaxed">
            للملاحظات والاقتراحات، يمكن التواصل عبر صفحة الأسئلة الشائعة. نسعى دائمًا
            لتطوير المنصة وإضافة ميزات جديدة تحقق تجربة أفضل للمستخدم.
          </p>
        </div>
      </div>
    </div>
  );
}
