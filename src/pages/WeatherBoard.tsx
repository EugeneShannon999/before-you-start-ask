import { useMemo, useState } from "react";
import { CloudRain, CloudSun, Gauge, RadioTower, TriangleAlert, Wind } from "lucide-react";
import { weather24, weatherSources, type WeatherPoint } from "@/lib/marketMocks";

const sourceOptions = weatherSources.map((item) => item.name);
const groupOptions = ["光伏相关", "负荷相关", "降水相关", "风电相关"];
const pointOptions = ["全省代表值", "新能源场站 / 区域点位", "负荷中心点位"];
const granularityOptions = ["小时", "15分钟", "日内"];

const fieldGroups = {
  光伏相关: ["直接辐射", "短波辐射", "低云量", "中云量", "高云量", "总云量"],
  负荷相关: ["2米气温", "2米相对湿度", "2米露点温度"],
  降水相关: ["降雨量", "地表总降水率"],
  风电相关: ["10米风", "100米风", "风速由 U/V 分量计算"],
};

const weatherFieldCatalog = [
  { label: "直接辐射", group: "光伏", source: "公开API", getValue: (row: WeatherPoint) => formatValue(row.directRadiation, " W/㎡") },
  { label: "短波辐射", group: "光伏", source: "公开API", getValue: (row: WeatherPoint) => formatValue(row.shortwaveRadiation, " W/㎡") },
  { label: "低云量", group: "光伏", source: "页面抓取", getValue: (row: WeatherPoint) => `${row.lowCloudCover}%` },
  { label: "中云量", group: "光伏", source: "页面抓取", getValue: (row: WeatherPoint) => `${row.midCloudCover}%` },
  { label: "高云量", group: "光伏", source: "页面抓取", getValue: (row: WeatherPoint) => `${row.highCloudCover}%` },
  { label: "总云量", group: "光伏", source: "页面抓取", getValue: (row: WeatherPoint) => `${row.cloudCover}%` },
  { label: "2米气温", group: "负荷", source: "公开API", getValue: (row: WeatherPoint) => `${row.temperature}℃` },
  { label: "2米相对湿度", group: "负荷", source: "公开API", getValue: (row: WeatherPoint) => `${row.humidity2m}%` },
  { label: "2米露点温度", group: "负荷", source: "公开API", getValue: (row: WeatherPoint) => `${row.dewPoint2m}℃` },
  { label: "降雨量", group: "降水", source: "页面抓取", getValue: (row: WeatherPoint) => `${row.precipitation.toFixed(1)} mm` },
  { label: "地表总降水率", group: "降水", source: "页面抓取", getValue: (row: WeatherPoint) => `${row.surfacePrecipRate.toFixed(2)} mm/h` },
  { label: "10米风", group: "风电", source: "公开API", getValue: (row: WeatherPoint) => `${row.wind10mSpeed.toFixed(1)} m/s` },
  { label: "100米风", group: "风电", source: "规则计算", getValue: (row: WeatherPoint) => `${row.wind100mSpeed.toFixed(1)} m/s` },
  { label: "风速由 U/V 分量计算", group: "风电", source: "规则计算", getValue: (row: WeatherPoint) => `${row.wind100mSpeed.toFixed(1)} m/s` },
  { label: "综合预警等级", group: "预警", source: "规则计算", getValue: (row: WeatherPoint) => row.warningLevel },
];

const weatherLinks = [
  { title: "气象异常", desc: "云量、辐射、风速、降水与温度进入规则计算。", source: "公开API / 页面抓取" },
  { title: "新能源预测偏差", desc: "光伏侧看辐射与云量，风电侧看10米/100米风速。", source: "规则计算" },
  { title: "负荷偏差", desc: "2米气温、湿度与露点温度用于判断体感负荷压力。", source: "规则计算" },
  { title: "竞价空间", desc: "新能源或负荷偏差同向叠加时，竞价空间提示升级。", source: "规则计算" },
  { title: "交易策略", desc: "异常与偏差同向时提高提醒优先级，进入交易前判断。", source: "规则计算" },
];

const formatValue = (value: number, unit: string) => `${value.toLocaleString()}${unit}`;

function getLinkedWeatherRows(rows: WeatherPoint[], source: string, pointScope: string, granularity: string) {
  const sourceFactor = source === "中科天机" ? 1.04 : 1;
  const pointFactor = pointScope === "新能源场站 / 区域点位" ? 1.08 : pointScope === "负荷中心点位" ? 0.96 : 1;
  const adjusted = rows.map((row) => ({
    ...row,
    directRadiation: Math.round(row.directRadiation * (pointScope === "负荷中心点位" ? 0.92 : sourceFactor)),
    shortwaveRadiation: Math.round(row.shortwaveRadiation * sourceFactor),
    temperature: Math.round(row.temperature + (pointScope === "负荷中心点位" ? 1 : 0)),
    humidity2m: Math.min(99, Math.round(row.humidity2m * (source === "中科天机" ? 1.02 : 1))),
    precipitation: Number((row.precipitation * pointFactor).toFixed(1)),
    surfacePrecipRate: Number((row.surfacePrecipRate * pointFactor).toFixed(2)),
    wind10mSpeed: Number((row.wind10mSpeed * (pointScope === "新能源场站 / 区域点位" ? 1.12 : 1)).toFixed(1)),
    wind100mSpeed: Number((row.wind100mSpeed * (pointScope === "新能源场站 / 区域点位" ? 1.12 : 1)).toFixed(1)),
  }));
  if (granularity === "日内") return adjusted.filter((_, index) => index % 3 === 0);
  return adjusted;
}

