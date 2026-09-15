"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { createResourceDownload } from "@/lib/actions/download";

export default function DownloadButton({
  resourceId,
  buttonText,
}: {
  resourceId: string;
  buttonText: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const result = await createResourceDownload(resourceId);
      if (!result.url) {
        setError(result.error ?? "Download failed.");
        return;
      }
      window.location.assign(result.url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-teal-700 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      >
        <Download size={24} />
        {loading ? "جاري التجهيز..." : buttonText}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}
