import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ============================================================
// 看板省份选择 - 全局共享 + localStorage 记忆
// ------------------------------------------------------------
// 设计：
//  - 默认 "anhui"（安徽）；二次进入时从 localStorage 恢复上一次选择
//  - 市场看板、AI 听雨「历史政策」、P1/P2 消息过滤 都跟随该省份
//  - P0 不区分省份（全省级紧急消息直接推送）
// SP2 接入说明：
//  - 后端 messages / policies 表均按 province_code 分区，
//    前端按当前 province 拉取；P0 使用 broadcast 通道，无 province 过滤
// ============================================================

export type ProvinceCode = "anhui" | "shandong" | "guangdong";

export const PROVINCE_LABEL: Record<ProvinceCode, string> = {
  anhui: "安徽",
  shandong: "山东",
  guangdong: "广东",
};

const STORAGE_KEY = "lovable.market.province";

interface ProvinceState {
  province: ProvinceCode;
  setProvince: (p: ProvinceCode) => void;
  label: string;
}

const ProvinceContext = createContext<ProvinceState | null>(null);

export function ProvinceProvider({ children }: { children: ReactNode }) {
  const [province, setProvinceState] = useState<ProvinceCode>(() => {
    if (typeof window === "undefined") return "anhui";
    const saved = window.localStorage.getItem(STORAGE_KEY) as ProvinceCode | null;
    return saved && PROVINCE_LABEL[saved] ? saved : "anhui";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, province);
    } catch {
      /* ignore quota errors */
    }
  }, [province]);

  return (
    <ProvinceContext.Provider
      value={{ province, setProvince: setProvinceState, label: PROVINCE_LABEL[province] }}
    >
      {children}
    </ProvinceContext.Provider>
  );
}

export function useProvince(): ProvinceState {
  const ctx = useContext(ProvinceContext);
  if (!ctx) {
    // 非 provider 包裹时降级，仍读 localStorage 但不持久化
    const saved =
      (typeof window !== "undefined" &&
        (window.localStorage.getItem(STORAGE_KEY) as ProvinceCode | null)) ||
      "anhui";
    return { province: saved, setProvince: () => {}, label: PROVINCE_LABEL[saved] };
  }
  return ctx;
}
