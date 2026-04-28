import { Construction, TriangleAlert } from "lucide-react";

const features = [
  "自动报价",
  "自动售卖",
  "自动买入",
  "自动卖出",
  "挂单",
  "量化执行",
];

export default function Trading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">交易执行</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {features.map((f) => (
          <div key={f} className="p-4 rounded-lg shadow-notion bg-card text-center">
            <Construction className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">{f}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg shadow-notion bg-card p-12 text-center space-y-3">
        <Construction className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-semibold">自动报价机器人 · On queue / 待排期</h2>
        <p className="text-sm text-muted-foreground">
          自动报价、自动售卖、自动买入、自动卖出、挂单、量化执行列入 SP3 排期池
        </p>
        <div className="inline-flex items-center gap-1.5 text-xs text-warning rounded-md bg-warning/10 px-3 py-1.5">
          <TriangleAlert className="h-3.5 w-3.5" />
          当前状态：On queue / 待排期，非永久暂停
        </div>
      </div>
    </div>
  );
}
