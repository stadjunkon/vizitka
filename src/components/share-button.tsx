"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Copy, Check, X, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Ссылка скопирована");
    setTimeout(() => setCopied(false), 1500);
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* пользователь отменил — не ошибка */
      }
    } else {
      copy();
    }
  }

  function downloadQr() {
    const svg = document.getElementById("vizitka-qr");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download = "vizitka-qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-card px-5 py-2.5 text-sm font-medium shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(0,0,0,0.11)]"
      >
        <Share2 className="size-4" />
        Поделиться
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl bg-card p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Закрыть"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold tracking-tight">Поделиться визиткой</h2>
              <p className="text-xs text-muted-foreground">
                Наведите камеру на QR-код или скопируйте ссылку
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG id="vizitka-qr" value={url} size={180} level="M" marginSize={0} />
            </div>

            <div className="flex w-full flex-col gap-2">
              <Button onClick={nativeShare} className="w-full">
                <Share2 className="size-4" />
                Отправить
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copy} className="flex-1">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  Ссылка
                </Button>
                <Button variant="outline" onClick={downloadQr} className="flex-1">
                  <Download className="size-4" />
                  QR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
