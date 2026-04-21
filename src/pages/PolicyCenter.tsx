import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Send,
  ExternalLink,
  CornerDownRight,
  CalendarRange,
  AlertOctagon,
  AlertTriangle,
  Bot,
  User,
  Construction,
  Brain,
  History,
  Star,
  StarOff,
  Pin,
  PinOff,
  Trash2,
  MessageSquarePlus,
  FileSearch,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { p0Messages, p1Messages, p2QuarterSummary, formatMsgTime } from "@/lib/messageMocks";
import { useProvince } from "@/contexts/ProvinceContext";
import { useHistoricalPolicies } from "@/lib/aiSessionStore";

// ============================================================
// 听雨（原"政策 AI"）主对话区
// ------------------------------------------------------------
//  - 左侧 AI 能力 / 历史政策 / 会话列表 已合并到全局 AppSidebar
//  - 右侧证据栏已移除：证据/原文/追问 由 AI 回复气泡自带操作承载
//  - msgId 跳转：直接呈现"用户提问气泡 + AI 已生成的解读气泡"
//  - 季度整合：欢迎区一键直出 P2 摘要解读，无需二次确认
//  - 默认场景不再展示静态"政策卡片"列表（已迁到侧栏「历史政策」）
//  - 省份感知：欢迎语提示当前看板省份；P1 / 历史政策 都跟随省份
// ============================================================

type Capability = "policy" | "review";

interface CapabilityDef {
  key: Capability;
  name: string;
  icon: typeof Brain;
  desc: string;
  placeholder?: boolean;
}

const capabilities: CapabilityDef[] = [
  { key: "policy", name: "听雨", icon: Brain, desc: "解读最新政策与影响" },
  { key: "review", name: "复盘助手", icon: History, desc: "复盘某日交易与价差成因", placeholder: true },
];

