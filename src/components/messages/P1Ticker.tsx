import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, X } from "lucide-react";
import { p1Messages, formatMsgTime } from "@/lib/messageMocks";
import { useProvince } from "@/contexts/ProvinceContext";

/**
 * P1 全局横条 - 单条轮播
 * 位置：AppTopBar 下方、主内容上方
 * 行为：
 *   - 5s 切换一条；点击跳转 /ai/policy?msgId=xxx
 *   - 时间在最前面（与消息列表口径一致）
 *   - ⚠ 仅展示「当前看板省份 + 全国级 (province==='all')」的 P1
 *   - 最多展示 5 条（mock 已限制；后端口径同样按 limit 5 拉取）
 *   - P0 不区分省份，由 P0Alert 单独广播
 * SP2：订阅 messages 表 level='P1' AND (province=$current OR province='all') ORDER BY created_at DESC LIMIT 5
 */
interface P1TickerProps {
  compact?: boolean;
}

export function P1Ticker({ compact = false }: P1TickerProps) {
  const navigate = useNavigate();
  const { province } = useProvince();
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // 按当前省份过滤 + 取最新 5 条
  const visible = useMemo(
    () =>
      p1Messages
        .filter((m) => m.province === "all" || m.province === province)
        .slice(0, 5),
    [province]
  );

  // 切省后重置索引
  useEffect(() => {
    setIdx(0);
  }, [province]);

  useEffect(() => {
    if (dismissed || visible.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % visible.length);
    }, 5000);
    return () => clearInterval(t);
  }, [dismissed, visible.length]);

  if (dismissed || visible.length === 0) return null;
  const msg = visible[Math.min(idx, visible.length - 1)];

  const handleClick = () => {
    navigate(`/ai/policy?msgId=${msg.id}`);
  };

  return (
    <div
      className={compact
        ? "h-8 flex items-center gap-2 shrink-0 text-xs min-w-0"
        : "h-8 border-b bg-secondary/40 flex items-center px-4 gap-2 shrink-0 text-xs"}
    >
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium text-[10px] shrink-0">
        <AlertTriangle className="h-3 w-3" />
        P1
      </span>

      {/* 时间在最前 */}
      <span className="text-muted-foreground shrink-0 tabular-nums">
        {formatMsgTime(msg.publishedAt)}
      </span>

      <button
        onClick={handleClick}
        className="flex-1 min-w-0 flex items-center gap-2 text-left hover:text-primary transition-colors group"
      >
        <span className="truncate font-medium text-foreground/90">{msg.title}</span>
        <span className="text-muted-foreground shrink-0 hidden xl:inline">· {msg.summary}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-auto" />
      </button>

      {/* 轮播指示 */}
      <div className="flex items-center gap-0.5 shrink-0">
        {visible.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === idx ? "w-3 bg-primary" : "w-1 bg-primary/30"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-0.5 rounded hover:bg-secondary text-muted-foreground shrink-0"
        title="本次会话内不再提示"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
