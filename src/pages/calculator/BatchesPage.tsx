import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Search, FileCheck2 } from "lucide-react";
import {
  mockDataBatches,
  batchTypeLabel,
  batchStatusLabel,
  DataBatch,
} from "@/lib/calculatorMocks";
import { toast } from "sonner";

const statusStyle = (s: string) => {
  switch (s) {
    case "confirmed":
      return "bg-success/10 text-success border-success/30";
    case "pending":
      return "bg-warning/10 text-warning border-warning/30";
    case "voided":
      return "bg-muted text-muted-foreground";
    case "failed":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-secondary text-foreground";
  }
};

export default function BatchesPage() {
  const [uploadType, setUploadType] = useState("raw_load");
  const [uploadMonth, setUploadMonth] = useState("2026-04");
  const [fileName, setFileName] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("2026-04");
  const [fileKeyword, setFileKeyword] = useState("");

  const [validated, setValidated] = useState<DataBatch | null>(mockDataBatches[0]);

  const filtered = useMemo(() => {
    return mockDataBatches.filter((b) => {
      if (typeFilter !== "all" && b.type !== typeFilter) return false;
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (monthFilter && !b.settleMonth.includes(monthFilter)) return false;
      if (fileKeyword && !b.fileName.includes(fileKeyword)) return false;
      return true;
    });
  }, [typeFilter, statusFilter, monthFilter, fileKeyword]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">数据批次</h1>
        <p className="text-sm text-muted-foreground mt-1">
          单页承载上传、预览校验、确认导入和批次追溯，适合作为管理员的导入中心。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* 上传区 */}
        <div className="lg:col-span-2 p-5 rounded-lg shadow-notion bg-card">
          <h3 className="text-sm font-semibold mb-4">上传区</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">批次类型</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(batchTypeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">结算月</Label>
              <Input
                className="h-9 mt-1"
                value={uploadMonth}
                onChange={(e) => setUploadMonth(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">选择文件</Label>
              <div className="mt-1">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background hover:bg-secondary cursor-pointer text-sm">
                  <Upload className="h-3.5 w-3.5" />
                  {fileName ?? "选择文件"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!fileName) {
                    toast.error("请先选择文件");
                    return;
                  }
                  toast.success("上传完成，已生成预览");
                  setValidated(mockDataBatches[0]);
                }}
              >
                上传并预览
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFileName(null)}>
                清空
              </Button>
            </div>
          </div>
        </div>

        {/* 校验结果面板 */}
        <div className="p-5 rounded-lg shadow-notion bg-card">
          <h3 className="text-sm font-semibold mb-4">校验结果面板</h3>
          {validated ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">{validated.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {batchTypeLabel[validated.type]} / {validated.settleMonth} / 状态{" "}
                {batchStatusLabel[validated.status]}
              </p>
              <div className="flex items-start gap-2 text-xs p-2 rounded bg-success/5 border border-success/20">
                <FileCheck2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-success">客户名称已标准化</p>
                  <p className="text-muted-foreground mt-0.5">
                    2 个客户名称经过映射后与主数据一致。
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => toast.success("批次已确认导入")}
                >
                  确认导入
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => toast.success("批次已作废")}
                >
                  作废批次
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">请先上传文件并预览</p>
          )}
        </div>
      </div>

      {/* 筛选区 */}
      <div className="p-4 rounded-lg shadow-notion bg-card mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <Label className="text-xs text-muted-foreground">批次类型</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {Object.entries(batchTypeLabel).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">状态</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {Object.entries(batchStatusLabel).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">结算月</Label>
            <Input
              className="h-9 mt-1"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">文件名</Label>
            <Input
              className="h-9 mt-1"
              placeholder="支持模糊查询"
              value={fileKeyword}
              onChange={(e) => setFileKeyword(e.target.value)}
            />
          </div>
          <Button size="sm" className="h-9">
            <Search className="h-3.5 w-3.5 mr-1.5" /> 查询
          </Button>
        </div>
      </div>

      {/* 批次列表 */}
      <div className="rounded-lg shadow-notion bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-xs text-muted-foreground">
              <th className="text-left px-4 py-2.5 font-medium">批次号</th>
              <th className="text-left px-4 py-2.5 font-medium">类型</th>
              <th className="text-left px-4 py-2.5 font-medium">结算月</th>
              <th className="text-left px-4 py-2.5 font-medium">文件名</th>
              <th className="text-left px-4 py-2.5 font-medium">状态</th>
              <th className="text-left px-4 py-2.5 font-medium">导入时间</th>
              <th className="text-right px-4 py-2.5 font-medium">行数</th>
              <th className="text-right px-4 py-2.5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b last:border-b-0 hover:bg-secondary/30">
                <td className="px-4 py-2.5 font-medium">{b.id}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{batchTypeLabel[b.type]}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.settleMonth}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.fileName}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className={statusStyle(b.status)}>
                    {batchStatusLabel[b.status]}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.importedAt}</td>
                <td className="px-4 py-2.5 text-right">{b.rows.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      className="text-primary hover:underline"
                      onClick={() => setValidated(b)}
                    >
                      校验结果
                    </button>
                    <button
                      className="text-foreground/70 hover:text-foreground disabled:opacity-40"
                      disabled={b.status !== "pending"}
                      onClick={() => toast.success(`${b.id} 已确认`)}
                    >
                      确认
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