function getCoreCards(row: WeatherPoint) {
  return [
    { label: "直接辐射", value: formatValue(row.directRadiation, " W/㎡"), group: "光伏", source: "公开API" },
    { label: "短波辐射", value: formatValue(row.shortwaveRadiation, " W/㎡"), group: "光伏", source: "公开API" },
    { label: "低云量", value: `${row.lowCloudCover}%`, group: "光伏", source: "页面抓取" },
    { label: "总云量", value: `${row.cloudCover}%`, group: "光伏", source: "页面抓取" },
    { label: "2米气温", value: `${row.temperature}℃`, group: "负荷", source: "公开API" },
    { label: "2米相对湿度", value: `${row.humidity2m}%`, group: "负荷", source: "公开API" },
    { label: "2米露点温度", value: `${row.dewPoint2m}℃`, group: "负荷", source: "公开API" },
    { label: "降雨量", value: `${row.precipitation.toFixed(1)} mm`, group: "降水", source: "页面抓取" },
    { label: "地表总降水率", value: `${row.surfacePrecipRate.toFixed(2)} mm/h`, group: "降水", source: "页面抓取" },
    { label: "10米风速", value: `${row.wind10mSpeed.toFixed(1)} m/s`, group: "风电", source: "公开API" },
    { label: "100米风速", value: `${row.wind100mSpeed.toFixed(1)} m/s`, group: "风电", source: "规则计算" },
    { label: "综合预警等级", value: row.warningLevel, group: "预警", source: "规则计算" },
  ];
}

