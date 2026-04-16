import { Construction, Zap, Clock, BarChart3, Shield } from "lucide-react";

const features = [
  { icon: Zap, title: "滚撮交易", desc: "实时撮合竞价交易" },
  { icon: Clock, title: "挂单操作", desc: "限价挂单与撤单管理" },
  { icon: BarChart3, title: "量化策略", desc: "自定义交易策略执行" },
  { icon: Shield, title: "交易监控", desc: "实时交易状态追踪" },
];

export default function Trading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">交易执行</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {features.map((f) => (
          <div key={f.title} className="p-4 rounded-lg shadow-notion bg-card text-center">
            <f.icon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium mb-1">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg shadow-notion bg-card p-12 text-center">
        <Construction className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-base font-semibold mb-2">🚧 功能开发中</h2>
        <p className="text-sm text-muted-foreground mb-2">
          该模块将在SP3版本中上线
        </p>
        <p className="text-xs text-muted-foreground">
          需要插件支持和U盾在线
        </p>
      </div>
    </div>
  );
}
