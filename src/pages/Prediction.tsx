import { useState } from "react";

const loadData = [
  { hour: "00", actual: 2850, predicted: 2820 },
  { hour: "01", actual: 2680, predicted: 2710 },
  { hour: "02", actual: 2520, predicted: 2550 },
  { hour: "03", actual: 2410, predicted: 2430 },
  { hour: "04", actual: 2480, predicted: 2460 },
  { hour: "05", actual: 2650, predicted: 2620 },
  { hour: "06", actual: 3120, predicted: 3080 },
  { hour: "07", actual: 3560, predicted: 3520 },
  { hour: "08", actual: 3980, predicted: 3950 },
  { hour: "09", actual: 4250, predicted: 4200 },
  { hour: "10", actual: 4450, predicted: 4380 },
  { hour: "11", actual: 4320, predicted: 4350 },
  { hour: "12", actual: 4180, predicted: 4210 },
  { hour: "13", actual: 4050, predicted: 4080 },
  { hour: "14", actual: 4220, predicted: 4180 },
  { hour: "15", actual: 4380, predicted: 4350 },
  { hour: "16", actual: 4520, predicted: 4480 },
  { hour: "17", actual: 4680, predicted: 4650 },
  { hour: "18", actual: 4850, predicted: 4800 },
  { hour: "19", actual: 4620, predicted: 4580 },
  { hour: "20", actual: 4280, predicted: 4300 },
  { hour: "21", actual: 3850, predicted: 3880 },
  { hour: "22", actual: 3420, predicted: 3450 },
  { hour: "23", actual: 3050, predicted: 3080 },
];

const tabs = ["负荷预测", "新能源出力", "竞价空间", "价格预测", "因子分析"];

const metrics = [
  { label: "MAPE", value: "2.3%", desc: "平均绝对百分比误差" },
  { label: "RMSE", value: "45.2 MW", desc: "均方根误差" },
  { label: "准确率", value: "97.7%", desc: "96小时滚动" },
  { label: "数据覆盖", value: "100%", desc: "24/24小时" },
];

export default function Prediction() {
  const [activeTab, setActiveTab] = useState(0);
  const maxVal = Math.max(...loadData.map((d) => Math.max(d.actual, d.predicted)));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">算法预测</h1>

      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === i
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="p-4 rounded-lg shadow-notion bg-card">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-semibold mt-1">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* Load Chart */}
      <div className="rounded-lg shadow-notion bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">负荷预测 vs 实际（MW）</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded bg-primary" /> 实际
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded bg-primary/30" /> 预测
            </span>
          </div>
        </div>
        <div className="flex items-end gap-px h-44">
          {loadData.map((d) => (
            <div key={d.hour} className="flex-1 flex items-end gap-[1px] h-full">
              <div
                className="flex-1 bg-primary/30 rounded-t min-h-[2px]"
                style={{ height: `${(d.predicted / maxVal) * 100}%` }}
                title={`预测: ${d.predicted} MW`}
              />
              <div
                className="flex-1 bg-primary rounded-t min-h-[2px]"
                style={{ height: `${(d.actual / maxVal) * 100}%` }}
                title={`实际: ${d.actual} MW`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">00:00</span>
          <span className="text-[10px] text-muted-foreground">06:00</span>
          <span className="text-[10px] text-muted-foreground">12:00</span>
          <span className="text-[10px] text-muted-foreground">18:00</span>
          <span className="text-[10px] text-muted-foreground">23:00</span>
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-lg shadow-notion bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">时段</th>
              <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">预测(MW)</th>
              <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">实际(MW)</th>
              <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">偏差</th>
            </tr>
          </thead>
          <tbody>
            {loadData.slice(0, 8).map((d) => {
              const diff = d.actual - d.predicted;
              const pct = ((diff / d.predicted) * 100).toFixed(1);
              return (
                <tr key={d.hour} className="border-b last:border-b-0">
                  <td className="px-4 py-2">{d.hour}:00</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{d.predicted.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{d.actual.toLocaleString()}</td>
                  <td className={`px-4 py-2 text-right ${diff >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {diff >= 0 ? "+" : ""}{pct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
