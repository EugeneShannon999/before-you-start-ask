import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, X } from "lucide-react";
import { p1Messages, formatMsgTime } from "@/lib/messageMocks";

/**
 * P1 全局横条 - 单条轮播
 * 位置：AppTopBar 下方、主内容上方
 * 行为：5s 切换一条；点击跳转 /ai/policy?msgId=xxx
 * 备注：SP1 用 mock 数据；SP2 改为订阅 messages 表 P1 unread。
 */
export function P1Ticker() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || p1Messages.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % p1Messages.length);
    }, 5000);
    return () => clearInterval(t);
  }, [dismissed]);

  if (dismissed || p1Messages.length === 0) return null;
  const msg = p1Messages[idx];

  const handleClick = () => {
    navigate(`/ai/policy?msgId=${msg.id}`);
  };

  return (
    <div className="h-8 border-b bg-amber-50/60 dark:bg-amber-950/20 flex items-center px-4 gap-2 shrink-0 text-xs">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium text-[10px] shrink-0">
        <AlertTriangle className="h-3 w-3" />
        P1
      </span>

      <button
        onClick={handleClick}
        className="flex-1 min-w-0 flex items-center gap-2 text-left hover:text-primary transition-colors group"
      >
        <span className="truncate font-medium text-foreground/90">{msg.title}</span>
        <span className="text-muted-foreground shrink-0 hidden md:inline">· {msg.summary}</span>
        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-auto" />
      </button>

      <span className="text-muted-foreground shrink-0">{formatMsgTime(msg.publishedAt)}</span>

      {/* 轮播指示 */}
      <div className="flex items-center gap-0.5 shrink-0">
        {p1Messages.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === idx ? "w-3 bg-amber-500" : "w-1 bg-amber-500/30"
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="p-0.5 rounded hover:bg-amber-500/20 text-muted-foreground shrink-0"
        title="本次会话内不再提示"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
