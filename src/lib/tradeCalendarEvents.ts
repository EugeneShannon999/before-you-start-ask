export type CalendarEventSource = "平台API" | "Excel上传" | "图片OCR" | "内置样例";

export interface TradeCalendarEvent {
  id: string;
  date: string;
  type: "申报" | "结算" | "公告" | "合同" | "出清";
  title: string;
  startTime: string;
  endTime: string;
  provinceMarket: string;
  remindAt: string;
  source: CalendarEventSource;
}

export const defaultTradeCalendarEvents: TradeCalendarEvent[] = [
  { id: "evt-1", date: "2025-07-03", type: "申报", title: "月度竞价申报截止", startTime: "09:00", endTime: "17:00", provinceMarket: "安徽电力市场", remindAt: "提前1日 09:00", source: "平台API" },
  { id: "evt-2", date: "2025-07-07", type: "申报", title: "周竞价申报", startTime: "09:30", endTime: "16:00", provinceMarket: "安徽电力市场", remindAt: "提前4小时", source: "平台API" },
  { id: "evt-3", date: "2025-07-14", type: "出清", title: "月度竞价出清", startTime: "10:00", endTime: "12:00", provinceMarket: "安徽电力市场", remindAt: "提前2小时", source: "平台API" },
  { id: "evt-4", date: "2025-07-15", type: "合同", title: "中长期合同签订", startTime: "09:00", endTime: "18:00", provinceMarket: "安徽电力市场", remindAt: "提前1日 10:00", source: "平台API" },
  { id: "evt-5", date: "2025-07-18", type: "申报", title: "周竞价申报（第3周）", startTime: "09:30", endTime: "16:00", provinceMarket: "安徽电力市场", remindAt: "提前4小时", source: "平台API" },
  { id: "evt-6", date: "2025-07-19", type: "结算", title: "偏差考核结算数据发布", startTime: "10:00", endTime: "11:00", provinceMarket: "安徽电力市场", remindAt: "提前2小时", source: "平台API" },
  { id: "evt-7", date: "2025-07-22", type: "结算", title: "6月月结算数据正式发布", startTime: "10:00", endTime: "12:00", provinceMarket: "安徽电力市场", remindAt: "提前2小时", source: "平台API" },
  { id: "evt-8", date: "2025-07-25", type: "公告", title: "8月月度集中竞价交易公告", startTime: "15:00", endTime: "16:00", provinceMarket: "安徽电力市场", remindAt: "提前1小时", source: "平台API" },
  { id: "evt-9", date: "2025-07-28", type: "申报", title: "月度竞价申报开始", startTime: "09:00", endTime: "17:00", provinceMarket: "安徽电力市场", remindAt: "提前1日 09:00", source: "平台API" },
];

const typeKeywords: Array<[TradeCalendarEvent["type"], RegExp]> = [
  ["结算", /结算|考核/],
  ["公告", /公告|通知/],
  ["合同", /合同|签订/],
  ["出清", /出清/],
  ["申报", /申报|竞价/],
];

function inferType(title: string): TradeCalendarEvent["type"] {
  return typeKeywords.find(([, re]) => re.test(title))?.[0] ?? "公告";
}

export function parseTradeCalendarCsv(text: string, source: CalendarEventSource = "Excel上传"): TradeCalendarEvent[] {
  const rows = text.split(/\r?\n/).map((line) => line.split(/,|\t/).map((v) => v.trim())).filter((row) => row.some(Boolean));
  if (rows.length < 2) return [];
  const header = rows[0];
  const pick = (row: string[], names: string[]) => {
    const index = header.findIndex((h) => names.some((name) => h.includes(name)));
    return index >= 0 ? row[index] : "";
  };
  return rows.slice(1).map((row, idx) => {
    const title = pick(row, ["标题", "事件", "事项"]) || row[1] || "交易日历事件";
    const date = pick(row, ["日期", "交易日"]) || row[0] || "2025-07-01";
    return {
      id: `upload-${Date.now()}-${idx}`,
      date: date.replaceAll("/", "-").slice(0, 10),
      type: (pick(row, ["类型"]) as TradeCalendarEvent["type"]) || inferType(title),
      title,
      startTime: pick(row, ["开始"]) || "09:00",
      endTime: pick(row, ["结束"]) || "17:00",
      provinceMarket: pick(row, ["省份", "市场"]) || "安徽电力市场",
      remindAt: pick(row, ["提醒"]) || "提前2小时",
      source,
    };
  });
}