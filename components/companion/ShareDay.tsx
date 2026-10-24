"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
export default function ShareDay({
  name,
  completed,
  minutes,
  date,
}: {
  name: string;
  completed: number;
  minutes: number;
  date: string;
}) {
  const t = useTranslations("Companion");
  const ar = useLocale() === "ar";
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function share() {
    setBusy(true);
    setFailed(false);
    try {
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error();
      ctx.fillStyle = "#f6f5ef";
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.fillStyle = "#143c35";
      ctx.beginPath();
      ctx.roundRect(50, 50, 980, 1250, 52);
      ctx.fill();
      ctx.fillStyle = "#cbf4c8";
      ctx.beginPath();
      ctx.arc(970, 150, 210, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#143c35";
      ctx.font = "bold 44px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Rafeeq.", 910, 150);
      const family = getComputedStyle(document.body).fontFamily;
      ctx.direction = ar ? "rtl" : "ltr";
      ctx.textAlign = ar ? "right" : "left";
      const x = ar ? 950 : 130;
      ctx.fillStyle = "#b9d7cb";
      ctx.font = `400 32px ${family}`;
      ctx.fillText(date, x, 335);
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 67px ${family}`;
      ctx.fillText(t("posterTitle"), x, 465, 820);
      ctx.font = `400 38px ${family}`;
      ctx.fillStyle = "#d5e9df";
      ctx.fillText(name || t("posterName"), x, 550, 820);
      ctx.fillStyle = "#cbf4c8";
      ctx.font = `700 135px ${family}`;
      ctx.fillText(String(completed), x, 780);
      ctx.font = `400 38px ${family}`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(t("posterSteps"), x, 845);
      ctx.fillStyle = "#e9c6a4";
      ctx.font = `700 115px ${family}`;
      ctx.fillText(String(minutes), x, 1030);
      ctx.font = `400 38px ${family}`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(t("posterMinutes"), x, 1095);
      ctx.fillStyle = "#b9d7cb";
      ctx.font = `400 29px ${family}`;
      ctx.fillText(t("posterFooter"), x, 1210, 820);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(Error())),
          "image/png",
        ),
      );
      const file = new File([blob], `rafeeq-${date}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: t("posterTitle") });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={share}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-teal-500"
      >
        <Share2 size={15} aria-hidden="true" />
        {t(busy ? "preparingPoster" : "shareDay")}
      </button>
      {failed && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {t("posterError")}
        </p>
      )}
    </div>
  );
}
