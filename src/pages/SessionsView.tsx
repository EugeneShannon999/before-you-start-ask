import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Pin, PinOff, Pencil, Trash2, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useChatSessions, type ChatSession } from "@/lib/aiSessionStore";

/**
 * 听雨 - 全部会话总览页 (View All)
 * 入口：AppSidebar 最近会话 hover → "View All" 按钮
 * 顶栏：仅 搜索 + 新增对话
 * 列表项三点菜单：置顶（取消置顶）/ 重命名 / 删除
 */
export default function SessionsView() {
  const navigate = useNavigate();
  const { sessions, togglePin, rename, remove, create } = useChatSessions();
  const [q, setQ] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    const list = keyword
      ? sessions.filter((s) => s.title.toLowerCase().includes(keyword))
      : sessions;
    // 置顶在前，其余按时间倒序
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [sessions, q]);

  const handleNew = () => {
    const sess = create("新建会话");
    navigate(`/ai/policy?cap=policy&sid=${sess.id}`);
  };

  const handleOpen = (s: ChatSession) => {
    navigate(`/ai/policy?cap=policy&sid=${s.id}`);
  };

  const startRename = (s: ChatSession) => {
    setRenamingId(s.id);
    setRenameDraft(s.title);
  };

  const commitRename = () => {
    if (renamingId && renameDraft.trim()) {
      rename(renamingId, renameDraft.trim());
    }
    setRenamingId(null);
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col bg-background">
      {/* 顶栏：返回 + 搜索 + 新建 */}
      <header className="h-12 border-b flex items-center px-4 gap-2 shrink-0">
        <button
          onClick={() => navigate("/ai/policy?cap=policy")}
          className="h-7 w-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground"
          title="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-semibold mr-3">全部会话</h1>
        <div className="flex-1 max-w-md relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索会话标题…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <button
          onClick={handleNew}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs flex items-center gap-1 hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> 新增对话
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto py-6 px-4">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground">
              暂无匹配会话
            </div>
          ) : (
            <ul className="space-y-1">
              {filtered.map((s) => (
                <li
                  key={s.id}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-md border bg-card hover:border-primary/40 hover:shadow-notion transition-all"
                >
                  {s.pinned && (
                    <Pin className="h-3 w-3 text-primary shrink-0" />
                  )}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => renamingId !== s.id && handleOpen(s)}
                  >
                    {renamingId === s.id ? (
                      <Input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="h-6 text-xs"
                      />
                    ) : (
                      <p className="text-xs font-medium text-foreground truncate">
                        {s.title}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                      {new Date(s.updatedAt).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => togglePin(s.id)}>
                        {s.pinned ? (
                          <>
                            <PinOff className="h-3.5 w-3.5 mr-2" /> 取消置顶
                          </>
                        ) : (
                          <>
                            <Pin className="h-3.5 w-3.5 mr-2" /> 置顶
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => startRename(s)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" /> 重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => remove(s.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
