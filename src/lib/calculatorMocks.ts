// 结算计算器 - 集中 Mock 数据
// 与原型截图一致，仅用于前端演示

export type CustomerStatus = "active" | "inactive";
export type PackageVersionStatus = "published" | "draft" | "disabled";
export type RunType = "trial" | "formal";
export type RunStatus = "success" | "failed" | "running" | "pending";
export type PolicyStatus = "active" | "draft" | "disabled";
export type DataVersionStatus = "published" | "validating" | "warning" | "failed";
export type DataVersionSource = "页面抓取" | "公开API" | "规则计算" | "Excel fallback";
export type BatchType =
  | "raw_load"
  | "raw_market"
  | "stg_load"
  | "stg_price"
  | "raw_contract";
export type BatchStatus = "confirmed" | "pending" | "voided" | "failed";

export interface Customer {
  id: string;
  name: string;
  retailer: string;
  orderName: string;
  currentPackage: string;
  packageStructure: string;
  k1k2k3: string;
  effectiveStart: string;
  effectiveEnd: string | null;
  status: CustomerStatus;
}

export interface PackageVersion {
  id: string;
  customerId: string;
  name: string;
  effectiveMonth: string;
  description: string;
  formula: string;
  status: PackageVersionStatus;
}

export interface CalcRun {
  id: string;
  settleMonth: string;
  type: RunType;
  dataVersionId: string;
  policyVersion: string;
  packageSnapshot: string;
  validationSummary: string;
  status: RunStatus;
  customerCount: number;
  totalVolumeMWh: number;
  totalCost: number;
  totalProfit: number;
  createdAt: string;
  remark?: string;
}

export interface WholesaleRow {
  period: string;
  r1Amount: number;
  recoveryAmount: number;
  companyCost: number;
}

export interface CustomerSettleRow {
  customerName: string;
  packageType: string;
  volumeMWh: number;
  revenue: number;
  cost: number;
  profit: number;
  avgPrice: number;
}

export interface ProfitAnalysisRow {
  customerName: string;
  baseProfit: number;
  shareProfit: number;
  recoveryProfit: number;
  total: number;
}

export interface PolicyVersion {
  id: string;
  name: string;
  code: string;
  effectiveMonth: string;
  status: PolicyStatus;
  updatedAt: string;
  description: string;
  dataSource: string;
  constants: { key: string; value: string }[];
  monthly: { key: string; value: string }[];
  hourly: { key: string; value: string }[];
}

export interface DataBatch {
  id: string;
  type: BatchType;
  settleMonth: string;
  fileName: string;
  status: BatchStatus;
  importedAt: string;
  rows: number;
}

export interface DataVersion {
  id: string;
  dataType: string;
  settleMonth: string;
  businessDate: string;
  source: DataVersionSource;
  pluginTaskId: string;
  coverage: string;
  status: DataVersionStatus;
  publishedAt: string;
  traceNote: string;
}

// ===== 客户 =====
export const mockCustomers: Customer[] = [
  {
    id: "C001",
    name: "安徽智造园区",
    retailer: "徽能售电",
    orderName: "2026年度园区合同",
    currentPackage: "套餐三-2026-04",
    packageStructure: "市场均价+浮动+分成",
    k1k2k3: "20/30/50",
    effectiveStart: "2026-04-01",
    effectiveEnd: null,
    status: "active",
  },
  {
    id: "C002",
    name: "合肥精密电子",
    retailer: "徽能售电",
    orderName: "2026电子厂套餐",
    currentPackage: "套餐一-2026-02",
    packageStructure: "固定价",
    k1k2k3: "100/0/0",
    effectiveStart: "2026-02-01",
    effectiveEnd: null,
    status: "active",
  },
  {
    id: "C003",
    name: "马鞍山钢铁集团",
    retailer: "徽能售电",
    orderName: "2026年度钢铁主合同",
    currentPackage: "套餐二-2026-04",
    packageStructure: "市场均价+浮动",
    k1k2k3: "30/70/0",
    effectiveStart: "2026-04-01",
    effectiveEnd: null,
    status: "active",
  },
  {
    id: "C004",
    name: "芜湖汽车零部件",
    retailer: "徽能售电",
    orderName: "2026年汽配套餐",
    currentPackage: "套餐一-2026-01",
    packageStructure: "固定价",
    k1k2k3: "100/0/0",
    effectiveStart: "2026-01-01",
    effectiveEnd: null,
    status: "active",
  },
];

