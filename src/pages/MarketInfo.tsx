import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function MarketInfo() {
  return (
    <PlaceholderPage
      title="市场信息"
      tabs={["公共信息", "现货交易"]}
      description="市场公共信息与现货交易数据"
      features={["气象信息", "通知公告", "供需一览", "电价详情", "竞价空间"]}
    />
  );
}
