import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MoreHorizontal,
  Pin,
  PinOff,
  Star,
  StarOff,
  Trash2,
  Sparkles,
  MessageSquare,
  Megaphone,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  useHistoricalPolicies,
  useChatSessions,
  type BulletinKind,
} from "@/lib/aiSessionStore";
import {
  useProvince,
  PROVINCE_LABEL,
  type ProvinceCode,
} from "@/contexts/ProvinceContext";

// ============================================================
// 布告栏（原 历史政策）
// - 顶部：图标 + 标题「布告栏」
// - 中间：居中搜索框
// - 右上：[ 全部 / 政策 / 公告 ] Tab + 省份下拉
// - 工具行：时间快捷筛选（近 7/30/90/180 天 / 全部）+ 仅未读
// - 列表：标题前显示 政策/公告 标签 + 未读小红点；点击行后标记为已读
// ============================================================

type KindFilter = "all" | BulletinKind;
type RangeFilter = "7" | "30" | "90" | "180" | "all";

const KIND_KEY = "lovable.bulletin.kind";
const RANGE_KEY = "lovable.bulletin.range";

const RANGE_OPTIONS: { value: RangeFilter; label: string }[] = [
  { value: "7", label: "近 7 天" },
  { value: "30", label: "近 30 天" },
  { value: "90", label: "近 3 个月" },
  { value: "180", label: "近半年" },
  { value: "all", label: "全部时间" },
];