// ===== 套餐版本 =====
export const mockPackageVersions: PackageVersion[] = [
  {
    id: "PKG-C001-202604",
    customerId: "C001",
    name: "套餐三-2026-04",
    effectiveMonth: "2026-04",
    description: "2026-04 起生效",
    formula: "P售均 × K浮 + 分成系数 18%",
    status: "published",
  },
  {
    id: "PKG-C001-202603",
    customerId: "C001",
    name: "套餐三-2026-03",
    effectiveMonth: "2026-03",
    description: "2026-03 生效（旧版市场均价+浮动方案）",
    formula: "P售均 × K浮 + 分成系数 15%",
    status: "disabled",
  },
  {
    id: "PKG-C002-202602",
    customerId: "C002",
    name: "套餐一-2026-02",
    effectiveMonth: "2026-02",
    description: "2026-02 起生效",
    formula: "固定结算价 0.4350 元/kWh",
    status: "published",
  },
  {
    id: "PKG-C003-202604",
    customerId: "C003",
    name: "套餐二-2026-04",
    effectiveMonth: "2026-04",
    description: "2026-04 起生效",
    formula: "P售均 × K浮（无分成）",
    status: "published",
  },
  {
    id: "PKG-C004-202601",
    customerId: "C004",
    name: "套餐一-2026-01",
    effectiveMonth: "2026-01",
    description: "2026-01 起生效",
    formula: "固定结算价 0.4280 元/kWh",
    status: "published",
  },
];

// ===== 计算任务 =====
export const mockCalcRuns: CalcRun[] = [
  {
    id: "RUN-202604-002",
    settleMonth: "2026-04",
    type: "formal",
    dataVersionId: "DV-SETTLE-202604-V2",
    policyVersion: "POLICY-202604-DRAFT",
    packageSnapshot: "PKG-SNAPSHOT-202604-DRAFT",
    validationSummary: "月度结算数据缺 2 个客户补录确认，阻止正式核算",
    status: "failed",
    customerCount: 1,
    totalVolumeMWh: 0,
    totalCost: 0,
    totalProfit: 0,
    createdAt: "2026-04-20 11:30",
    remark: "正式核算 - 草稿版本试跑",
  },
  {
    id: "RUN-202604-001",
    settleMonth: "2026-04",
    type: "trial",
    dataVersionId: "DV-SETTLE-202604-V1",
    policyVersion: "POLICY-202604-TRIAL",
    packageSnapshot: "PKG-SNAPSHOT-202604-ACTIVE",
    validationSummary: "数据版本已发布，覆盖率 96/96；允许试算",
    status: "success",
    customerCount: 2,
    totalVolumeMWh: 8882.78,
    totalCost: 2754321.2,
    totalProfit: 353973.8,
    createdAt: "2026-04-20 09:45",
    remark: "原型页面发起",
  },
  {
    id: "RUN-202603-003",
    settleMonth: "2026-03",
    type: "formal",
    dataVersionId: "DV-SETTLE-202603-FINAL",
    policyVersion: "POLICY-202603-FINAL",
    packageSnapshot: "PKG-SNAPSHOT-202603-FINAL",
    validationSummary: "正式版本已封存，来源追溯完整",
    status: "success",
    customerCount: 4,
    totalVolumeMWh: 17542.6,
    totalCost: 5320180.5,
    totalProfit: 720640.3,
    createdAt: "2026-04-02 16:20",
  },
];

