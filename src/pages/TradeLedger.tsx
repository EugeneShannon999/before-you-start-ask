import { tradeLedgerRows } from "@/lib/marketMocks";

export default function TradeLedger() {
  return (
    <div className="px-6 py-5 space-y-4">
      <header className="rounded-lg border bg-card p-4 shadow-notion">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold">交易日志 / 交易账本</h1>
            <p className="text-xs text-muted-foreground mt-1">按电力交易口径记录成交、结算、偏差与收益 / 损益，表达尽量贴近股票期货软件的低门槛阅读方式。</p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded bg-secondary text-muted-foreground">页面抓取 + 规则计算</span>
        </div>
      </header>

      <section className="rounded-lg border bg-card shadow-notion overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">账本明细</h2>
          <span className="text-[11px] text-muted-foreground">红：上涨 / 扩大 / 偏高，绿：下跌 / 收窄 / 偏低</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-xs min-w-[980px]">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-4 py-2">日期</th>
                <th className="text-left px-4 py-2">交易品种 / 合约</th>
                <th className="text-left px-4 py-2">时段</th>
                <th className="text-left px-4 py-2">方向</th>
                <th className="text-right px-4 py-2">电量</th>
                <th className="text-right px-4 py-2">成交价</th>
                <th className="text-right px-4 py-2">结算价</th>
                <th className="text-right px-4 py-2">偏差</th>
                <th className="text-right px-4 py-2">收益 / 损益</th>
                <th className="text-left px-4 py-2">备注</th>
              </tr>
            </thead>
            <tbody>
              {tradeLedgerRows.map((row, idx) => (
                <tr key={`${row.date}-${idx}`} className="border-t hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono">{row.date}</td>
                  <td className="px-4 py-2">{row.contract}</td>
                  <td className="px-4 py-2">{row.period}</td>
                  <td className="px-4 py-2">{row.side}</td>
                  <td className="px-4 py-2 text-right font-mono">{row.quantity.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono">{row.dealPrice}</td>
                  <td className="px-4 py-2 text-right font-mono">{row.settlementPrice}</td>
                  <td className={`px-4 py-2 text-right font-mono ${row.deviation >= 0 ? "text-destructive" : "text-success"}`}>{row.deviation >= 0 ? "+" : ""}{row.deviation}</td>
                  <td className={`px-4 py-2 text-right font-mono ${row.pnl >= 0 ? "text-destructive" : "text-success"}`}>{row.pnl >= 0 ? "+" : ""}{row.pnl.toLocaleString()}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}