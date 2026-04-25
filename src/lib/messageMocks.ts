// ============================================================
// 消息中心 Mock 数据 (SP1)
// ------------------------------------------------------------
// 后续接入说明（TODO for SP2+）：
//   1. 所有消息可以统一入库，但消息盒子不是主展示入口；展示按优先级分流。
//   2. P0：顶部 AI 提醒 / 推送 / 看板强提醒。
//   3. P1：AI 提醒 + 对应业务页展示 + 消息盒子留痕。
//   4. P2：默认只进入消息盒子；季度整合由后端定时任务生成摘要。
//   5. 政策和公告保留历史查询页，不在消息盒子里重复做历史库。
//   6. 点击 P0/P1 横条/弹窗 → 跳转 /ai/policy?msgId=xxx，
//      由 PolicyCenter 自动以该消息为上下文呈现 AI 解读。
//   7. ⚠ 省份过滤口径：
//      - P1 / P2 消息均按「市场看板当前省份」过滤（province 字段）；
//        province === "all" 表示全国级、所有省份都展示。
//      - P0 紧急消息 不区分省份，全用户级广播推送。
//      - 看板省份选择持久化在 localStorage（ProvinceContext），
//        二次进入恢复上一次选择，默认 "anhui"。
// ============================================================

import type { ProvinceCode } from "@/contexts/ProvinceContext";

export type MessageLevel = "P0" | "P1" | "P2";

// AI 预解析结构化结果（mock）
// 后端口径：消息入库后由 AI 管道异步生成 analysis，前端只读
export interface MessageAnalysis {
  headline: string;
  impactScope: string;
  impactWindow: string;
  keyPoints: string[];
  suggestion: string;
  evidence: string;
  evidenceSource: string;
}

export interface MarketMessage {
  id: string;
  level: MessageLevel;
  title: string;
  summary: string;
  source: string;
  publishedAt: string; // ISO
  // ⚠ P1 / P2 必须带 province；"all" 表示全国级，对所有省份可见
  // P0 不强制 province（按全用户广播）
  province?: ProvinceCode | "all";
  aiAnalyzed: boolean;
  analysis?: MessageAnalysis;
  sessionId?: string;
}

// ---- P0：紧急 / 立即推送（不区分省份）----
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

// ---- P1：重要 / 全局横条轮播（最多 5 条，按看板省份过滤）----
export const p1Messages: MarketMessage[] = [
  {
    id: "msg-p1-001",
    level: "P1",
    province: "anhui",
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
    province: "all",
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
    province: "guangdong",
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
  {
    id: "msg-p1-004",
    level: "P1",
    province: "anhui",
    title: "安徽 7-15 实时电价通告：午间出现负电价时段",
    summary: "12:15-12:45 实时出清出现 -32 元/MWh，新能源大发叠加负荷低谷。",
    source: "安徽电力交易中心 日清算简报",
    publishedAt: "2025-07-15T13:08:00+08:00",
    aiAnalyzed: true,
    sessionId: "sess-p1-004",
    analysis: {
      headline:
        "7-15 中午出现 30 分钟负电价区间，光伏富集套餐当日实时收益受拖累。",
      impactScope: "安徽省内光伏占比高的零售套餐及自有光伏发电客户",
      impactWindow: "2025-07-15 12:15-12:45（30 分钟）",
      keyPoints: [
        "实时出清最低 -32 元/MWh，连续 2 个 15 分钟点位",
        "PKG-A 估算当日实时收益减少约 1.8 万元",
        "建议复核中长期分时合约对该时段的覆盖度",
        "短期可通过虚拟电厂调峰将部分负荷迁移到午间消纳",
      ],
      suggestion:
        "1) 在算法预测页加入『午间负电价概率』提示；2) 与重点光伏客户沟通午间限发或储能配套；3) 月度复盘新增『负电价时段收益』口径。",
      evidence:
        "「2025-07-15 12:15-12:45 实时市场出清电价为 -32 元/MWh，主要受光伏出力达年内高位 5.2GW、午间负荷低谷叠加影响。」",
      evidenceSource: "安徽电力交易中心 日清算简报 (2025-07-15)",
    },
  },
  {
    id: "msg-p1-005",
    level: "P1",
    province: "shandong",
    title: "山东：分布式光伏并网管理细则修订征求意见",
    summary: "新增整县推进项目并网容量上限与考核口径。",
    source: "山东省能源局",
    publishedAt: "2025-07-12T16:00:00+08:00",
    aiAnalyzed: true,
    sessionId: "sess-p1-005",
    analysis: {
      headline:
        "山东修订分布式光伏并网细则，新增整县项目容量上限与省级考核口径。",
      impactScope: "山东省内分布式光伏开发商、聚合商、配套售电主体",
      impactWindow: "意见反馈截止 2025-08-15，落地预计 2025 Q4",
      keyPoints: [
        "整县项目并网容量上限按 110kV 主变最大允许接入容量的 60% 设定",
        "考核新增『反送电时段』偏差，对午间反送电的零售套餐成本上升",
        "建议聚合商提前梳理已签约项目的并网时序",
        "对纯工商业自用客户影响有限",
      ],
      suggestion:
        "1) 与山东客户的销售经理同步政策动向；2) 在结算计算器中预留『反送电偏差』参数；3) 8-15 前形成反馈意见。",
      evidence:
        "「整县推进项目并网容量原则上不超过所在区域 110kV 主变最大允许接入容量的 60%，反送电时段纳入偏差考核。」",
      evidenceSource: "山东省能源局《分布式光伏并网管理细则（征求意见稿）》§4.3",
    },
  },
];

// ---- P2：常规 / 季度整合 ----
// SP1 仅占位：实际 P2 列表由后端按季度聚合生成摘要
export const p2QuarterSummary = {
  quarter: "2025 Q3",
  count: 47,
  topics: ["分时电价微调", "辅助服务费率", "可再生消纳权重", "跨省互济结算细则"],
  sessionId: "sess-p2-q3-2025",
};

// 时间在前的格式化：用于消息列表"时间 · 标题"展示
// 同日：HH:mm；非同日：MM-DD HH:mm
export function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const hm = d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === today.toDateString()) return hm;
  const md = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${md} ${hm}`;
}
