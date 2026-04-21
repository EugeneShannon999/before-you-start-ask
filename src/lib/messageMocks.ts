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
    analysis: {
      headline:
        "安徽现货 14:00-16:00 临时停市，已申报曲线按中长期电价结算，对当日实时报价策略影响显著。",
      impactScope: "安徽省内全部现货市场主体，重点关注当日有实时申报的售电公司与发电侧",
      impactWindow: "2025-07-14 14:00-16:00（共 2 小时，涵盖光伏出力高峰末段）",
      keyPoints: [
        "停市时段 SCED 不再撮合，实际出力按中长期分时合约结算",
        "已申报实时曲线不会被采纳，不计入偏差考核分母",
        "16:00 恢复后首个出清周期可能出现价格跳变，注意限价保护",
        "建议优先核查停市窗口内的新能源富集套餐 PKG-A / PKG-C",
      ],
      suggestion:
        "1) 立即通知交易员暂停 14:00-16:00 区间的实时报价调整；2) 复核中长期分时合约覆盖率；3) 16:00 恢复前 10 分钟做好限价与撤单准备。",
      evidence:
        "「因 220kV 滁州-合肥 II 回线路故障，经省调度同意，2025-07-14 14:00-16:00 暂停现货实时市场撮合，期间各主体已申报曲线按中长期分时合约结算，不计入偏差考核。」",
      evidenceSource: "安徽电力交易中心 临时通告 〔2025〕第 38 号",
    },
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
    analysis: {
      headline:
        "中午 10:00-18:00 下偏差考核阈值由 55% 收紧至 50%，光伏占比高的零售套餐承压。",
      impactScope: "安徽省内现货售电主体，尤其是光伏占比 >30% 的零售套餐（如 PKG-A 32%）",
      impactWindow: "2025-07-20 起执行，每日 10:00-18:00 时段",
      keyPoints: [
        "下偏差阈值 55% → 50%，超阈值部分按 1.5× 实时价补偿",
        "对中午光伏大发时段影响最大，预计 PKG-A 月度考核成本上升约 8-12 万元",
        "中长期分时签约比例若不调整，7 月底前可能触发预警",
        "可通过加签 10:00-14:00 分时电量或调整虚拟电厂调峰来缓解",
      ],
      suggestion:
        "1) 本周内复核 PKG-A、PKG-C 的分时签约曲线；2) 与中长期交易员协商加签 10-14 时段电量；3) 在算法预测页配置 7-8 月光伏出力情景，提前评估考核敞口。",
      evidence:
        "「中午时段（10:00-18:00）下偏差考核比例由 55% 调整为 50%。光伏出力高峰期间，售电主体应加强中长期分时签约与现货申报曲线的一致性管理。」",
      evidenceSource: "安徽省能源局 〔2025〕47 号 §3.2",
    },
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
    analysis: {
      headline:
        "全国统一市场草案明确跨省现货衔接与辅助服务分摊，零售定价模型需提前预留接口。",
      impactScope: "全国售电公司、虚拟电厂、跨省交易主体",
      impactWindow: "意见反馈截止 2025-08-30，正式稿预计 2025 Q4 发布",
      keyPoints: [
        "跨省现货按统一时序撮合，省间价差由分摊机制平抑",
        "辅助服务费用按用户侧用电量比例分摊，零售套餐成本结构变化",
        "建议在结算计算器预留『辅助服务分摊』参数位",
        "对长协占比高的客户影响小，对纯现货客户成本可能上升 2-4%",
      ],
      suggestion:
        "1) 在 8-30 前组织内部研讨形成反馈意见；2) 结算计算器加一个『辅助服务分摊率』可配项；3) 提前与重点客户沟通成本传导路径。",
      evidence:
        "「跨省现货市场按统一时序集中撮合，辅助服务费用按用户侧实际用电量比例分摊至各售电主体。」",
      evidenceSource: "全国统一电力市场建设方案（征求意见稿）§5.2 / §7.1",
    },
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
    analysis: {
      headline:
        "广东 8 月试运行分段考核：夜间 22:00-次日 06:00 加权系数 1.3，夜间高负荷主体压力上升。",
      impactScope: "广东省内售电主体，重点是夜间负荷占比 >40% 的工业类零售套餐",
      impactWindow: "2025-08-01 起试运行，试运行期 3 个月",
      keyPoints: [
        "考核分为 早峰/平/晚峰/夜段 四段，加权系数 0.8 / 1.0 / 1.2 / 1.3",
        "夜段考核分母收紧，夜间预测偏差成本上升约 30%",
        "建议提前为夜间负荷大户配置更精细的预测模型",
        "可考虑与储能或可中断负荷签辅助协议对冲夜间风险",
      ],
      suggestion:
        "1) 标记广东客户中夜间负荷占比 >40% 的套餐；2) 在算法预测页打开『分段精度』模式；3) 评估与储能聚合商签订夜间调节协议的可行性。",
      evidence:
        "「自 2025-08-01 起，广东现货市场偏差考核分为早峰、平、晚峰、夜段四个时段，分别按 0.8、1.0、1.2、1.3 加权。」",
      evidenceSource: "广东电力交易中心 〔2025〕通知第 22 号",
    },
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
