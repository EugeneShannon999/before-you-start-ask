import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Check, AlertTriangle, X, FileSpreadsheet, Info, History } from "lucide-react";

type StepStatus = "active" | "completed" | "pending";

interface DataCard {
  id: string;
  title: string;
  status: "imported" | "partial" | "missing";
  description: string;
  detail?: string;
}

const initialData: DataCard[] = [
  { id: "contract", title: "中长期合约数据", status: "imported", description: "2025年7月 全月" },
  { id: "dayahead", title: "日前电量数据", status: "partial", description: "2025年7月 部分", detail: "缺少7月15-20日" },
  { id: "realtime", title: "实时电量数据", status: "imported", description: "2025年7月 全月", detail: "用户匹配：108/108" },
  { id: "pt", title: "PT售均数据", status: "missing", description: "" },
  { id: "plan", title: "用户套餐配置", status: "imported", description: "108家用户", detail: "固定价：65家 | PT售均：43家" },
];

const mockResults = {
  r1Total: "2,358,420.50",
  r1Change: "+12.3%",
  recoveryTotal: "125,680.30",
  recoveryChange: "-5.2%",
  profitTotal: "186,540.20",
  profitChange: "+8.7%",
  users: [
    { name: "用户A公司", plan: "固定价", volume: "1,250.5", profit: "45,230.50", avg: "36.17" },
    { name: "用户B公司", plan: "PT售均", volume: "980.2", profit: "32,150.80", avg: "32.80" },
    { name: "用户C公司", plan: "固定价", volume: "1,520.8", profit: "52,680.20", avg: "34.64" },
    { name: "用户D公司", plan: "固定价", volume: "860.3", profit: "28,420.10", avg: "33.03" },
    { name: "用户E公司", plan: "PT售均", volume: "1,100.0", profit: "38,058.60", avg: "34.60" },
  ],
};

