import { useState } from "react";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PolicyMessage {
  id: string;
  title: string;
  summary: string;
  region: string;
  source: string;
  date: string;
  isRead: boolean;
  isFavorite: boolean;
  importance: "high" | "medium" | "low";
}

const mockPolicies: PolicyMessage[] = [
  {
    id: "1",
    title: "安徽省电力市场2025年7月结算规则调整通知",
    summary: "省能源局发布新规，调整中长期曲线回收阈值，中午8小时下偏差考核由55%调整为50%...",
    region: "安徽",
    source: "省能源局",
    date: "2025-07-15 10:30",
    isRead: false,
    isFavorite: true,
    importance: "high",
  },
  {
    id: "2",
    title: "全国电力市场统一规则征求意见稿发布",
    summary: "国家发改委发布全国统一电力市场规则征求意见，涉及现货交易、中长期交易、辅助服务等多个方面...",
    region: "全国",
    source: "发改委",
    date: "2025-07-14 16:00",
    isRead: false,
    isFavorite: false,
    importance: "high",
  },
  {
    id: "3",
    title: "山东省2025年8月集中竞价交易公告",
    summary: "山东电力交易中心发布8月集中竞价交易时间安排...",
    region: "山东",
    source: "交易中心",
    date: "2025-07-14 09:00",
    isRead: true,
    isFavorite: false,
    importance: "medium",
  },
  {
    id: "4",
    title: "广东省现货市场结算试运行方案（修订版）",
    summary: "广东电力交易中心发布现货市场结算试运行方案修订版，新增偏差考核分段机制...",
    region: "广东",
    source: "交易中心",
    date: "2025-07-13 14:20",
    isRead: true,
    isFavorite: true,
    importance: "medium",
  },
  {
    id: "5",
    title: "浙江省2025年下半年中长期交易规则补充通知",
    summary: "浙江省能源局发布下半年中长期交易规则补充，明确分时段交易量约束和偏差处理方式...",
    region: "浙江",
    source: "省能源局",
    date: "2025-07-12 11:00",
    isRead: true,
    isFavorite: false,
    importance: "low",
  },
];

type TabType = "all" | "unread" | "favorite";

export default function PolicyCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [policies, setPolicies] = useState(mockPolicies);

  const filteredPolicies = policies.filter((p) => {
    if (activeTab === "unread" && p.isRead) return false;
    if (activeTab === "favorite" && !p.isFavorite) return false;
    if (searchQuery && !p.title.includes(searchQuery) && !p.summary.includes(searchQuery)) return false;
    return true;
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "unread", label: "未读" },
    { key: "favorite", label: "已收藏" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">政策AI</h1>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索政策..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-none h-9"
          />
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        <Select>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="全部来源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部来源</SelectItem>
            <SelectItem value="energy">省能源局</SelectItem>
            <SelectItem value="ndrc">发改委</SelectItem>
            <SelectItem value="exchange">交易中心</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="全部地区" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部地区</SelectItem>
            <SelectItem value="national">全国</SelectItem>
            <SelectItem value="anhui">安徽</SelectItem>
            <SelectItem value="shandong">山东</SelectItem>
            <SelectItem value="guangdong">广东</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="全部主题" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部主题</SelectItem>
            <SelectItem value="spot">现货交易</SelectItem>
            <SelectItem value="medium">中长期交易</SelectItem>
            <SelectItem value="settlement">结算规则</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredPolicies.map((policy) => (
          <div
            key={policy.id}
            onClick={() => navigate(`/ai/policy/${policy.id}`)}
            className="p-4 rounded-lg shadow-notion bg-card cursor-pointer hover:shadow-md transition-shadow relative"
          >
            {!policy.isRead && (
              <span className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-destructive" />
            )}
            <h3 className="text-sm font-semibold mb-2 pl-3">{policy.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 pl-3 line-clamp-2">
              {policy.summary}
            </p>
            <div className="flex items-center justify-between pl-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>📍 {policy.region} · {policy.source}</span>
                <span>📅 {policy.date}</span>
              </div>
              <button
                onClick={(e) => toggleFavorite(policy.id, e)}
                className="text-warning hover:scale-110 transition-transform"
              >
                <Star
                  className="h-4 w-4"
                  fill={policy.isFavorite ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          暂无匹配的政策信息
        </div>
      )}
    </div>
  );
}
