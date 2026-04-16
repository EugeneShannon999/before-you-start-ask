import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const priceData = [
  { hour: "00:00", price: 285.3, change: -2.1 },
  { hour: "01:00", price: 272.1, change: -4.6 },
  { hour: "02:00", price: 258.7, change: -4.9 },
  { hour: "03:00", price: 245.2, change: -5.2 },
  { hour: "04:00", price: 252.8, change: 3.1 },
  { hour: "05:00", price: 268.4, change: 6.2 },
  { hour: "06:00", price: 312.5, change: 16.4 },
  { hour: "07:00", price: 356.2, change: 14.0 },
  { hour: "08:00", price: 398.7, change: 11.9 },
  { hour: "09:00", price: 425.3, change: 6.7 },
  { hour: "10:00", price: 445.1, change: 4.7 },
  { hour: "11:00", price: 412.8, change: -7.3 },
  { hour: "12:00", price: 378.5, change: -8.3 },
  { hour: "13:00", price: 365.2, change: -3.5 },
  { hour: "14:00", price: 382.1, change: 4.6 },
  { hour: "15:00", price: 401.7, change: 5.1 },
  { hour: "16:00", price: 435.6, change: 8.4 },
  { hour: "17:00", price: 468.9, change: 7.6 },
  { hour: "18:00", price: 502.3, change: 7.1 },
  { hour: "19:00", price: 485.1, change: -3.4 },
  { hour: "20:00", price: 442.7, change: -8.7 },
  { hour: "21:00", price: 398.4, change: -10.0 },
  { hour: "22:00", price: 345.6, change: -13.3 },
  { hour: "23:00", price: 302.1, change: -12.6 },
];

const summaryCards = [
  { label: "日前均价", value: "372.4", unit: "元/MWh", change: "+3.2%", up: true },
  { label: "实时均价", value: "368.1", unit: "元/MWh", change: "-1.1%", up: false },
  { label: "最大负荷", value: "4,523", unit: "MW", change: "+5.8%", up: true },
  { label: "新能源占比", value: "32.7", unit: "%", change: "+2.1%", up: true },
];

const announcements = [
  { title: "关于2025年7月第三周现货交易出清结果的公告", date: "07-15", source: "交易中心" },
  { title: "安徽省2025年8月月度集中竞价交易公告", date: "07-14", source: "交易中心" },
  { title: "关于调整2025年下半年中长期交易时间的通知", date: "07-12", source: "省能源局" },
  { title: "7月第二周电力市场运行周报", date: "07-11", source: "交易中心" },
];

export default function MarketInfo() {
  const [activeTab, setActiveTab] = useState<"public" | "spot">("public");
  const maxPrice = Math.max(...priceData.map((d) => d.price));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">市场信息</h1>

      <div className="flex gap-1 mb-6 border-b">
        {[
          { key: "public" as const, label: "公共信息" },
          { key: "spot" as const, label: "现货交易" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="p-4 rounded-lg shadow-notion bg-card">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className="text-lg font-semibold">{card.value}<span className="text-xs font-normal text-muted-foreground ml-1">{card.unit}</span></p>
            <p className={`text-xs mt-1 flex items-center gap-0.5 ${card.up ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
              {card.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {card.change}
            </p>
          </div>
        ))}
      </div>

      {/* Price Chart (simple bar) */}
      <div className="rounded-lg shadow-notion bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4">日前电价曲线（元/MWh）</h3>
        <div className="flex items-end gap-px h-40">
          {priceData.map((d) => (
            <div key={d.hour} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full rounded-t bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                style={{ height: `${(d.price / maxPrice) * 100}%` }}
                title={`${d.hour}: ${d.price} 元/MWh`}
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

      {/* Announcements */}
      <div className="rounded-lg shadow-notion bg-card p-5">
        <h3 className="text-sm font-semibold mb-3">最新公告</h3>
        <div className="space-y-2">
          {announcements.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <span className="text-sm truncate flex-1 mr-4">{a.title}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                <span>{a.source}</span>
                <span>{a.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
