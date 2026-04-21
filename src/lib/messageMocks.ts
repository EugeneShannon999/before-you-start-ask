// ============================================================
// 消息中心 Mock 数据 (SP1)
// ------------------------------------------------------------
// 后续接入说明（TODO for SP2+）：
//   1. P0/P1/P2 三级消息均由后端 AI 解析管道处理后入库；
//      前端只消费 messages 表，不做内容生成。
//   2. P0 推送：当前 SP1 仅做 站内弹窗 + 顶部红点 原型。
//      SP2 接入完整 Web Push（Service Worker + VAPID + 移动端）。
//   3. P1 全局横条：从 messages 表拉 status='unread' 且 level='P1'
//      的最新一条，按 created_at 倒序轮播。
//   4. P2 季度整合：后端定时任务（每季度末）将该季度 P2 消息
//      合并为一份摘要文档，前端在 PolicyCenter 通过预设 prompt
//      触发 AI 解读会话。
//   5. 点击 P0/P1 横条/弹窗 → 跳转 /ai/policy?msgId=xxx，
//      由 PolicyCenter 自动以该消息为上下文发起会话。
// ============================================================

export type MessageLevel = "P0" | "P1" | "P2";

// AI 预解析结构化结果（mock）
// 后端口径：消息入库后由 AI 管道异步生成 analysis，前端只读
export interface MessageAnalysis {
  headline: string;       // 一句话结论
  impactScope: string;    // 影响对象
  impactWindow: string;   // 影响时段
  keyPoints: string[];    // 关键要点
  suggestion: string;     // 建议动作
  evidence: string;       // 原文证据片段
  evidenceSource: string; // 证据来源
}

export interface MarketMessage {
  id: string;
  level: MessageLevel;
  title: string;
  summary: string;
  source: string;
  publishedAt: string; // ISO
  // 后端解析结果（mock）：实际由 AI 管道写入
  aiAnalyzed: boolean;
  analysis?: MessageAnalysis;
  // 跳转目标会话 id（PolicyCenter 中预生成）
  sessionId?: string;
}

// ---- P0：紧急 / 立即推送 ----
export const p0Messages: MarketMessage[] = [
  {
    id: "msg-p0-001",
    level: "P0",
    title: "【紧急】安徽现货市场临时停市公告",
    summary:
      "因 220kV 主网线路故障，2025-07-14 14:00-16:00 暂停现货实时市场撮合，已申报曲线按中长期结算。",
    source: "安徽电力交易中心 临时通告",
    publishedAt: "2025-07-14T13:42:00+08:00",
    aiAnalyzed: true,
    sessionId: "sess-p0-001",
  },
];

// ---- P1：重要 / 全局横条轮播 ----
export const p1Messages: MarketMessage[] = [
  {
    id: "msg-p1-001",
    level: "P1",
    title: "安徽 7 月偏差考核新规：中午时段阈值由 55% 调整为 50%",
    summary: "对光伏富集时段不利，建议复核 PKG-A 套餐分时签约比例。",
    source: "安徽省能源局 〔2025〕47 号",
    publishedAt: "2025-07-14T10:32:00+08:00",
    aiAnalyzed: true,
    sessionId: "sess-p1-001",
  },
  {
    id: "msg-p1-002",
    level: "P1",
    title: "国家发改委：全国统一电力市场建设方案征求意见",
    summary: "明确跨省现货衔接、辅助服务分摊原则，长期影响零售报价模型。",
    source: "国家发改委 价格司",
    publishedAt: "2025-07-14T09:15:00+08:00",
    aiAnalyzed: true,
    sessionId: "sess-p1-002",
  },
  {
    id: "msg-p1-003",
    level: "P1",
    title: "广东现货：分段考核机制 8 月起试运行",
    summary: "分时段加权考核，对夜间高负荷主体影响较大。",
    source: "广东电力交易中心",
    publishedAt: "2025-07-13T17:20:00+08:00",
    aiAnalyzed: true,
    sessionId: "sess-p1-003",
  },
];

// ---- P2：常规 / 季度整合 ----
// SP1 仅占位：实际 P2 列表由后端按季度聚合生成摘要
export const p2QuarterSummary = {
  quarter: "2025 Q3",
  count: 47, // 该季度累计 P2 数量
  topics: ["分时电价微调", "辅助服务费率", "可再生消纳权重", "跨省互济结算细则"],
  sessionId: "sess-p2-q3-2025",
};

export function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}
