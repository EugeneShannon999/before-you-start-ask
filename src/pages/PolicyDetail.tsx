import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockPolicy = {
  id: "1",
  title: "安徽省电力市场2025年7月结算规则调整通知",
  region: "安徽",
  source: "省能源局",
  date: "2025-07-15 10:30",
  isFavorite: true,
  aiInterpretation: {
    coreChanges: [
      {
        title: "中长期曲线回收阈值调整",
        points: [
          "中午8小时（11:00-19:00）下偏差考核：55% → 50% [1]",
          "其他时段维持不变：上15%、下20%",
        ],
      },
      {
        title: "生效时间",
        points: ["2025年8月1日起执行 [2]"],
      },
    ],
    impact:
      "对于中午时段负偏差较大的用户，考核成本将有所降低。建议关注中午时段的交易策略调整。",
    uncertainties: ["月度回收是否同步调整 [TODO]"],
    references: [
      { id: "1", text: "原文第3段第2句" },
      { id: "2", text: "原文第5段第1句" },
    ],
  },
  originalText: `各市场主体：

根据安徽省电力市场运营需要，经研究决定对2025年7月份结算规则进行如下调整：

一、中长期曲线回收阈值调整
为适应市场运行实际情况，现对中长期曲线回收的偏差考核阈值进行调整。其中，中午8小时时段（11:00-19:00）的下偏差考核阈值由原55%调整为50%，其他时段的上偏差15%和下偏差20%的考核标准维持不变。

二、调整依据
本次调整系根据近期市场运行数据分析结果，中午时段新能源出力增加导致供需格局变化，需相应调整偏差考核参数。

三、生效时间
本通知自2025年8月1日起执行。

四、其他事项
请各市场主体做好相应调整准备，如有疑问请联系交易中心。

安徽省能源局
2025年7月15日`,
};

export default function PolicyDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"ai" | "original">("ai");
  const [isFavorite, setIsFavorite] = useState(mockPolicy.isFavorite);

  const policy = mockPolicy;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/ai/policy")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-warning"
          >
            <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h1 className="text-lg font-semibold mb-2">{policy.title}</h1>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
        <span>📍 {policy.region} · {policy.source}</span>
        <span>📅 {policy.date}</span>
      </div>

      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "ai"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          AI解读
        </button>
        <button
          onClick={() => setActiveTab("original")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "original"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          原文
        </button>
      </div>

      {activeTab === "ai" ? (
        <div className="space-y-6">
          <div className="p-5 rounded-lg shadow-notion bg-card">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              📌 核心变化
            </h3>
            {policy.aiInterpretation.coreChanges.map((change, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="text-sm font-medium mb-1.5">
                  {i + 1}. {change.title}
                </p>
                <ul className="space-y-1 pl-4">
                  {change.points.map((point, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-lg shadow-notion bg-card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              💡 影响分析
            </h3>
            <p className="text-sm text-muted-foreground">{policy.aiInterpretation.impact}</p>
          </div>

          <div className="p-5 rounded-lg shadow-notion bg-card">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              ⚠️ 原文未明确说明的内容
            </h3>
            <ul className="space-y-1">
              {policy.aiInterpretation.uncertainties.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-warning shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">📎 引用来源</h4>
            {policy.aiInterpretation.references.map((ref) => (
              <button
                key={ref.id}
                onClick={() => setActiveTab("original")}
                className="block text-sm text-primary hover:underline mb-1"
              >
                [{ref.id}] {ref.text} → 点击查看
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-lg shadow-notion bg-card">
          <pre className="text-sm whitespace-pre-wrap leading-relaxed text-foreground font-sans">
            {policy.originalText}
          </pre>
        </div>
      )}
    </div>
  );
}