export default function PoliciesListView() {
  const navigate = useNavigate();
  const { province, setProvince } = useProvince();
  const { policies, toggleStar, togglePin, removeMany, markRead, markAllRead } =
    useHistoricalPolicies();
  const { create } = useChatSessions();

  // ---- 过滤状态（带记忆） ----
  const [kind, setKind] = useState<KindFilter>(() => {
    if (typeof window === "undefined") return "all";
    const v = window.localStorage.getItem(KIND_KEY) as KindFilter | null;
    return v ?? "all";
  });
  const [range, setRange] = useState<RangeFilter>(() => {
    if (typeof window === "undefined") return "all";
    const v = window.localStorage.getItem(RANGE_KEY) as RangeFilter | null;
    return v ?? "all";
  });
  useEffect(() => {
    window.localStorage.setItem(KIND_KEY, kind);
  }, [kind]);
  useEffect(() => {
    window.localStorage.setItem(RANGE_KEY, range);
  }, [range]);

  const [q, setQ] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    const now = Date.now();
    const rangeMs =
      range === "all" ? Infinity : Number(range) * 24 * 60 * 60 * 1000;
    return policies
      .filter((p) => p.province === "all" || p.province === province)
      .filter((p) => (kind === "all" ? true : p.kind === kind))
      .filter((p) => (unreadOnly ? !p.read : true))
      .filter((p) =>
        rangeMs === Infinity
          ? true
          : now - new Date(p.publishedAt).getTime() <= rangeMs
      )
      .filter((p) => (keyword ? p.title.toLowerCase().includes(keyword) : true))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return b.publishedAt.localeCompare(a.publishedAt);
      });
  }, [policies, province, q, kind, range, unreadOnly]);

  const unreadCount = useMemo(
    () => visible.filter((p) => !p.read).length,
    [visible]
  );

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const handleOpenChat = (id: string, title: string) => {
    markRead(id);
    const sess = create(`政策解读：${title}`);
    navigate(`/ai/policy?sid=${sess.id}&pid=${id}`);
  };

  const handleAnalyze = (id: string) => {
    markRead(id);
    navigate(`/ai/policy?pid=${id}`);
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-background">
      {/* 顶栏：标题（左） + 三段 Tab（中右） + 省份下拉（最右） */}
      <header className="h-12 border-b flex items-center px-5 gap-3 shrink-0">
        <Megaphone className="h-4 w-4 text-primary shrink-0" />
        <h1 className="text-sm font-semibold shrink-0">布告栏</h1>
        {unreadCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground tabular-nums">
            {unreadCount} 未读
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* 三段 Tab：全部 / 政策 / 公告 */}
          <div className="inline-flex items-center rounded-md border bg-card p-0.5 h-8 text-xs">
            {([
              { v: "all", label: "全部" },
              { v: "policy", label: "政策" },
              { v: "notice", label: "公告" },
            ] as { v: KindFilter; label: string }[]).map((t) => (
              <button
                key={t.v}
                onClick={() => setKind(t.v)}
                className={`h-7 px-3 rounded transition-colors ${
                  kind === t.v
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 省份下拉 */}
          <Select
            value={province}
            onValueChange={(v) => setProvince(v as ProvinceCode)}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PROVINCE_LABEL) as ProvinceCode[]).map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {PROVINCE_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* 工具栏：居中搜索 + 时间快捷 + 未读 + 批量 */}
      <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0">
        {/* 左侧：时间快捷 */}
        <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
          <SelectTrigger className="h-8 w-[120px] text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="text-xs">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`h-8 px-3 rounded-md text-xs border transition-colors ${
            unreadOnly
              ? "bg-primary/10 border-primary/40 text-primary"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          仅未读
        </button>

        {/* 中间：搜索框居中 */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-md relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索标题…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* 右侧：批量管理 / 全部已读 */}
        {multi ? (
          <>
            <span className="text-xs text-muted-foreground shrink-0">
              已选 {selected.size}
            </span>
            <button
              onClick={() => {
                if (selected.size > 0) {
                  removeMany([...selected]);
                  setSelected(new Set());
                }
                setMulti(false);
              }}
              disabled={selected.size === 0}
              className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs hover:opacity-90 disabled:opacity-40 shrink-0"
            >
              删除所选
            </button>
            <button
              onClick={() => {
                setMulti(false);
                setSelected(new Set());
              }}
              className="h-8 px-3 rounded-md border text-xs hover:bg-secondary shrink-0"
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => markAllRead(visible.map((p) => p.id))}
              disabled={unreadCount === 0}
              className="h-8 px-3 rounded-md border text-xs hover:bg-secondary text-muted-foreground shrink-0 flex items-center gap-1 disabled:opacity-40"
              title="将当前列表全部标记为已读"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              全部已读
            </button>
            <button
              onClick={() => setMulti(true)}
              className="h-8 px-3 rounded-md border text-xs hover:bg-secondary text-muted-foreground shrink-0"
            >
              批量管理
            </button>
          </>
        )}
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-5 px-5">
          {visible.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground">
              暂无符合条件的内容
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((p) => {
                const isSel = selected.has(p.id);
                const isNotice = p.kind === "notice";
                return (
                  <li
                    key={p.id}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:border-primary/40 hover:shadow-notion transition-all ${
                      isSel ? "border-primary/60 bg-primary/5" : ""
                    } ${!p.read ? "border-l-2 border-l-primary" : ""}`}
                  >
                    {multi && (
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4 accent-primary shrink-0"
                      />
                    )}

                    {/* 主体 */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() =>
                        multi ? toggleSelect(p.id) : handleAnalyze(p.id)
                      }
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {/* 未读小红点 */}
                        {!p.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                        )}
                        {/* 类型标签 */}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                            isNotice
                              ? "bg-warning/15 text-warning"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {isNotice ? "公告" : "政策"}
                        </span>
                        {p.pinned && (
                          <Pin className="h-3 w-3 text-primary shrink-0" />
                        )}
                        {p.starred && (
                          <Star className="h-3 w-3 fill-warning text-warning shrink-0" />
                        )}
                        <p
                          className={`text-sm truncate ${
                            p.read
                              ? "font-normal text-foreground/80"
                              : "font-medium text-foreground"
                          }`}
                        >
                          {p.title}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.oneLine}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1 tabular-nums">
                        <span>{p.source}</span>
                        <span>
                          {new Date(p.publishedAt).toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* 操作组 */}
                    {!multi && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => handleAnalyze(p.id)}
                          className="h-7 px-2.5 rounded-md text-xs flex items-center gap-1 border bg-card hover:bg-secondary"
                          title="AI 解读"
                        >
                          <Sparkles className="h-3 w-3 text-primary" />
                          解读
                        </button>
                        <button
                          onClick={() => handleOpenChat(p.id, p.title)}
                          className="h-7 px-2.5 rounded-md text-xs flex items-center gap-1 bg-primary text-primary-foreground hover:opacity-90"
                          title="开启对话"
                        >
                          <MessageSquare className="h-3 w-3" />
                          对话
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => markRead(p.id, !p.read)}
                            >
                              <CheckCheck className="h-3.5 w-3.5 mr-2" />
                              标记为{p.read ? "未读" : "已读"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStar(p.id)}>
                              {p.starred ? (
                                <>
                                  <StarOff className="h-3.5 w-3.5 mr-2" /> 取消星标
                                </>
                              ) : (
                                <>
                                  <Star className="h-3.5 w-3.5 mr-2" /> 加星标
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePin(p.id)}>
                              {p.pinned ? (
                                <>
                                  <PinOff className="h-3.5 w-3.5 mr-2" /> 取消置顶
                                </>
                              ) : (
                                <>
                                  <Pin className="h-3.5 w-3.5 mr-2" /> 置顶
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeMany([p.id])}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
