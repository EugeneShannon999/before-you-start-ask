import { CloudRain, CloudSun, TriangleAlert } from "lucide-react";
import { weather24, weatherSources } from "@/lib/marketMocks";

const weatherLinks = [
  { title: "气象 → 新能源预测", desc: "温度、风速、辐照度、云量共同影响风光出力修正。", source: "公开API / 页面抓取" },
  { title: "新能源预测 → 市场数据", desc: "新能源偏差将传导至实时供需、价差与市场运行状态。", source: "规则计算" },
  { title: "市场数据 → 竞价空间", desc: "气象波动先影响新能源侧，再改变竞价空间松紧。", source: "规则计算" },
  { title: "竞价空间 → 电价关系", desc: "竞价空间越紧，电价上修压力越高。", source: "规则计算" },
  { title: "电价关系 → 策略", desc: "结合价差与天气预警，调整申报与持仓节奏。", source: "规则计算" },
];

export default function WeatherBoard() {
  const warningHours = weather24.filter((row) => row.alert !== "无");

  return (
    <div className="px-6 py-5 space-y-4">
      <header className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold">气象看板</h1>
            <p className="text-xs text-muted-foreground mt-1">围绕气象 → 新能源预测 → 市场数据 → 竞价空间 → 电价关系 → 策略的链路展示。</p>
          </div>
            <span className="text-[11px] px-2 py-1 rounded bg-secondary text-muted-foreground">首版字段 · 规则计算</span>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {weatherSources.map((item) => (
            <div key={item.name} className="rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">来源：{item.source}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold">联动提示</h2>
          <span className="text-[11px] text-muted-foreground">规则计算 · 非复杂 AI 算法</span>
        </div>
        <div className="grid gap-2 xl:grid-cols-5">
          {weatherLinks.map((item) => (
            <div key={item.title} className="rounded-md border bg-background p-3 space-y-2">
              <p className="text-xs font-medium">{item.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
              <span className="text-[10px] text-muted-foreground">{item.source}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-notion overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold">24小时气象矩阵</h2>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span>字段：温度 / 风速 / 辐照度 / 云量 / 降水 / 极端天气预警</span>
            <span className="px-1.5 py-0.5 rounded bg-secondary">公开API + 页面抓取</span>
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-secondary/50 z-10">
              <tr>
                <th className="text-left px-4 py-2">时段</th>
                <th className="text-right px-4 py-2">温度(℃)</th>
                <th className="text-right px-4 py-2">风速(m/s)</th>
                <th className="text-right px-4 py-2">辐照度(W/㎡)</th>
                <th className="text-right px-4 py-2">云量(%)</th>
                <th className="text-right px-4 py-2">降水(mm)</th>
                <th className="text-left px-4 py-2">极端天气预警</th>
              </tr>
            </thead>
            <tbody>
              {weather24.map((row) => (
                <tr key={row.hour} className="border-t hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono">{row.hourLabel}</td>
                  <td className="px-4 py-2 text-right">{row.temperature}</td>
                  <td className="px-4 py-2 text-right text-destructive">{row.windSpeed.toFixed(1)}</td>
                  <td className="px-4 py-2 text-right">{row.irradiance}</td>
                  <td className="px-4 py-2 text-right text-success">{row.cloudCover}</td>
                  <td className="px-4 py-2 text-right">{row.precipitation.toFixed(1)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 ${row.alert === "无" ? "text-muted-foreground" : "text-destructive"}`}>
                      {row.alert === "无" ? <CloudSun className="h-3 w-3" /> : <CloudRain className="h-3 w-3" />}
                      {row.alert}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-notion">
        <div className="flex items-center gap-2 mb-3">
          <TriangleAlert className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold">关注时段</h2>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {warningHours.map((row) => (
            <div key={row.hour} className="rounded-md border bg-background p-3">
              <p className="text-xs font-medium">{row.hourLabel}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{row.alert}</p>
              <p className="text-[10px] text-muted-foreground mt-2">风速 {row.windSpeed.toFixed(1)} m/s · 云量 {row.cloudCover}% · 降水 {row.precipitation.toFixed(1)} mm</p>
              <p className="text-[10px] text-muted-foreground mt-1">来源：公开API / 页面抓取 · 规则计算</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}