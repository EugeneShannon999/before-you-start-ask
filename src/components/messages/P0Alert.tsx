import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertOctagon, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { p0Messages, formatMsgTime } from "@/lib/messageMocks";

/**
 * P0 紧急消息 - 站内弹窗（SP1 原型）
 * 行为：进入应用 1.5s 后弹出最新一条 P0；用户确认后本会话不再弹。
 *
 * SP2 升级路径：
 *   - 接入 Web Push (Service Worker + VAPID) 推浏览器系统通知
 *   - 接入移动端推送通道（待定：APNs / FCM / 短信兜底）
 *   - 关键时段（如开市/收市前 15min）强制 P0 横幅常驻
 */
const STORAGE_KEY = "p0_dismissed_session";

export function P0Alert() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const msg = p0Messages[0];

  useEffect(() => {
    if (!msg) return;
    if (sessionStorage.getItem(STORAGE_KEY) === msg.id) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, msg.id);
    setOpen(false);
  };

  const goToAnalysis = () => {
    dismiss();
    navigate(`/ai/policy?msgId=${msg.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="max-w-md border-destructive/40">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
              <AlertOctagon className="h-3.5 w-3.5" />
              P0 紧急
            </span>
            <span className="text-xs text-muted-foreground">{formatMsgTime(msg.publishedAt)}</span>
          </div>
          <DialogTitle className="text-base">{msg.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {msg.summary}
          </DialogDescription>
        </DialogHeader>

        <div className="text-xs text-muted-foreground border-l-2 border-muted pl-2.5 py-0.5">
          来源：{msg.source}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={dismiss}>
            稍后查看
          </Button>
          <Button size="sm" onClick={goToAnalysis} className="gap-1">
            查看 AI 解读
            <ExternalLink className="h-3 w-3" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
