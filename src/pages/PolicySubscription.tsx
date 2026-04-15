import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const regions = [
  { id: "national", label: "全国", checked: true },
  { id: "anhui", label: "安徽", checked: true },
  { id: "shandong", label: "山东", checked: true },
  { id: "fujian", label: "福建", checked: false },
  { id: "zhejiang", label: "浙江", checked: false },
  { id: "jiangsu", label: "江苏", checked: false },
  { id: "guangdong", label: "广东", checked: false },
  { id: "sichuan", label: "四川", checked: false },
];

const topics = [
  { id: "spot", label: "现货交易规则", checked: true },
  { id: "medium", label: "中长期交易", checked: true },
  { id: "settlement", label: "结算规则", checked: true },
  { id: "auxiliary", label: "辅助服务", checked: false },
  { id: "access", label: "市场准入", checked: false },
  { id: "price", label: "价格机制", checked: true },
];

const sources = [
  { id: "exchange", label: "交易中心公告", checked: true },
  { id: "energy", label: "省能源局", checked: true },
  { id: "ndrc", label: "发改委", checked: true },
  { id: "newspaper", label: "电力报", checked: false },
  { id: "qiushi", label: "求是", checked: false },
  { id: "other", label: "其他媒体", checked: false },
];

export default function PolicySubscription() {
  const navigate = useNavigate();
  const [regionState, setRegionState] = useState(regions);
  const [topicState, setTopicState] = useState(topics);
  const [sourceState, setSourceState] = useState(sources);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [popupEnabled, setPopupEnabled] = useState(true);

  const toggleItem = (
    setState: React.Dispatch<React.SetStateAction<typeof regions>>,
    id: string
  ) => {
    setState((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const renderCheckboxGroup = (
    title: string,
    items: typeof regions,
    setState: React.Dispatch<React.SetStateAction<typeof regions>>
  ) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="p-4 rounded-lg shadow-notion bg-card">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleItem(setState, item.id)}
              />
              <span className="text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/ai/policy")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <h1 className="text-xl font-semibold">订阅管理</h1>
      </div>

      {renderCheckboxGroup("地区订阅", regionState, setRegionState)}
      {renderCheckboxGroup("主题订阅", topicState, setTopicState)}
      {renderCheckboxGroup("来源订阅", sourceState, setSourceState)}

      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3">推送设置</h3>
        <div className="p-4 rounded-lg shadow-notion bg-card space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">站内消息推送</Label>
            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">重要政策弹窗提醒</Label>
            <Switch checked={popupEnabled} onCheckedChange={setPopupEnabled} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/ai/policy")}>
          取消
        </Button>
        <Button onClick={() => navigate("/ai/policy")}>保存</Button>
      </div>
    </div>
  );
}