export default function PolicyCenter() {
  const [searchParams] = useSearchParams();
  const { province, label: provinceLabel } = useProvince();
  const capParam = (searchParams.get("cap") as Capability) || "policy";
  const active: Capability = capabilities.find((c) => c.key === capParam && !c.placeholder)
    ? capParam
    : "policy";
  const [input, setInput] = useState("");
  const incomingMsgId = searchParams.get("msgId");
  const incomingPid = searchParams.get("pid");

  // 触发自动展开 P2 季度整合：URL 带 ?p2=1（侧栏按钮跳过来）或欢迎区按钮直接点击
  const [showQuarter, setShowQuarter] = useState(false);
  useEffect(() => {
    if (searchParams.get("p2") === "1") setShowQuarter(true);
  }, [searchParams]);

  // 由 P0 弹窗 / P1 横条跳转进入时，定位对应消息
  const incomingMsg =
    p0Messages.find((m) => m.id === incomingMsgId) ||
    p1Messages.find((m) => m.id === incomingMsgId);

  // 历史政策（左侧选中 → 右侧主区处理）
  const { policies, toggleStar, togglePin, removeMany } = useHistoricalPolicies();
  const incomingPolicy = useMemo(
    () => (incomingPid ? policies.find((p) => p.id === incomingPid) : undefined),
    [incomingPid, policies]
  );

  useEffect(() => {
    if (incomingMsg || incomingPolicy) setInput("");
  }, [incomingMsg, incomingPolicy]);

  const current = capabilities.find((c) => c.key === active)!;

  const visibleP1Count = useMemo(
    () => p1Messages.filter((m) => m.province === "all" || m.province === province).length,
    [province]
  );

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-12 border-b flex items-center px-5 gap-2 shrink-0">
          <current.icon className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">{current.name}</h1>
          <span className="text-xs text-muted-foreground ml-2">· {current.desc}</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            当前省份：{provinceLabel}
          </span>
        </header>

        <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
        <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
          {/* ---------- 历史政策详情视图（pid 模式）---------- */}
          {incomingPolicy && active === "policy" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="rounded-lg border bg-card shadow-notion p-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
                  <span>历史政策 · {provinceLabel}</span>
                  <span>·</span>
                  <span className="tabular-nums">{formatMsgTime(incomingPolicy.publishedAt)}</span>
                  <span>·</span>
                  <span>{incomingPolicy.source}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold leading-snug flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      {incomingPolicy.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                      {incomingPolicy.starred && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                      <span>{incomingPolicy.title}</span>
                    </span>
                  </h2>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleStar(incomingPolicy.id)}
                      className="text-xs px-2 py-1 rounded border hover:bg-secondary inline-flex items-center gap-1"
                    >
                      {incomingPolicy.starred ? (
                        <><StarOff className="h-3 w-3" /> 取消星标</>
                      ) : (
                        <><Star className="h-3 w-3" /> 星标</>
                      )}
                    </button>
                    <button
                      onClick={() => togglePin(incomingPolicy.id)}
                      className="text-xs px-2 py-1 rounded border hover:bg-secondary inline-flex items-center gap-1"
                    >
                      {incomingPolicy.pinned ? (
                        <><PinOff className="h-3 w-3" /> 取消置顶</>
                      ) : (
                        <><Pin className="h-3 w-3" /> 置顶</>
                      )}
                    </button>
                    <button
                      onClick={() => removeMany([incomingPolicy.id])}
                      className="text-xs px-2 py-1 rounded border hover:bg-secondary text-destructive inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> 删除
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground/85 mt-3 leading-relaxed">
                  {incomingPolicy.oneLine}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 rounded-lg border bg-card shadow-notion p-4 space-y-3">
                  <p className="text-sm font-medium leading-relaxed">
                    {incomingPolicy.title} 的关键影响（AI 预生成 · mock）
                  </p>
                  <ul className="space-y-1 list-disc list-inside marker:text-primary/60 text-xs">
                    <li className="text-foreground/85 leading-relaxed pl-1">
                      影响范围：{provinceLabel} 省内市场化用户与代理购电主体
                    </li>
                    <li className="text-foreground/85 leading-relaxed pl-1">
                      生效时间：发布后次月起执行（具体以原文为准）
                    </li>
                    <li className="text-foreground/85 leading-relaxed pl-1">
                      建议动作：复盘相关套餐结算口径、关注偏差考核窗口变化
                    </li>
                  </ul>
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> 查看原文
                    </button>
                    <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary inline-flex items-center gap-1">
                      <FileSearch className="h-3 w-3" /> 深入分析
                    </button>
                    <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary inline-flex items-center gap-1">
                      <CornerDownRight className="h-3 w-3" /> 追问
                    </button>
                    <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary inline-flex items-center gap-1">
                      <MessageSquarePlus className="h-3 w-3" /> 开启对话
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- 欢迎区 + P2 入口 ---------- */}
          {!incomingMsg && !incomingPolicy && active === "policy" && !showQuarter && (
            <div className="max-w-2xl mx-auto text-center pt-6 pb-2">
              <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                你好，我是「{current.name}」。基于近 30 天政策、出清与你的套餐数据回答（当前省份：{provinceLabel}）。
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                正在跟踪 {visibleP1Count} 条 P1 重要消息
              </p>
              <button
                onClick={() => setShowQuarter(true)}
                className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card hover:bg-secondary text-xs text-foreground/80 hover:text-foreground transition-colors shadow-notion"
              >
                <CalendarRange className="h-3.5 w-3.5 text-primary" />
                <span>查看本季度市场要闻整合</span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                  P2 · {p2QuarterSummary.quarter} · {p2QuarterSummary.count} 条
                </span>
              </button>
            </div>
          )}

          {/* ---------- P2 季度整合：点击后直接出现完整解读 ---------- */}
          {!incomingMsg && active === "policy" && showQuarter && (
            <div className="max-w-2xl mx-auto flex justify-start">
              <div className="flex items-start gap-2 w-full">
                <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 rounded-lg border bg-card shadow-notion p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-foreground/70">
                      <CalendarRange className="h-3 w-3" /> P2 季度整合
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {p2QuarterSummary.quarter} · 共 {p2QuarterSummary.count} 条 P2 消息
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {p2QuarterSummary.quarter} 市场要闻整体平稳，重点围绕分时电价微调、辅助服务费率、可再生消纳权重与跨省互济结算细则四个方向。
                  </p>
                  <div className="text-xs">
                    <p className="text-muted-foreground mb-1.5">本季关注主题</p>
                    <ul className="space-y-1 list-disc list-inside marker:text-primary/60">
                      {p2QuarterSummary.topics.map((t, i) => (
                        <li key={i} className="text-foreground/85 leading-relaxed pl-1">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-xs rounded-md bg-secondary/60 p-2.5">
                    <p className="text-muted-foreground mb-1 font-medium">建议动作</p>
                    <p className="text-foreground/85 leading-relaxed">
                      1) 在算法预测页评估辅助服务分摊参数变化；2) 复盘近季 PKG-A 套餐的实时价差走势；3) 可在下方继续追问任一主题的详细解读。
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic pt-1">
                    该整合由 AI 在每季度末自动生成（mock），下方可继续追问。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ---------- P0 / P1 跳转：用户提问气泡 + AI 解读气泡 ---------- */}
          {incomingMsg && active === "policy" && incomingMsg.analysis && (
            <>
              {/* 1) 上下文卡片 */}
              <div className="max-w-2xl mx-auto">
                <div
                  className={`rounded-lg border p-3 ${
                    incomingMsg.level === "P0"
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        incomingMsg.level === "P0"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-primary/15 text-primary"
                      }`}
                    >
                      {incomingMsg.level === "P0" ? (
                        <AlertOctagon className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {incomingMsg.level} 消息
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatMsgTime(incomingMsg.publishedAt)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">· {incomingMsg.source}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground/90">{incomingMsg.title}</p>
                </div>
              </div>

              {/* 2) 用户提问气泡 */}
              <div className="max-w-2xl mx-auto flex justify-end">
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs leading-relaxed">
                    请深入解读这条 {incomingMsg.level} 消息：{incomingMsg.title}
                  </div>
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-foreground/70" />
                  </div>
                </div>
              </div>

              {/* 3) AI 解读气泡 */}
              <div className="max-w-2xl mx-auto flex justify-start">
                <div className="flex items-start gap-2 w-full">
                  <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 rounded-lg border bg-card shadow-notion p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {incomingMsg.analysis.headline}
                    </p>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t">
                      <div>
                        <dt className="text-muted-foreground mb-0.5">影响对象</dt>
                        <dd className="text-foreground/85">{incomingMsg.analysis.impactScope}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-0.5">影响时段</dt>
                        <dd className="text-foreground/85">{incomingMsg.analysis.impactWindow}</dd>
                      </div>
                    </dl>

                    <div className="text-xs">
                      <p className="text-muted-foreground mb-1.5">关键要点</p>
                      <ul className="space-y-1 list-disc list-inside marker:text-primary/60">
                        {incomingMsg.analysis.keyPoints.map((kp, i) => (
                          <li key={i} className="text-foreground/85 leading-relaxed pl-1">
                            {kp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs rounded-md bg-secondary/60 p-2.5">
                      <p className="text-muted-foreground mb-1 font-medium">建议动作</p>
                      <p className="text-foreground/85 leading-relaxed">
                        {incomingMsg.analysis.suggestion}
                      </p>
                    </div>

                    <div className="text-xs pt-2 border-t">
                      <p className="text-muted-foreground mb-1">原文证据</p>
                      <p className="text-foreground/80 italic leading-relaxed">
                        “{incomingMsg.analysis.evidence}”
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        — {incomingMsg.analysis.evidenceSource}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> 查看原文
                      </button>
                      <button className="text-xs px-2.5 py-1 rounded border hover:bg-secondary flex items-center gap-1">
                        <CornerDownRight className="h-3 w-3" /> 追问
                      </button>
                    </div>

                    <p className="text-[10px] text-muted-foreground italic pt-1">
                      该解读由 AI 在消息入库时预生成（mock），下方可继续追问。
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------- 复盘助手占位 ---------- */}
          {active === "review" && (
            <div className="max-w-2xl mx-auto">
              <div className="rounded-lg border bg-card shadow-notion p-12 text-center">
                <Construction className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-base font-semibold mb-2">🚧 复盘助手开发中</h2>
                <p className="text-sm text-muted-foreground mb-4">该能力将在后续版本中上线</p>
                <p className="text-xs text-muted-foreground">
                  预计包含：交易日复盘、价差成因归因、异常时段定位、与算法预测对比
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 输入框 */}
        <div className="border-t bg-card p-4 shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="relative rounded-lg border bg-background focus-within:border-primary transition-colors">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  incomingMsg
                    ? "继续追问，例如：对 PKG-A 套餐的具体影响有多大？"
                    : "问政策、问市场、问某天价差为什么变大…"
                }
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
    </div>
  );
}