export default function Calculator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [resultTab, setResultTab] = useState("profit");

  const steps = [
    { num: 1, label: "数据准备" },
    { num: 2, label: "参数配置" },
    { num: 3, label: "计算结果" },
  ];

  const getStepStatus = (num: number): StepStatus => {
    if (num < currentStep) return "completed";
    if (num === currentStep) return "active";
    return "pending";
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "imported": return <Check className="h-4 w-4 text-success" />;
      case "partial": return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "missing": return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "imported": return "已导入";
      case "partial": return "部分缺失";
      case "missing": return "未导入";
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">结算计算器</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-sm">
            <Info className="h-3.5 w-3.5 mr-1" /> 使用说明
          </Button>
          <Button variant="outline" size="sm" className="text-sm">
            <History className="h-3.5 w-3.5 mr-1" /> 历史
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-8 p-4 rounded-lg shadow-notion bg-card">
        {steps.map((step, i) => {
          const status = getStepStatus(step.num);
          return (
            <div key={step.num} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    status === "completed"
                      ? "bg-success text-success-foreground"
                      : status === "active"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {status === "completed" ? <Check className="h-3.5 w-3.5" /> : step.num}
                </div>
                <span className={`text-sm ${status === "active" ? "font-medium" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-16 h-px mx-4 ${status === "completed" ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Data Import */}
      {currentStep === 1 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">数据导入状态</h2>
            <Button variant="outline" size="sm" className="text-sm">
              从插件同步
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {initialData.map((card) => (
              <div key={card.id} className="p-4 rounded-lg shadow-notion bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">{card.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs">
                    {statusIcon(card.status)}
                    <span className={
                      card.status === "imported" ? "text-success" :
                      card.status === "partial" ? "text-warning" : "text-destructive"
                    }>
                      {statusLabel(card.status)}
                    </span>
                  </div>
                </div>
                {card.description && <p className="text-xs text-muted-foreground mb-1">{card.description}</p>}
                {card.detail && <p className="text-xs text-muted-foreground">{card.detail}</p>}
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    <Upload className="h-3 w-3 mr-1" />
                    {card.status === "missing" ? "上传" : "重新上传"}
                  </Button>
                  {card.status !== "missing" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7">查看</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep(2)}>下一步：参数配置</Button>
          </div>
        </div>
      )}

      {/* Step 2: Parameters */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="p-5 rounded-lg shadow-notion bg-card">
            <Label className="text-sm font-medium mb-2 block">计算月份</Label>
            <Select defaultValue="202507">
              <SelectTrigger className="w-48 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="202507">2025年7月</SelectItem>
                <SelectItem value="202506">2025年6月</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-5 rounded-lg shadow-notion bg-card">
            <h3 className="text-sm font-semibold mb-4">日前申报回收参数</h3>
            <div className="flex gap-6">
              <div>
                <Label className="text-xs text-muted-foreground">上偏差阈值</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input className="w-20 h-8 text-sm" defaultValue="15" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">下偏差阈值</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input className="w-20 h-8 text-sm" defaultValue="15" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg shadow-notion bg-card">
            <h3 className="text-sm font-semibold mb-4">中长期曲线回收参数</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">常规时段</p>
                <div className="flex gap-6">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs w-14">上偏差</Label>
                    <Input className="w-16 h-8 text-sm" defaultValue="15" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs w-14">下偏差</Label>
                    <Input className="w-16 h-8 text-sm" defaultValue="20" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">中午8小时</p>
                <div className="flex gap-6">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs w-14">上偏差</Label>
                    <Input className="w-16 h-8 text-sm" defaultValue="15" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs w-14">下偏差</Label>
                    <Input className="w-16 h-8 text-sm" defaultValue="55" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">中午时段范围：</Label>
                <Input className="w-20 h-8 text-sm" defaultValue="11:00" />
                <span className="text-xs">-</span>
                <Input className="w-20 h-8 text-sm" defaultValue="19:00" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-lg shadow-notion bg-card">
            <h3 className="text-sm font-semibold mb-4">月度回收（如有）</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox defaultChecked />
                <span className="text-sm">启用月度回收计算</span>
              </label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">分摊方式：</Label>
                <Select defaultValue="volume">
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volume">按电量均分</SelectItem>
                    <SelectItem value="ratio">按比例分摊</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>上一步</Button>
            <Button onClick={() => setCurrentStep(3)}>开始计算</Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">2025年7月 结算结果</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-sm">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> 导出Excel
              </Button>
              <Button variant="outline" size="sm" className="text-sm">JSON</Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg shadow-notion bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">R1电费总计</p>
              <p className="text-lg font-semibold">¥ {mockResults.r1Total}</p>
              <p className="text-xs text-success mt-1">↑ {mockResults.r1Change}</p>
            </div>
            <div className="p-4 rounded-lg shadow-notion bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">回收电费总计</p>
              <p className="text-lg font-semibold">¥ {mockResults.recoveryTotal}</p>
              <p className="text-xs text-destructive mt-1">↓ {mockResults.recoveryChange}</p>
            </div>
            <div className="p-4 rounded-lg shadow-notion bg-card text-center">
              <p className="text-xs text-muted-foreground mb-1">用户收益总计</p>
              <p className="text-lg font-semibold">¥ {mockResults.profitTotal}</p>
              <p className="text-xs text-success mt-1">↑ {mockResults.profitChange}</p>
            </div>
          </div>

          <div className="flex gap-1 mb-4 border-b">
            {["profit", "r1", "recovery", "hourly"].map((tab) => (
              <button
                key={tab}
                onClick={() => setResultTab(tab)}
                className={`px-3 py-2 text-sm border-b-2 transition-colors ${
                  resultTab === tab
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {tab === "profit" ? "用户收益" : tab === "r1" ? "R1明细" : tab === "recovery" ? "回收明细" : "逐时电价"}
              </button>
            ))}
          </div>

          <div className="rounded-lg shadow-notion bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">用户名称</th>
                  <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">套餐类型</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">电量(MWh)</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">收益(元)</th>
                  <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">均价</th>
                </tr>
              </thead>
              <tbody>
                {mockResults.users.map((user, i) => (
                  <tr key={i} className="border-b last:border-b-0 hover:bg-secondary/30">
                    <td className="px-4 py-2.5">{user.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{user.plan}</td>
                    <td className="text-right px-4 py-2.5">{user.volume}</td>
                    <td className="text-right px-4 py-2.5 font-medium">{user.profit}</td>
                    <td className="text-right px-4 py-2.5 text-muted-foreground">{user.avg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>重新计算</Button>
            <Button>保存结果</Button>
          </div>
        </div>
      )}
    </div>
  );
}
