import { PlaceholderPage } from "@/components/PlaceholderPage";
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

const events: Record<number, { color: string }> = {
  14: { color: "bg-primary" },
  15: { color: "bg-primary" },
  18: { color: "bg-warning" },
  19: { color: "bg-warning" },
};

export default function TradeCalendar() {
  return (
    <PlaceholderPage
      title="交易日历"
      description="交易事件日历"
    >
      <div className="rounded-lg shadow-notion bg-card p-5 mb-6">
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
            <div key={i} className="text-center py-3 text-sm relative">
              {day && (
                <>
                  <span className={day === 15 ? "font-semibold text-primary" : ""}>{day}</span>
                  {events[day] && (
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${events[day].color}`} />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </PlaceholderPage>
  );
}
