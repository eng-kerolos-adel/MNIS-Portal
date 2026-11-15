"use client";

export function Sparkline({
  data,
  className,
  strokeClassName = "text-secondary",
  fill = true,
}: {
  data: number[];
  className?: string;
  strokeClassName?: string;
  fill?: boolean;
}) {
  if (data.length < 2) return null;
  const w = 240;
  const h = 64;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  const last = points[points.length - 1]!;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      {fill && <path d={area} className={strokeClassName} fill="currentColor" fillOpacity={0.1} />}
      <path d={path} className={strokeClassName} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={3.5} className={strokeClassName} fill="currentColor" />
    </svg>
  );
}
