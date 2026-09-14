"use client";

import { useState } from "react";
import { markBookAsTaken } from "@/lib/actions/books";
import { CheckCircle } from "lucide-react";

export default function MarkAsTakenButton({ bookId, label }: { bookId: string, label: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!confirm("هل أنت متأكد أنك قمت بتسليم هذا العنصر؟ لن يظهر في البحث بعد الآن.")) return;
    
    setLoading(true);
    await markBookAsTaken(bookId);
    setLoading(false);
  };

  return (
    <button 
      onClick={handleUpdate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-bold text-sm rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors mt-4 w-full justify-center"
    >
      <CheckCircle size={18} />
      {loading ? "جاري التحديث..." : label}
    </button>
  );
}