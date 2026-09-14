"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { incrementDownload } from "@/lib/actions/download";

export default function DownloadButton({ 
  resourceId, 
  fileUrl, 
  buttonText 
}: { 
  resourceId: string; 
  fileUrl: string;
  buttonText: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await incrementDownload(resourceId);
      
      window.open(fileUrl, "_blank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-70 transition-all"
    >
      <Download size={24} className={loading ? "animate-bounce" : ""} />
      {loading ? "جاري التجهيز..." : buttonText}
    </button>
  );
}