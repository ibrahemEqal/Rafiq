import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Copy, MessageCircle, MapPin, User, Plus } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function BooksPage() {
  const t = await getTranslations("Books");
  const supabase = await createClient();

  // جلب الكتب المتاحة فقط، مع بيانات الكلية والناشر
  const { data: books } = await supabase
    .from("books")
    .select(`
      *,
      colleges (name_ar, name_en)
    `)
    .eq("status", "available")
    .order("created_at", { ascending: false });

  // دالة لتنظيف رقم الواتساب وتهيئته للرابط
  const formatWhatsapp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `https://wa.me/${cleaned}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* الترويسة الأنيقة */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-slate-500 text-lg">{t("subtitle")}</p>
          </div>
          
          <Link 
            href="/books/new" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            {t("addNew")}
          </Link>
        </div>

        {/* شبكة البطاقات (بدون صور لسرعة فائقة) */}
        {books && books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
              >
                {/* نوع العنصر (كتاب أو سلايدات) */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`p-3 rounded-2xl ${item.type === 'book' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                    {item.type === 'book' ? <BookOpen size={24} /> : <Copy size={24} />}
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${item.type === 'book' ? 'text-indigo-600' : 'text-orange-600'}`}>
                    {item.type === 'book' ? t("bookType") : t("slidesType")}
                  </span>
                </div>

                {/* عنوان العنصر ووصفه */}
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* مساحة مرنة لدفع العناصر السفلية للأسفل */}
                <div className="flex-1"></div>

                {/* معلومات الكلية */}
                <div className="space-y-3 mb-6 pt-6 border-t border-slate-50">
                  {item.colleges && (
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <MapPin size={16} className="text-slate-400" />
                      <span>{item.colleges.name_ar}</span>
                    </div>
                  )}
                </div>

                {/* زر الواتساب الفخم */}
                <a 
                  href={formatWhatsapp(item.whatsapp_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white font-bold rounded-xl transition-colors"
                >
                  <MessageCircle size={20} />
                  {t("contactWhatsapp")}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-600">{t("noResults")}</h3>
          </div>
        )}

      </div>
    </div>
  );
}