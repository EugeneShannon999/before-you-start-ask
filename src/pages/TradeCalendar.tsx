import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const days = ["一", "二", "三", "四", "五", "六", "日"];
const calendar = [
  [null, 1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12, 13],
  [14, 15, 16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25, 26, 27],
  [28, 29, 30, 31, null, null, null],
];

const events: Record<number, { label: string; color: string }> = {
  3: { label: "月度竞价申报截止", color: "bg-primary" },
  7: { label: "周竞价申报", color: "bg-primary" },
  14: { label: "月度竞价出清", color: "bg-primary" },
  15: { label: "中长期合同签订", color: "bg-[hsl(var(--success))]" },
  18: { label: "周竞价申报", color: "bg-primary" },
  19: { label: "偏差考核结算", color: "bg-[hsl(var(--warning))]" },
  22: { label: "月结算数据发布", color: "bg-[hsl(var(--warning))]" },
  25: { label: "下月竞价公告", color: "bg-primary" },
  28: { label: "月度竞价申报开始", color: "bg-[hsl(var(--success))]" },
};

const upcomingEvents = [
  { date: "07-18 周五", title: "周竞价申报（第3周）", type: "申报", typeColor: "bg-primary" },
  { date: "07-19 周六", title: "偏差考核结算数据发布", type: "结算", typeColor: "bg-[hsl(var(--warning))]" },
  { date: "07-22 周二", title: "6月月结算数据正式发布", type: "结算", typeColor: "bg-[hsl(var(--warning))]" },
  { date: "07-25 周五", title: "8月月度集中竞价交易公告", type: "公告", typeColor: "bg-[hsl(var(--success))]" },
];

export default function TradeCalendar() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">交易日历</h1>

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
                    {events[day] && (
                      <>
                        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${events[day].color}`} />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-foreground text-background text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {events[day].label}
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
                  <span className={`w-1.5 h-1.5 rounded-full ${e.typeColor}`} />
                  <span className="text-xs text-muted-foreground">{e.date}</span>
                </div>
                <p className="text-sm pl-3.5">{e.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
