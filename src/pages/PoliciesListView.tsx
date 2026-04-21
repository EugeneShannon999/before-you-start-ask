import { useMemo, useState } from "react";
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
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useHistoricalPolicies, useChatSessions } from "@/lib/aiSessionStore";
import { useProvince } from "@/contexts/ProvinceContext";

/**
 * 听雨 - 历史政策列表（主工作区）
 * - 左侧栏只放「新建会话 / 历史政策」入口
 * - 进入此页后：右侧主区一行行展示该省份历史政策
 * - 单条操作：开启对话 / 加入复盘 / 星标 / 置顶 / 删除
 * - 顶部支持：搜索 + 多选批量删除
 */
export default function PoliciesListView() {
  const navigate = useNavigate();
  const { province, label: provinceLabel } = useProvince();
  const { policies, toggleStar, togglePin, removeMany } = useHistoricalPolicies();
  const { create } = useChatSessions();

  const [q, setQ] = useState("");
  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    return policies
      .filter((p) => p.province === "all" || p.province === province)
      .filter((p) => (keyword ? p.title.toLowerCase().includes(keyword) : true))
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.starred !== b.starred) return a.starred ? -1 : 1;
        return b.publishedAt.localeCompare(a.publishedAt);
      });
  }, [policies, province, q]);

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const handleOpenChat = (id: string, title: string) => {
    const sess = create(`政策解读：${title}`);
    navigate(`/ai/policy?sid=${sess.id}&pid=${id}`);
  };

  const handleAnalyze = (id: string) => {
    navigate(`/ai/policy?pid=${id}`);
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-background">
      {/* 顶栏 */}
      <header className="h-12 border-b flex items-center px-5 gap-2 shrink-0">
        <FileText className="h-4 w-4 text-primary" />
        <h1 className="text-sm font-semibold">历史政策</h1>
        <span className="text-xs text-muted-foreground ml-1">· 跟随当前省份</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
          当前省份：{provinceLabel}
        </span>
      </header>

      {/* 工具栏：搜索 + 批量 */}
      <div className="px-5 py-3 border-b flex items-center gap-2 shrink-0">
        <div className="flex-1 max-w-md relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索政策标题…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        {multi ? (
          <>
            <span className="text-xs text-muted-foreground">
              已选 {selected.size} 条
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
              className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs hover:opacity-90 disabled:opacity-40"
            >
              删除所选
            </button>
            <button
              onClick={() => {
                setMulti(false);
                setSelected(new Set());
              }}
              className="h-8 px-3 rounded-md border text-xs hover:bg-secondary"
            >
              取消
            </button>
          </>
        ) : (
          <button
            onClick={() => setMulti(true)}
            className="h-8 px-3 rounded-md border text-xs hover:bg-secondary text-muted-foreground"
          >
            批量管理
          </button>
        )}
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-5 px-5">
          {visible.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground">
              当前省份暂无历史政策
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((p) => {
                const isSel = selected.has(p.id);
                return (
                  <li
                    key={p.id}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:border-primary/40 hover:shadow-notion transition-all ${
                      isSel ? "border-primary/60 bg-primary/5" : ""
                    }`}
                  >
                    {multi && (
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4 accent-primary shrink-0"
                      />
                    )}

                    {/* 主体：标题 + 元信息 */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => (multi ? toggleSelect(p.id) : handleAnalyze(p.id))}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {p.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                        {p.starred && (
                          <Star className="h-3 w-3 fill-warning text-warning shrink-0" />
                        )}
                        <p className="text-sm font-medium text-foreground truncate">
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

                    {/* 操作按钮组 */}
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
