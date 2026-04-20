import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface MarketCursorState {
  // hover 时段索引（在当前粒度下：15min 0..95，hour 0..23）
  hoverIdx: number | null;
  setHoverIdx: (idx: number | null) => void;
}

const MarketCursorContext = createContext<MarketCursorState | null>(null);

export function MarketCursorProvider({ children }: { children: ReactNode }) {
  const [hoverIdx, setHoverIdxState] = useState<number | null>(null);
  const setHoverIdx = useCallback((idx: number | null) => setHoverIdxState(idx), []);
  return (
    <MarketCursorContext.Provider value={{ hoverIdx, setHoverIdx }}>
      {children}
    </MarketCursorContext.Provider>
  );
}

export function useMarketCursor() {
  const ctx = useContext(MarketCursorContext);
  if (!ctx) {
    // 大屏单图场景下允许无 provider，退化为本地 noop
    return { hoverIdx: null as number | null, setHoverIdx: () => {} };
  }
  return ctx;
}
