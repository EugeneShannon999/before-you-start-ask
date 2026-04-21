import { useState } from "react";
import {
  Brain,
  History,
  Send,
  FileText,
  ExternalLink,
  CornerDownRight,
  Sparkles,
  Plus,
  Construction,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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

const recentSessions: Record<Capability, { id: string; title: string; ts: string }[]> = {
  policy: [
    { id: "p1", title: "7月安徽偏差考核新规解读", ts: "10:32" },
    { id: "p2", title: "全国统一电力市场征求意见影响", ts: "昨天" },
    { id: "p3", title: "广东现货分段考核机制", ts: "2天前" },
  ],
  review: [],
};

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

  const current = capabilities.find((c) => c.key === active)!;

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left: capability list */}
      <aside className="w-56 border-r bg-card/30 flex flex-col shrink-0">
        <div className="p-3 border-b">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            新建会话
          </button>
        </div>
        <div className="p-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            AI 能力
          </p>
          {capabilities.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors ${
                active === c.key
                  ? "bg-secondary text-primary"
                  : "hover:bg-secondary/60 text-foreground"
              }`}
            >
              <c.icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight flex items-center gap-1.5">
                  {c.name}
                  {c.placeholder && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground font-normal">
                      占位
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                  {c.desc}
                </p>
              </div>
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
          </div>

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

          {active !== "policy" && (
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="rounded-lg border bg-card shadow-notion p-4">
                <p className="text-xs text-muted-foreground mb-1.5">示例问答</p>
                <p className="text-sm font-medium mb-2">
                  {active === "qa" && "今天 18:00-20:00 实时价差为什么变大？"}
                  {active === "chart" && "请解读今天的日前出清曲线"}
                  {active === "review" && "复盘 7-14 全天交易表现"}
                </p>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  根据当前数据：晚高峰时段总负荷达 4850 MW，新能源出力快速回落 (-65%)，
                  竞价空间从 1200 MW 收窄至 480 MW，叠加联络线外送计划下调，实时电价
                  上行 12.4%，与日前价差扩大至 +47 元/MWh。
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