// ===== 数据版本 =====
export const mockDataVersions: DataVersion[] = [
  {
    id: "DV-SETTLE-202604-V2",
    dataType: "月度结算数据",
    settleMonth: "2026-04",
    businessDate: "2026-04",
    source: "页面抓取",
    pluginTaskId: "TASK-SETTLE-202604-02",
    coverage: "94/96 时点 · 68/70 客户",
    status: "warning",
    publishedAt: "2026-04-20 11:05",
    traceNote: "交易中心页面抓取，2 个客户等待 Excel fallback 补录",
  },
  {
    id: "DV-SETTLE-202604-V1",
    dataType: "月度结算数据",
    settleMonth: "2026-04",
    businessDate: "2026-04",
    source: "页面抓取",
    pluginTaskId: "TASK-SETTLE-202604-01",
    coverage: "96/96 时点 · 70/70 客户",
    status: "published",
    publishedAt: "2026-04-20 09:58",
    traceNote: "插件采集完成并通过校验，作为试算默认版本",
  },
  {
    id: "DV-PRICE-202604-D",
    dataType: "日前/实时电价",
    settleMonth: "2026-04",
    businessDate: "2026-04-20",
    source: "公开API",
    pluginTaskId: "TASK-PRICE-D-20260420",
    coverage: "96/96 时点",
    status: "published",
    publishedAt: "2026-04-20 10:30",
    traceNote: "公开 API 披露后入库，供批发侧成本核对",
  },
  {
    id: "DV-LOAD-202604-D",
    dataType: "用户负荷",
    settleMonth: "2026-04",
    businessDate: "2026-04-20",
    source: "规则计算",
    pluginTaskId: "TASK-LOAD-STG-20260420",
    coverage: "96/96 时点 · 70/70 客户",
    status: "published",
    publishedAt: "2026-04-20 10:12",
    traceNote: "由采集负荷清洗映射生成，不再作为上传批次主链路",
  },
  {
    id: "DV-CONTRACT-202604-FB",
    dataType: "中长期合约",
    settleMonth: "2026-04",
    businessDate: "2026-04",
    source: "Excel fallback",
    pluginTaskId: "TASK-CONTRACT-FALLBACK-202604",
    coverage: "168 条合约",
    status: "validating",
    publishedAt: "待发布",
    traceNote: "插件未接入受限页面，暂用人工文件补录并保留来源标记",
  },
];

export const dataVersionStatusLabel: Record<DataVersionStatus, string> = {
  published: "已发布",
  validating: "校验中",
  warning: "有缺口",
  failed: "校验失败",
};

// ===== 结果详情 - 批发侧 =====
export const mockWholesaleRows: WholesaleRow[] = [
  { period: "2026-04-01 1时", r1Amount: 112356.2, recoveryAmount: 3210.4, companyCost: 115566.6 },
  { period: "2026-04-01 2时", r1Amount: 109245.8, recoveryAmount: 2984.2, companyCost: 112230.0 },
  { period: "2026-04-01 3时", r1Amount: 106820.5, recoveryAmount: 2756.8, companyCost: 109577.3 },
  { period: "2026-04-01 4时", r1Amount: 104230.3, recoveryAmount: 2530.5, companyCost: 106760.8 },
  { period: "2026-04-01 5时", r1Amount: 108920.6, recoveryAmount: 2810.2, companyCost: 111730.8 },
  { period: "2026-04-01 6时", r1Amount: 115640.2, recoveryAmount: 3120.6, companyCost: 118760.8 },
  { period: "2026-04-01 7时", r1Amount: 124380.5, recoveryAmount: 3450.8, companyCost: 127831.3 },
  { period: "2026-04-01 8时", r1Amount: 132560.4, recoveryAmount: 3820.4, companyCost: 136380.8 },
];

// ===== 结果详情 - 客户结算 =====
export const mockCustomerSettleRows: CustomerSettleRow[] = [
  {
    customerName: "安徽智造园区",
    packageType: "市场均价+浮动+分成",
    volumeMWh: 5320.4,
    revenue: 1820560.3,
    cost: 1640230.5,
    profit: 180329.8,
    avgPrice: 342.18,
  },
  {
    customerName: "合肥精密电子",
    packageType: "固定价",
    volumeMWh: 3562.38,
    revenue: 1287580.5,
    cost: 1114090.7,
    profit: 173489.8,
    avgPrice: 361.45,
  },
];

// ===== 结果详情 - 收益分析 =====
export const mockProfitAnalysisRows: ProfitAnalysisRow[] = [
  {
    customerName: "安徽智造园区",
    baseProfit: 120450.3,
    shareProfit: 48820.6,
    recoveryProfit: 11058.9,
    total: 180329.8,
  },
  {
    customerName: "合肥精密电子",
    baseProfit: 173489.8,
    shareProfit: 0,
    recoveryProfit: 0,
    total: 173489.8,
  },
];

