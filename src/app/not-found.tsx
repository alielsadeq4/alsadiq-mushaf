import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="text-9xl font-bold text-primary/20 mb-4 quran-text">٤٠٤</div>
      <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-md">
        عذرًا، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يمكنك العودة للرئيسية.
      </p>
      <Button asChild className="bg-primary hover:bg-primary/90">
        <Link href="/">
          <Home className="h-4 w-4 ml-2" />
          العودة للرئيسية
        </Link>
      </Button>
    </div>
  );
}
