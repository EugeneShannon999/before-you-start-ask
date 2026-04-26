import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileSpreadsheet, ImageUp, CheckCircle2 } from "lucide-react";
import { defaultTradeCalendarEvents, parseTradeCalendarCsv, type TradeCalendarEvent } from "@/lib/tradeCalendarEvents";

const days = ["一", "二", "三", "四", "五", "六", "日"];
const calendar = [
  [null, 1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13],
  [14, 15, 16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25, 26, 27],
  [28, 29, 30, 31, null, null, null],
];

const eventTone: Record<TradeCalendarEvent["type"], string> = {
  申报: "bg-primary",
  出清: "bg-primary",
  合同: "bg-success",
  公告: "bg-success",
  结算: "bg-warning",
};

export default function TradeCalendar() {
  const [events, setEvents] = useState<TradeCalendarEvent[]>(defaultTradeCalendarEvents);
  const [pendingOcr, setPendingOcr] = useState<TradeCalendarEvent | null>(null);
  const eventsByDay = useMemo(() => events.reduce<Record<number, TradeCalendarEvent[]>>((acc, e) => {
    const day = Number(e.date.slice(-2));
    acc[day] = [...(acc[day] ?? []), e];
    return acc;
  }, {}), [events]);
  const upcomingEvents = useMemo(() => events.filter((e) => e.date >= "2025-07-18").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6), [events]);

  const handleCalendarUpload = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseTradeCalendarCsv(text, "Excel上传");
    if (parsed.length) setEvents((prev) => [...prev, ...parsed]);
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    setPendingOcr({
      id: `ocr-${Date.now()}`,
      date: "2025-07-26",
      type: "公告",
      title: `${file.name} OCR待确认事件`,
      startTime: "09:00",
      endTime: "17:00",
      provinceMarket: "安徽电力市场",
      remindAt: "提前2小时",
      source: "图片OCR",
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold mb-4">交易日历</h1>

      <section className="rounded-lg shadow-notion bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold">事件源接入</p>
          <p className="text-xs text-muted-foreground mt-1">优先预留平台交易日历 API；Excel 上传生成事件；图片 OCR 后需人工确认。</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] px-2 py-1 rounded bg-secondary text-muted-foreground">平台API优先</span>
          <label className="h-8 px-3 rounded-md border inline-flex items-center gap-1.5 text-xs cursor-pointer hover:bg-secondary">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel上传
            <input type="file" accept=".csv,.tsv,.xls,.xlsx" className="hidden" onChange={(e) => handleCalendarUpload(e.target.files?.[0])} />
          </label>
          <label className="h-8 px-3 rounded-md border inline-flex items-center gap-1.5 text-xs cursor-pointer hover:bg-secondary">
            <ImageUp className="h-3.5 w-3.5" /> 图片OCR
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files?.[0])} />
          </label>
        </div>
        {pendingOcr && (
          <div className="w-full rounded-md border bg-background p-3 flex items-center justify-between gap-2 text-xs">
            <span>{pendingOcr.title} · {pendingOcr.date} {pendingOcr.startTime}-{pendingOcr.endTime}</span>
            <Button size="sm" onClick={() => { setEvents((prev) => [...prev, pendingOcr]); setPendingOcr(null); }}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />确认生成</Button>
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-[1fr,300px] gap-6">
        {/* Calendar */}
        <div className="rounded-lg shadow-notion bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-semibold">2025年7月</span>
            <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {days.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {calendar.flat().map((day, i) => (
              <div key={i} className="text-center py-3 text-sm relative group cursor-default">
                {day && (
                  <>
                    <span className={day === 15 ? "font-semibold text-primary" : ""}>{day}</span>
                    {eventsByDay[day] && (
                      <>
                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${eventTone[eventsByDay[day][0].type]}`} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-foreground text-background text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {eventsByDay[day].map((e) => e.title).join(" / ")}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> 交易申报</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(var(--success))]" /> 合同/公告</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[hsl(var(--warning))]" /> 结算</span>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-lg shadow-notion bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">近期事件</h3>
          <div className="space-y-3">
            {upcomingEvents.map((e, i) => (
              <div key={i} className="border-b last:border-b-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${eventTone[e.type]}`} />
                  <span className="text-xs text-muted-foreground">{e.date.slice(5)} · {e.startTime}-{e.endTime}</span>
                </div>
                <p className="text-sm pl-3.5">{e.title}</p>
                <p className="text-[10px] text-muted-foreground pl-3.5 mt-1">{e.type} · {e.provinceMarket} · {e.remindAt} · {e.source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
