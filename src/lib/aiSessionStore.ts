// ============================================================
// 听雨（原"政策 AI"）会话与历史政策 - 本地状态管理 (SP1)
// ------------------------------------------------------------
// 设计要点：
//  - SP1 阶段无后端，会话 / 置顶 / 重命名 / 删除 / 历史政策星标
//    全部存到 localStorage，刷新仍保留
//  - SP2 接入后端：把 storage adapter 替换为后端 API，对外接口不变
//  - 历史政策默认按"看板省份"过滤（policies[i].province）
//    province === "all" 表示全国级，所有省份可见
//  - P0 不区分省份，但 P0 也会进会话历史（按 province="all" 处理）
// ============================================================

import { useEffect, useState, useCallback } from "react";
import type { ProvinceCode } from "@/contexts/ProvinceContext";

// ---------- 类型 ----------
export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string; // ISO
  pinned: boolean;
  // 关联消息 / 政策（可选）
  msgId?: string;
  policyId?: string;
}

export type BulletinKind = "policy" | "notice";

export interface HistoricalPolicy {
  id: string;
  title: string;
  source: string;
  publishedAt: string; // ISO
  province: ProvinceCode | "all";
  oneLine: string;
  starred: boolean;
  pinned: boolean;
  kind: BulletinKind; // 政策 / 公告
  read: boolean; // 是否已读
}

// ---------- 默认 mock ----------
const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: "sess-p1-001",
    title: "7 月安徽偏差考核新规解读",
    updatedAt: "2025-07-14T10:35:00+08:00",
    pinned: true,
    msgId: "msg-p1-001",
  },
  {
    id: "sess-p1-002",
    title: "全国统一电力市场征求意见影响",
    updatedAt: "2025-07-14T09:20:00+08:00",
    pinned: false,
    msgId: "msg-p1-002",
  },
  {
    id: "sess-p1-003",
    title: "广东现货分段考核机制",
    updatedAt: "2025-07-13T17:30:00+08:00",
    pinned: false,
    msgId: "msg-p1-003",
  },
  {
    id: "sess-p1-004",
    title: "安徽 7-15 午间负电价复盘",
    updatedAt: "2025-07-15T13:12:00+08:00",
    pinned: false,
    msgId: "msg-p1-004",
  },
  {
    id: "sess-custom-001",
    title: "PKG-A 套餐 7 月成本测算",
    updatedAt: "2025-07-12T20:10:00+08:00",
    pinned: false,
  },
  {
    id: "sess-custom-002",
    title: "辅助服务分摊参数讨论",
    updatedAt: "2025-07-10T15:42:00+08:00",
    pinned: false,
  },
];