// ===== 政策版本 =====
export const mockPolicyVersions: PolicyVersion[] = [
  {
    id: "POLICY-202604-TRIAL",
    name: "2026年4月试算参数",
    code: "POLICY-202604-TRIAL",
    effectiveMonth: "2026-04",
    status: "active",
    updatedAt: "2026-04-20 09:00",
    description: "用于 2026-04 试算演示",
    dataSource: "征求意见稿 + 样例日试算口径",
    constants: [
      { key: "lambda3", value: "2%" },
      { key: "lambda4", value: "2%" },
      { key: "h1", value: "1.00" },
      { key: "h8", value: "1.00" },
    ],
    monthly: [
      { key: "u_trade", value: "55%" },
      { key: "月度回收分摊规则", value: "按客户月电量占比" },
    ],
    hourly: [
      { key: "v_curve_negative", value: "45%" },
      { key: "Q日前结算口径", value: "试算临时口径" },
    ],
  },
  {
    id: "POLICY-202604-DRAFT",
    name: "2026年4月正式稿草稿",
    code: "POLICY-202604-DRAFT",
    effectiveMonth: "2026-04",
    status: "draft",
    updatedAt: "2026-04-20 10:20",
    description: "正式稿草稿，待评审",
    dataSource: "正式稿初稿",
    constants: [
      { key: "lambda3", value: "2.5%" },
      { key: "lambda4", value: "2.5%" },
      { key: "h1", value: "1.00" },
      { key: "h8", value: "1.05" },
    ],
    monthly: [
      { key: "u_trade", value: "60%" },
      { key: "月度回收分摊规则", value: "按客户月电量占比" },
    ],
    hourly: [
      { key: "v_curve_negative", value: "50%" },
      { key: "Q日前结算口径", value: "正式口径" },
    ],
  },
  {
    id: "POLICY-202603-FINAL",
    name: "2026年3月正式参数",
    code: "POLICY-202603-FINAL",
    effectiveMonth: "2026-03",
    status: "disabled",
    updatedAt: "2026-04-02 14:30",
    description: "2026-03 已封存",
    dataSource: "正式发布稿",
    constants: [
      { key: "lambda3", value: "2%" },
      { key: "lambda4", value: "2%" },
    ],
    monthly: [{ key: "u_trade", value: "55%" }],
    hourly: [{ key: "v_curve_negative", value: "45%" }],
  },
];

// ===== 旧导入 Mock（保留兼容旧稿，不作为默认页面主链路）=====
export const mockDataBatches: DataBatch[] = [
  {
    id: "RAW-LOAD-202604",
    type: "raw_load",
    settleMonth: "2026-04",
    fileName: "用户负荷_2026-04.xlsx",
    status: "confirmed",
    importedAt: "2026-04-20 09:15",
    rows: 2880,
  },
  {
    id: "RAW-MARKET-202604",
    type: "raw_market",
    settleMonth: "2026-04",
    fileName: "市场交易_2026-04.xlsx",
    status: "confirmed",
    importedAt: "2026-04-20 09:30",
    rows: 720,
  },
  {
    id: "STG-LOAD-202604",
    type: "stg_load",
    settleMonth: "2026-04",
    fileName: "staging_load_2026-04.csv",
    status: "confirmed",
    importedAt: "2026-04-20 09:45",
    rows: 2880,
  },
  {
    id: "STG-PRICE-202604",
    type: "stg_price",
    settleMonth: "2026-04",
    fileName: "staging_price_2026-04.csv",
    status: "confirmed",
    importedAt: "2026-04-20 09:50",
    rows: 720,
  },
  {
    id: "RAW-CONTRACT-202604",
    type: "raw_contract",
    settleMonth: "2026-04",
    fileName: "中长期合约_2026-04.xlsx",
    status: "pending",
    importedAt: "2026-04-20 10:05",
    rows: 168,
  },
];

export const batchTypeLabel: Record<BatchType, string> = {
  raw_load: "原始负荷",
  raw_market: "原始交易",
  stg_load: "中间层负荷",
  stg_price: "中间层价格",
  raw_contract: "原始合约",
};

export const batchStatusLabel: Record<BatchStatus, string> = {
  confirmed: "已确认",
  pending: "待确认",
  voided: "已作废",
  failed: "校验失败",
};

export const runStatusLabel: Record<RunStatus, string> = {
  success: "成功",
  failed: "失败",
  running: "运行中",
  pending: "待执行",
};

export const runTypeLabel: Record<RunType, string> = {
  trial: "试算",
  formal: "正式核算",
};
