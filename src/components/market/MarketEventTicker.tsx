import { useState } from "react";
import { AlertTriangle, FileText, Megaphone, ChevronRight, Pause, Play } from "lucide-react";
import { MarketEvent, marketEvents } from "@/lib/marketMocks";
import { useEffect, useRef } from "react";

const levelStyles: Record<MarketEvent["level"], string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  info: "bg-secondary text-foreground border-border",
};

const categoryIcon = (e: MarketEvent) => {
  if (e.category === "异常" || e.category === "预警") return AlertTriangle;
  if (e.category === "公告") return Megaphone;
  return FileText;
};

export function MarketEventTicker({ events = marketEvents }: { events?: MarketEvent[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);

  // 简单的横向自动滚动
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    const step = () => {
      const el = trackRef.current;
      if (el) {
        offsetRef.current -= 0.3;
        const max = el.scrollWidth / 2;
        if (-offsetRef.current >= max) offsetRef.current = 0;
        el.style.transform = `translateX(${offsetRef.current}px)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  // 复制一份用于无缝循环
  const looped = [...events, ...events];
  const open = events.find((e) => e.id === openId);

  return (
    <div className="rounded-lg shadow-notion bg-card border overflow-hidden">
      <div className="flex items-stretch">
        <div className="flex items-center gap-1.5 px-3 bg-secondary text-[11px] font-medium border-r shrink-0">
          <Megaphone className="h-3 w-3" />
          市场消息
        </div>
        <div
          className="flex-1 overflow-hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className="flex gap-2 py-1.5 px-2 whitespace-nowrap will-change-transform"
            style={{ transform: "translateX(0)" }}
          >
            {looped.map((e, i) => {
              const Icon = categoryIcon(e);
              return (
                <button
                  key={`${e.id}-${i}`}
                  onClick={() => setOpenId(e.id)}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] hover:opacity-90 ${levelStyles[e.level]}`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="font-medium">[{e.category}]</span>
                  <span className="max-w-[420px] truncate">{e.title}</span>
                  <span className="opacity-60">· {e.time}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="px-2 text-muted-foreground hover:bg-secondary border-l text-[10px] flex items-center gap-1 shrink-0"
          title={paused ? "继续滚动" : "暂停滚动"}
        >
          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-secondary/40 px-3 py-2 flex items-start gap-2">
          <div className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${levelStyles[open.level]}`}>
            {open.category}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">{open.title}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              {open.detail}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {open.source ? `${open.source} · ` : ""}{open.time}
            </div>
          </div>
          <button
            className="text-[10px] text-primary inline-flex items-center hover:underline"
            onClick={() => setOpenId(null)}
          >
            收起 <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
