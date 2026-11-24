"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCw, ShieldCheck, Upload, Video, VideoOff } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Button } from "@/components/ui/Button";

interface WebcamCaptureProps {
  value: string;
  onChange: (dataUrl: string) => void;
  verified: boolean;
  onVerifiedChange: (v: boolean) => void;
  required?: boolean;
}

export function WebcamCapture({
  value,
  onChange,
  verified,
  onVerifiedChange,
  required = true,
}: WebcamCaptureProps) {
  const { locale } = useLocale();
  const ar = locale === "ar";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [camError, setCamError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  async function startCamera(nextFacing: "user" | "environment" = facingMode) {
    setCamError(null);
    stopStream();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCamError(
        ar
          ? "المتصفح الحالي لا يدعم تشغيل الكاميرا المباشرة. استخدم زر رفع الصورة بالأسفل."
          : "Live webcam API is unavailable in this browser. Use the upload option below.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: nextFacing,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setStreaming(true);
    } catch {
      setCamError(
        ar
          ? "تعذر الوصول إلى الويب كام — يرجى السماح للمتصفح بصلاحية الكاميرا أو رفع صورة من الجهاز."
          : "Webcam access denied or no camera detected. Grant permission or upload an image file.",
      );
    }
  }

  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [streaming]);

  function drawCenterCroppedSquare(source: CanvasImageSource, srcW: number, srcH: number): string {
    const size = 360;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const side = Math.min(srcW, srcH);
    const sx = Math.max(0, (srcW - side) / 2);
    const sy = Math.max(0, (srcH - side) / 2);
    ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const dataUrl = drawCenterCroppedSquare(video, video.videoWidth, video.videoHeight);
    if (dataUrl) {
      onChange(dataUrl);
      onVerifiedChange(false);
      stopStream();
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setCamError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const compressed = drawCenterCroppedSquare(img, img.naturalWidth, img.naturalHeight);
        if (compressed) {
          onChange(compressed);
          onVerifiedChange(false);
          stopStream();
        }
      };
      img.src = String(reader.result ?? "");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-primary flex items-center gap-1.5">
            <Camera className="w-4 h-4" />
            {ar
              ? "التصوير المباشر بالويب كام والتحقق من صورة بطاقة الرقم القومي"
              : "Live Webcam Capture & National ID Photo Match"}
            {required && <span className="text-error">*</span>}
          </p>
          <p className="text-[11px] text-on-surface-variant mt-0.5">
            {ar
              ? "يتم التقاط صورة حية للمواطن أمام موظف الاستقبال ومطابقتها بصورة بطاقة الرقم القومي لمنع أي صور خاطئة."
              : "Capture citizen's live portrait at reception and verify it matches their physical National ID card."}
          </p>
        </div>

        {value && !streaming && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => void startCamera(facingMode)}
          >
            {ar ? "إعادة التصوير بالويب كام" : "Retake with Webcam"}
          </Button>
        )}
      </div>

      {camError && (
        <div className="rounded-lg border border-error/30 bg-error/10 p-2.5 text-xs text-error font-semibold">
          {camError}
        </div>
      )}

      {streaming ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-full max-w-xs aspect-square overflow-hidden rounded-2xl border-2 border-primary bg-black shadow-level-2">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-4 rounded-full border-2 border-dashed border-emerald-400/80" />
            <span className="pointer-events-none absolute bottom-2 inset-x-0 text-center text-[10px] font-bold text-white bg-black/55 py-0.5">
              {ar ? "ضع وجه المواطن داخل الإطار الدائري" : "Center face inside the guide ring"}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              icon={<Camera className="w-4 h-4" />}
              onClick={captureFrame}
            >
              {ar ? "التقاط الصورة الآن" : "Capture Photo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                const next = facingMode === "user" ? "environment" : "user";
                setFacingMode(next);
                void startCamera(next);
              }}
            >
              {ar ? "تبديل الكاميرا" : "Switch Camera"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              icon={<VideoOff className="w-4 h-4" />}
              onClick={stopStream}
            >
              {ar ? "إغلاق الكاميرا" : "Close"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {value ? (
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-500 shadow-level-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Captured citizen" className="h-full w-full object-cover" />
              <span className="absolute bottom-1 end-1 rounded-full bg-emerald-600 p-1 text-white shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
          ) : (
            <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant">
              <Camera className="h-7 w-7 opacity-45" />
              <span className="mt-1 text-[10px] font-semibold">
                {ar ? "لا توجد صورة بعد" : "No photo yet"}
              </span>
            </div>
          )}

          <div className="flex flex-1 flex-col gap-2 w-full">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                icon={<Video className="w-4 h-4" />}
                onClick={() => void startCamera(facingMode)}
              >
                {ar ? "تشغيل الويب كام وتصوير المواطن" : "Open Live Webcam"}
              </Button>
              <Button
                type="button"
                variant="outline"
                icon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {ar ? "أو رفع / مسح صورة من الجهاز" : "Or Upload / Scan Photo"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {value && (
              <label className="mt-1 flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs font-semibold text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-emerald-600 shrink-0"
                  checked={verified}
                  onChange={(e) => onVerifiedChange(e.target.checked)}
                />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  {ar
                    ? "تمت معاينة ومطابقة هذه الصورة الملتقطة مع صورة المواطن في بطاقة الرقم القومي الأصلية."
                    : "Confirmed: captured live portrait matches the citizen's physical National ID card photo."}
                </span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