function SegmentedControl({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1 rounded-md bg-secondary/45 p-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`h-7 rounded px-2.5 text-[12px] transition-colors ${value === option ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WeatherBoard() {
  const [source, setSource] = useState(sourceOptions[0]);
  const [fieldGroup, setFieldGroup] = useState(groupOptions[0]);
  const [pointScope, setPointScope] = useState(pointOptions[0]);
  const [granularity, setGranularity] = useState(granularityOptions[0]);

  const linkedWeather = useMemo(() => getLinkedWeatherRows(weather24, source, pointScope, granularity), [source, pointScope, granularity]);
  const current = useMemo(() => linkedWeather.find((row) => row.warningLevel === "市场级提示") ?? linkedWeather.find((row) => row.warningLevel === "区域提示") ?? linkedWeather[0], [linkedWeather]);
  const coreCards = useMemo(() => getCoreCards(current), [current]);
  const warningRows = linkedWeather.filter((row) => row.warningLevel !== "正常").slice(0, 6);

  return (
    <div className="px-6 py-5 space-y-4">
      <header className="rounded-lg border bg-card p-4 shadow-notion space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold">气象看板</h1>
            <p className="text-xs text-muted-foreground mt-1">交易前判断入口：气象 → 新能源预测 → 市场数据 → 竞价空间 → 电价关系 → 策略。</p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded bg-secondary text-muted-foreground">规则计算 · 阈值配置预留</span>
        </div>

        <div className="rounded-md border bg-background p-3 text-[11px] text-muted-foreground leading-relaxed">
          当前为框架演示：数据源、点位口径、时间粒度会联动影响展示值与关注时段；区域暴露权重能力已预留，尚未按装机容量或负荷暴露加权。
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          {weatherSources.map((item) => (
            <div key={item.name} className={`rounded-md border p-3 ${source === item.name ? "bg-primary/5 border-primary/25" : "bg-background"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">来源：{item.source}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-4">
          <SegmentedControl label="数据源切换" options={sourceOptions} value={source} onChange={setSource} />
          <SegmentedControl label="字段分组切换" options={groupOptions} value={fieldGroup} onChange={setFieldGroup} />
          <SegmentedControl label="点位口径切换" options={pointOptions} value={pointScope} onChange={setPointScope} />
          <SegmentedControl label="时间粒度切换" options={granularityOptions} value={granularity} onChange={setGranularity} />
        </div>

        <div className="rounded-md border bg-background p-3">
          <p className="text-xs font-medium">{fieldGroup}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {fieldGroups[fieldGroup as keyof typeof fieldGroups].map((field) => (
              <span key={field} className="rounded bg-secondary px-2 py-1 text-[11px] text-muted-foreground">{field}</span>
            ))}
          </div>
        </div>
      </header>

      <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold">核心气象卡片</h2>
          <span className="text-[11px] text-muted-foreground">当前口径：{pointScope} · {granularity}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {coreCards.map((item) => (
            <div key={item.label} className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] text-muted-foreground">{item.label}</p>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.group}</span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-normal">{item.value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">来源：{item.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold">预警区</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-md border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">当前预警等级</p>
              <p className="mt-2 text-xl font-semibold">{current.warningLevel}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">官方等级优先；无官方等级时进入规则计算。</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">触发原因</p>
              <p className="mt-2 text-sm font-medium">{current.triggerReason}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">业务阈值优先；无业务阈值时用近30/90天同小时段 P90/P95 兜底。</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">影响区域</p>
              <p className="mt-2 text-sm font-medium">{current.affectedArea}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">单点超阈值为区域提示，多区域同超阈值升级市场级提示。</p>
            </div>
            <div className="rounded-md border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">影响对象</p>
              <p className="mt-2 text-sm font-medium">{current.impactTarget}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{current.priorityHint}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">影响说明</h2>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>低云量、总云量抬升且直接辐射走弱时，更可能影响光伏出力。</p>
            <p>100米风速波动扩大时，更可能影响风电侧预测稳定性。</p>
            <p>2米气温、相对湿度、露点温度共同偏离时，更可能影响负荷兑现。</p>
            <p>气象异常与新能源预测偏差或负荷偏差同向叠加时，提高提醒优先级并进入市场波动判断。</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-notion space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold">联动提示</h2>
          <span className="text-[11px] text-muted-foreground">气象异常同向叠加时提升 P0 / P1 提醒优先级</span>
        </div>
        <div className="grid gap-2 xl:grid-cols-5">
          {weatherLinks.map((item) => (
            <div key={item.title} className="rounded-md border bg-background p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <RadioTower className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-medium">{item.title}</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
              <span className="text-[10px] text-muted-foreground">{item.source}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-card shadow-notion overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold">24小时交易气象矩阵</h2>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span>保留字段：直接辐射 / 2米露点温度 / 2米气温 / 2米相对湿度 / 低云量 / 降雨量</span>
            <span className="px-1.5 py-0.5 rounded bg-secondary">公开API + 页面抓取 + 规则计算</span>
          </div>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-secondary/50 z-10">
              <tr>
                <th className="text-left px-4 py-2">时段</th>
                <th className="text-right px-4 py-2">直接辐射</th>
                <th className="text-right px-4 py-2">2米露点</th>
                <th className="text-right px-4 py-2">2米气温</th>
                <th className="text-right px-4 py-2">2米湿度</th>
                <th className="text-right px-4 py-2">低云量</th>
                <th className="text-right px-4 py-2">降雨量</th>
                <th className="text-right px-4 py-2">100米风</th>
                <th className="text-left px-4 py-2">预警等级</th>
                <th className="text-left px-4 py-2">影响对象</th>
                <th className="text-left px-4 py-2">来源</th>
              </tr>
            </thead>
            <tbody>
              {linkedWeather.map((row) => (
                <tr key={row.hour} className="border-t hover:bg-secondary/30">
                  <td className="px-4 py-2 font-mono">{row.hourLabel}</td>
                  <td className="px-4 py-2 text-right">{row.directRadiation}</td>
                  <td className="px-4 py-2 text-right">{row.dewPoint2m}℃</td>
                  <td className="px-4 py-2 text-right">{row.temperature}℃</td>
                  <td className="px-4 py-2 text-right">{row.humidity2m}%</td>
                  <td className="px-4 py-2 text-right">{row.lowCloudCover}%</td>
                  <td className="px-4 py-2 text-right">{row.precipitation.toFixed(1)}</td>
                  <td className="px-4 py-2 text-right"><span className="inline-flex items-center justify-end gap-1"><Wind className="h-3 w-3 text-muted-foreground" />{row.wind100mSpeed.toFixed(1)}</span></td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 ${row.warningLevel === "正常" ? "text-muted-foreground" : "text-destructive"}`}>
                      {row.warningLevel === "正常" ? <CloudSun className="h-3 w-3" /> : <CloudRain className="h-3 w-3" />}
                      {row.warningLevel}
                    </span>
                  </td>
                  <td className="px-4 py-2">{row.impactTarget}</td>
                  <td className="px-4 py-2 text-muted-foreground">公开API / 页面抓取 / 规则计算</td>
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
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {warningRows.map((row) => (
            <div key={row.hour} className="rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{row.hourLabel}</p>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">{row.warningLevel}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{row.alert}</p>
              <p className="text-[10px] text-muted-foreground mt-2">影响：{row.impactTarget} · 区域：{row.affectedArea}</p>
              <p className="text-[10px] text-muted-foreground mt-1">来源：公开API / 页面抓取 · 规则计算</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
