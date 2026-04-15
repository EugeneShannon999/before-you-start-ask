import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function Trading() {
  return (
    <PlaceholderPage
      title="交易执行"
      tabs={["滚撮交易", "挂单操作", "量化策略", "交易监控"]}
      description="交易执行模块"
      version="SP3版本"
      features={["需要插件支持和U盾在线"]}
    />
  );
}
