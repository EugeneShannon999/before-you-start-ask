import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Brain,
  History,
  Send,
  FileText,
  ExternalLink,
  CornerDownRight,
  Sparkles,
  Construction,
  CalendarRange,
  AlertOctagon,
  AlertTriangle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { p0Messages, p1Messages, p2QuarterSummary, formatMsgTime } from "@/lib/messageMocks";

type Capability = "policy" | "review";

interface CapabilityDef {
  key: Capability;
  name: string;
  icon: typeof Brain;
  desc: string;
  placeholder?: boolean;
}

const capabilities: CapabilityDef[] = [
  { key: "policy", name: "政策 AI", icon: Brain, desc: "解读最新政策与影响" },
  { key: "review", name: "复盘助手", icon: History, desc: "复盘某日交易与价差成因", placeholder: true },
];

interface PolicyCard {
  id: string;
  title: string;
  oneLine: string;
  affects: string;
  effectiveTime: string;
  source: string;
  evidence: string;
}

const policyCards: PolicyCard[] = [
  {
    id: "1",
    title: "安徽 2025-07 结算规则调整",
    oneLine: "中午 8 小时下偏差考核阈值由 55% 调整为 50%，对光伏富集时段不利。",
    affects: "省内现货售电主体、光伏占比 >30% 的零售套餐",
    effectiveTime: "2025-07-20 起",
    source: "安徽省能源局 〔2025〕 47 号",
    evidence: "原文 §3.2 / 附件 1 表 2",
  },
  {
    id: "2",
    title: "国家发改委：全国统一电力市场征求意见",
    oneLine: "明确跨省现货衔接、辅助服务分摊原则，长期影响零售报价模型。",
    affects: "全国所有售电公司、虚拟电厂运营方",
    effectiveTime: "意见反馈截止 2025-08-30",
    source: "国家发改委 价格司",
    evidence: "征求意见稿 §5、§7",
  },
];

const evidencePanel = {
  excerpt:
    "「中午时段（10:00-18:00）下偏差考核比例由 55% 调整为 50%。光伏出力高峰期间，售电主体应加强中长期分时签约与现货申报曲线的一致性管理……」",
  source: "安徽省能源局 〔2025〕 47 号 §3.2",
  related: [
    "安徽 2025 年中长期分时交易实施细则",
    "7-14 实时电价偏差周报",
    "套餐 PKG-A 光伏占比 32%",
  ],
};

