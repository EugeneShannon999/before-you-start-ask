import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function Prediction() {
  return (
    <PlaceholderPage
      title="算法预测"
      tabs={["负荷预测", "新能源出力", "竞价空间", "价格预测", "因子分析"]}
      description="算法预测模块"
      version="SP2版本"
      features={["负荷预测", "新能源出力预测", "竞价空间预测", "价格预测"]}
    />
  );
}