// 历史政策按省份分布；"all" = 全国级
const DEFAULT_POLICIES: HistoricalPolicy[] = [
  {
    id: "pol-ah-001",
    title: "安徽 2025-07 结算规则调整",
    source: "安徽省能源局 〔2025〕47 号",
    publishedAt: "2025-07-14T10:32:00+08:00",
    province: "anhui",
    oneLine: "中午 8 小时下偏差考核阈值由 55% 调整为 50%。",
    starred: true,
    pinned: true,
    kind: "policy",
    read: false,
  },
  {
    id: "pol-ah-002",
    title: "安徽 2025 年中长期分时交易实施细则",
    source: "安徽电力交易中心",
    publishedAt: "2025-06-20T14:00:00+08:00",
    province: "anhui",
    oneLine: "明确中长期合约分时颗粒度由日级细化到 4 时段。",
    starred: false,
    pinned: false,
    kind: "policy",
    read: true,
  },
  {
    id: "pol-ah-003",
    title: "安徽 2025-Q2 月度集中竞价规则更新",
    source: "安徽电力交易中心",
    publishedAt: "2025-04-08T11:00:00+08:00",
    province: "anhui",
    oneLine: "新增分时报价档位，中标量按 15 分钟分解到曲线。",
    starred: false,
    pinned: false,
    kind: "policy",
    read: true,
  },
  {
    id: "pol-nat-001",
    title: "国家发改委：全国统一电力市场建设方案征求意见",
    source: "国家发改委 价格司",
    publishedAt: "2025-07-14T09:15:00+08:00",
    province: "all",
    oneLine: "明确跨省现货衔接、辅助服务分摊原则。",
    starred: true,
    pinned: false,
    kind: "policy",
    read: false,
  },
  {
    id: "pol-gd-001",
    title: "广东现货分段考核机制（试行）",
    source: "广东电力交易中心 〔2025〕22 号",
    publishedAt: "2025-07-13T17:20:00+08:00",
    province: "guangdong",
    oneLine: "考核分四段加权，夜段系数 1.3。",
    starred: false,
    pinned: false,
    kind: "policy",
    read: false,
  },
  {
    id: "pol-sd-001",
    title: "山东分布式光伏并网管理细则修订征求意见",
    source: "山东省能源局",
    publishedAt: "2025-07-12T16:00:00+08:00",
    province: "shandong",
    oneLine: "整县项目并网容量上限调整，反送电纳入考核。",
    starred: false,
    pinned: false,
    kind: "policy",
    read: true,
  },
  // ---- 公告类 ----
  {
    id: "not-ah-001",
    title: "【公告】安徽电力交易平台 7-20 凌晨例行维护",
    source: "安徽电力交易中心 运维部",
    publishedAt: "2025-07-18T16:00:00+08:00",
    province: "anhui",
    oneLine: "00:00-04:00 平台暂停服务，建议提前完成报价。",
    starred: false,
    pinned: false,
    kind: "notice",
    read: false,
  },
  {
    id: "not-ah-002",
    title: "【公告】月度集中竞价时间窗调整通知",
    source: "安徽电力交易中心",
    publishedAt: "2025-07-05T09:30:00+08:00",
    province: "anhui",
    oneLine: "8 月起月度竞价提交截止时间由 17:00 改为 16:00。",
    starred: false,
    pinned: false,
    kind: "notice",
    read: true,
  },
  {
    id: "not-nat-001",
    title: "【公告】国家电网迎峰度夏有序用电预案启动",
    source: "国家电网调度中心",
    publishedAt: "2025-07-10T08:00:00+08:00",
    province: "all",
    oneLine: "全国多省进入有序用电响应，关注负荷高峰时段曲线。",
    starred: false,
    pinned: false,
    kind: "notice",
    read: false,
  },
  {
    id: "not-gd-001",
    title: "【公告】广东电力市场结算账期变更",
    source: "广东电力交易中心",
    publishedAt: "2025-06-28T14:20:00+08:00",
    province: "guangdong",
    oneLine: "M+10 改为 M+8 工作日完成月度结算。",
    starred: false,
    pinned: false,
    kind: "notice",
    read: true,
  },
];

// ---------- localStorage adapter ----------
function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

const SESS_KEY = "lovable.ai.sessions";
const POL_KEY = "lovable.ai.policies";

// ---------- Hooks ----------
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => read(SESS_KEY, DEFAULT_SESSIONS));

  useEffect(() => {
    write(SESS_KEY, sessions);
  }, [sessions]);

  const togglePin = useCallback((id: string) => {
    setSessions((s) => s.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));
  }, []);

  const rename = useCallback((id: string, title: string) => {
    setSessions((s) => s.map((x) => (x.id === id ? { ...x, title } : x)));
  }, []);

  const remove = useCallback((id: string) => {
    setSessions((s) => s.filter((x) => x.id !== id));
  }, []);

  const removeMany = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setSessions((s) => s.filter((x) => !set.has(x.id)));
  }, []);

  const create = useCallback((title: string): ChatSession => {
    const sess: ChatSession = {
      id: `sess-${Date.now()}`,
      title,
      updatedAt: new Date().toISOString(),
      pinned: false,
    };
    setSessions((s) => [sess, ...s]);
    return sess;
  }, []);

  return { sessions, togglePin, rename, remove, removeMany, create, setSessions };
}

export function useHistoricalPolicies() {
  const [policies, setPolicies] = useState<HistoricalPolicy[]>(() =>
    read(POL_KEY, DEFAULT_POLICIES)
  );

  useEffect(() => {
    write(POL_KEY, policies);
  }, [policies]);

  const toggleStar = useCallback((id: string) => {
    setPolicies((p) => p.map((x) => (x.id === id ? { ...x, starred: !x.starred } : x)));
  }, []);

  const togglePin = useCallback((id: string) => {
    setPolicies((p) => p.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));
  }, []);

  const removeMany = useCallback((ids: string[]) => {
    const set = new Set(ids);
    setPolicies((p) => p.filter((x) => !set.has(x.id)));
  }, []);

  const markRead = useCallback((id: string, read = true) => {
    setPolicies((p) => p.map((x) => (x.id === id ? { ...x, read } : x)));
  }, []);

  const markAllRead = useCallback((ids?: string[]) => {
    if (!ids) {
      setPolicies((p) => p.map((x) => ({ ...x, read: true })));
      return;
    }
    const set = new Set(ids);
    setPolicies((p) => p.map((x) => (set.has(x.id) ? { ...x, read: true } : x)));
  }, []);

  return { policies, toggleStar, togglePin, removeMany, markRead, markAllRead };
}