export default function PolicyCenter() {
  const [active, setActive] = useState<Capability>("policy");
  const [input, setInput] = useState("");
  const [searchParams] = useSearchParams();
  const incomingMsgId = searchParams.get("msgId");

  // 由 P0 弹窗 / P1 横条跳转进入时，定位对应消息并预填 prompt
  // 备注：SP2 接入后端时改为按 msgId 拉取完整解析记录并自动开启会话
  const incomingMsg =
    p0Messages.find((m) => m.id === incomingMsgId) ||
    p1Messages.find((m) => m.id === incomingMsgId);

  useEffect(() => {
    if (incomingMsg) {
      setActive("policy");
      setInput(`请深入解读这条${incomingMsg.level}消息：${incomingMsg.title}`);
    }
  }, [incomingMsg]);

  const triggerQuarterSummary = () => {
    setInput(
      `请整合 ${p2QuarterSummary.quarter} 季度的 ${p2QuarterSummary.count} 条 P2 市场要闻，重点覆盖：${p2QuarterSummary.topics.join("、")}`
    );
  };

  const current = capabilities.find((c) => c.key === active)!;

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left: capability list */}
      <aside className="w-56 border-r bg-muted/30 flex flex-col shrink-0">
        <div className="p-2.5 border-b">
          <button className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />
            新建会话
          </button>
        </div>
        <div className="p-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
            AI 能力
          </p>
          {capabilities.map((c) => (
            <button
              key={c.key}
              onClick={() => !c.placeholder && setActive(c.key)}
              disabled={c.placeholder}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                active === c.key
                  ? "bg-secondary text-primary font-medium"
                  : c.placeholder
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "hover:bg-secondary/60 text-foreground/80"
              }`}
            >
              <c.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs flex-1 truncate">{c.name}</span>
              {c.placeholder && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
                  占位
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-2 mt-2 border-t flex-1 overflow-auto">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            最近会话
          </p>
          {recentSessions[active].map((s) => (
            <button
              key={s.id}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm rounded-md hover:bg-secondary/60 text-left"
            >
              <span className="truncate text-foreground/80">{s.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{s.ts}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Center: conversation */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-12 border-b flex items-center px-5 gap-2 shrink-0">
          <current.icon className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">{current.name}</h1>
          <span className="text-xs text-muted-foreground ml-2">· {current.desc}</span>
        </header>

        <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
          {/* Greeting */}
          <div className="max-w-2xl mx-auto text-center pt-4 pb-2">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              你好，我是「{current.name}」。基于最近 30 天的政策、出清和你的套餐数据回答。
            </p>

            {/* P2 季度整合入口 - 仅 policy 能力下展示 */}
            {active === "policy" && !incomingMsg && (
              <button
                onClick={triggerQuarterSummary}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card hover:bg-secondary text-xs text-foreground/80 hover:text-foreground transition-colors shadow-notion"
              >
                <CalendarRange className="h-3.5 w-3.5 text-primary" />
                <span>查看本季度市场要闻整合</span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                  P2 · {p2QuarterSummary.quarter} · {p2QuarterSummary.count} 条
                </span>
              </button>
            )}
          </div>

          {/* 入站消息上下文卡片 - 由 P0 弹窗 / P1 横条跳转进入时展示 */}
          {incomingMsg && active === "policy" && (
            <div className="max-w-2xl mx-auto">
              <div className={`rounded-lg border p-4 shadow-notion ${
                incomingMsg.level === "P0"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-primary/30 bg-primary/5"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    incomingMsg.level === "P0"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/15 text-primary"
                  }`}>
                    {incomingMsg.level === "P0" ? (
                      <AlertOctagon className="h-3 w-3" />
                    ) : (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {incomingMsg.level} 消息
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatMsgTime(incomingMsg.publishedAt)} · {incomingMsg.source}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-1">{incomingMsg.title}</h3>
                <p className="text-xs text-foreground/80 leading-relaxed">{incomingMsg.summary}</p>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  AI 已对该消息预先解析（mock），下方对话框已预填提问，可直接发送。
                </p>
              </div>
            </div>
          )}

          {/* Policy cards as conversation messages */}
          {active === "policy" &&
            policyCards.map((p) => (
              <div key={p.id} className="max-w-2xl mx-auto">
                <div className="rounded-lg border bg-card shadow-notion p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <h3 className="text-sm font-semibold flex-1">{p.title}</h3>
                  </div>
                  <p className="text-sm text-foreground/90 mb-3 leading-relaxed">{p.oneLine}</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
                    <div>
                      <dt className="text-muted-foreground">影响对象</dt>
                      <dd className="text-foreground/80 mt-0.5">{p.affects}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">影响时间</dt>
                      <dd className="text-foreground/80 mt-0.5">{p.effectiveTime}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">来源</dt>
                      <dd className="text-foreground/80 mt-0.5">{p.source}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">证据定位</dt>
                      <dd className="text-foreground/80 mt-0.5">{p.evidence}</dd>
                    </div>
                  </dl>
                  <div className="flex gap-2 pt-2 border-t">
                    <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary">
                      查看解读
                    </button>
                    <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> 查看原文
                    </button>
                    <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary flex items-center gap-1">
                      <CornerDownRight className="h-3 w-3" /> 追问
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {active === "review" && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-lg border bg-card shadow-notion p-12 text-center">
                <Construction className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-base font-semibold mb-2">🚧 复盘助手开发中</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  该能力将在后续版本中上线
                </p>
                <p className="text-xs text-muted-foreground">
                  预计包含：交易日复盘、价差成因归因、异常时段定位、与算法预测对比
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t bg-card p-4 shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-lg border bg-background focus-within:border-primary transition-colors">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="问政策、问市场、问某天价差为什么变大…"
                className="border-0 resize-none min-h-[60px] pr-12 focus-visible:ring-0"
              />
              <button className="absolute bottom-2 right-2 p-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
              AI 回答可能存在偏差，关键决策请核对原文与实时数据。
            </p>
          </div>
        </div>
      </main>

      {/* Right: evidence panel */}
      <aside className="w-72 border-l bg-card/30 shrink-0 overflow-auto">
        <div className="p-4 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            证据与来源
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">政策原文片段</p>
            <div className="rounded-md border bg-card p-3">
              <p className="text-xs leading-relaxed text-foreground/85 italic">
                "{evidencePanel.excerpt}"
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">— {evidencePanel.source}</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">关联公告 / 数据</p>
            <div className="space-y-1">
              {evidencePanel.related.map((r, i) => (
                <button
                  key={i}
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded-md hover:bg-secondary text-foreground/80 flex items-center gap-1.5"
                >
                  <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{r}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button className="flex-1 text-xs py-1.5 rounded border hover:bg-secondary flex items-center justify-center gap-1">
              <ExternalLink className="h-3 w-3" /> 查看原文
            </button>
            <button className="flex-1 text-xs py-1.5 rounded border hover:bg-secondary flex items-center justify-center gap-1">
              <CornerDownRight className="h-3 w-3" /> 继续追问
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
