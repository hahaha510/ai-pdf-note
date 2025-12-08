"use client";
import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, X, Tag, Filter, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateNoteDialog } from "./_components/CreateNoteDialog";
import { FilterDialog } from "./_components/FilterDialog";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AISearch } from "@/components/AISearch";
import { AIFeatures } from "@/components/AIFeatures";
import { NoteCardSkeleton } from "@/components/NoteCardSkeleton";
import { offlineStorage } from "@/lib/offlineStorage";
import { syncManager } from "@/lib/syncManager";
import { toast } from "sonner";
function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [viewMode, setViewMode] = useState("all"); // "all" | "pdf" | "note"
  const [offlineNotes, setOfflineNotes] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [searchMode, setSearchMode] = useState("normal"); // "normal" | "ai"

  const deleteNote = useMutation(api.workspaceNotes.deleteNote);
  const updateNote = useMutation(api.workspaceNotes.updateNote);
  const createNote = useMutation(api.workspaceNotes.createNote);

  useEffect(() => {
    setMounted(true);
    // 只在客户端访问 localStorage
    if (typeof window !== "undefined") {
      const userDataStr = localStorage.getItem("user");
      if (userDataStr && userDataStr !== "null" && userDataStr !== "undefined") {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData && userData.userName) {
            setUser(userData);
          } else {
            console.warn("Invalid user data in localStorage:", userData);
          }
        } catch (error) {
          console.error("Failed to parse user data:", error);
          // 清除损坏的数据
          localStorage.removeItem("user");
        }
      }
    }
  }, []);

  // 加载离线笔记（只在客户端）
  useEffect(() => {
    if (!mounted) return;

    const loadOfflineNotes = async () => {
      if (user) {
        const notes = await offlineStorage.getAllNotes(user.userName);
        setOfflineNotes(notes);
      }
    };
    loadOfflineNotes();

    // 定期刷新离线笔记
    const interval = setInterval(loadOfflineNotes, 3000);
    return () => clearInterval(interval);
  }, [user, mounted]);

  const handleDelete = async (noteId, noteTitle, e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`确定要删除笔记 "${noteTitle}" 吗？此操作无法撤销！`);
    if (!confirmed) return;

    try {
      // 从在线删除
      await deleteNote({ noteId });
      // 从离线存储删除
      await offlineStorage.deleteNote(noteId);
      toast.success("笔记已删除");

      // 刷新离线笔记
      const notes = await offlineStorage.getAllNotes(user.userName);
      setOfflineNotes(notes);
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  // 同步函数
  const handleSync = async () => {
    try {
      await syncManager.syncAll(updateNote, createNote);
      // 刷新离线笔记
      const notes = await offlineStorage.getAllNotes(user.userName);
      setOfflineNotes(notes);
    } catch (error) {
      console.error("同步失败:", error);
      toast.error("同步失败");
    }
  };

  // 获取所有笔记（PDF + 普通笔记）- 使用分页
  const allNotes = useQuery(
    api.workspaceNotes.getUserNotes,
    user
      ? {
          userName: user.userName,
          type: viewMode === "all" ? undefined : viewMode,
          paginationOpts: { numItems: 12 },
        }
      : "skip"
  );

  // 搜索结果
  const searchResults = useQuery(
    api.workspaceNotes.searchNotes,
    user && searchQuery
      ? {
          userName: user.userName,
          searchQuery,
          type: viewMode === "all" ? undefined : viewMode,
        }
      : "skip"
  );

  // 按标签筛选
  const notesByTag = useQuery(
    api.workspaceNotes.getNotesByTag,
    user && selectedTag
      ? {
          userName: user.userName,
          tag: selectedTag,
          type: viewMode === "all" ? undefined : viewMode,
        }
      : "skip"
  );

  // 按分类筛选
  const notesByCategory = useQuery(
    api.workspaceNotes.getNotesByCategory,
    user && selectedCategory
      ? {
          userName: user.userName,
          category: selectedCategory,
          type: viewMode === "all" ? undefined : viewMode,
        }
      : "skip"
  );

  // 获取所有标签
  const allTags = useQuery(
    api.workspaceNotes.getAllTags,
    user ? { userName: user.userName } : "skip"
  );

  // 获取所有分类
  const allCategories = useQuery(
    api.workspaceNotes.getAllCategories,
    user ? { userName: user.userName } : "skip"
  );

  // 合并在线和离线笔记（只在客户端）
  const mergeNotes = (onlineNotes, offlineNotes) => {
    const onlineNotesArray = onlineNotes?.page || onlineNotes || [];

    // 服务端渲染时不合并离线笔记
    if (!mounted) {
      return onlineNotesArray;
    }

    // 只显示未同步的离线笔记（明确检查 synced === false）
    const offlineNotesFiltered = offlineNotes.filter((note) => {
      return note.synced === false;
    });

    // 合并并去重（以 noteId 为准）
    const noteMap = new Map();

    // 先添加在线笔记（不带 synced 字段）
    onlineNotesArray.forEach((note) => {
      if (note && note.noteId) {
        noteMap.set(note.noteId, { ...note });
      }
    });

    // 再添加离线笔记（会覆盖同 ID 的在线笔记）
    offlineNotesFiltered.forEach((note) => {
      if (note && note.noteId) {
        noteMap.set(note.noteId, { ...note });
      }
    });

    return Array.from(noteMap.values()).sort((a, b) => {
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
  };

  // 确定显示哪些笔记
  const displayNotes = searchQuery
    ? mergeNotes(searchResults, offlineNotes)
    : selectedTag
      ? mergeNotes(notesByTag, offlineNotes)
      : selectedCategory
        ? mergeNotes(notesByCategory, offlineNotes)
        : mergeNotes(allNotes, offlineNotes);
  return (
    <div className="space-y-6">
      {/* 顶部标题和操作栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-medium">工作区</h2>

        <div className="flex gap-2 items-center">
          {/* AI 功能按钮 */}
          <AIFeatures notes={displayNotes || []} />
          <Button onClick={() => setShowNewNoteDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* 搜索区域 - 普通搜索和AI搜索切换 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* 搜索框区域 */}
        <div className="flex-1 w-full">
          {searchMode === "normal" ? (
            /* 普通搜索 */
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search notes and PDFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-32"
              />
              <Button
                onClick={() => setSearchMode("ai")}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v18M3 12h18M7.5 7.5l9 9M16.5 7.5l-9 9" />
                </svg>
                AI 搜索
              </Button>
            </div>
          ) : (
            /* AI 搜索 */
            <div className="relative">
              <AISearch
                notes={displayNotes || []}
                onSelectNote={(note) => router.push(`/workspace/${note.noteId}`)}
              />
              <Button
                onClick={() => setSearchMode("normal")}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Search className="w-4 h-4 mr-1" />
                普通搜索
              </Button>
            </div>
          )}
        </div>

        {/* 过滤和视图切换 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter
            {(selectedTag || selectedCategory) && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {(selectedTag ? 1 : 0) + (selectedCategory ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {/* 视图切换 */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("all")}
          >
            All
          </Button>
          <Button
            variant={viewMode === "pdf" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("pdf")}
          >
            PDFs
          </Button>
          <Button
            variant={viewMode === "note" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("note")}
          >
            Notes
          </Button>
        </div>
      </div>

      {/* 活动的筛选标签 */}
      {(selectedTag || selectedCategory || searchQuery) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Search: {searchQuery}
              <X className="w-4 h-4 ml-2 cursor-pointer" onClick={() => setSearchQuery("")} />
            </span>
          )}
          {selectedTag && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Tag: {selectedTag}
              <X className="w-4 h-4 ml-2 cursor-pointer" onClick={() => setSelectedTag(null)} />
            </span>
          )}
          {selectedCategory && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Category: {selectedCategory}
              <X
                className="w-4 h-4 ml-2 cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              />
            </span>
          )}
        </div>
      )}

      {/* 笔记列表 - 卡片式展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {!allNotes && !searchQuery && !selectedTag && !selectedCategory ? (
          // 加载中显示骨架屏
          [1, 2, 3, 4, 5, 6].map((item) => <NoteCardSkeleton key={item} />)
        ) : displayNotes && displayNotes.length > 0 ? (
          displayNotes.map((note, index) => (
            <Link href={`/workspace/${note.noteId}`} key={index}>
              <div className="relative flex p-5 shadow-md rounded-md flex-col border cursor-pointer hover:shadow-lg transition-all bg-white dark:bg-gray-800 h-[260px] group">
                {/* 删除按钮 - 悬停时显示 */}
                <button
                  onClick={(e) => handleDelete(note.noteId, note.title, e)}
                  className="absolute top-2 right-2 p-2 rounded-md bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  title="删除笔记"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* 头部：图标 + 标题 + 时间 */}
                <div className="flex items-start gap-3 mb-3">
                  <Image
                    src={note.type === "pdf" ? "/pdf.png" : "/file.svg"}
                    alt={note.type}
                    width={36}
                    height={36}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-base line-clamp-2 flex-1">{note.title}</h2>
                      {mounted && note.synced === false && (
                        <span
                          className="flex-shrink-0 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded"
                          title="离线未同步"
                        >
                          离线
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {note.type === "pdf" ? "PDF" : "Note"} ·{" "}
                      {new Date(note.updatedAt || note.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>

                {/* 摘要 - 固定高度区域 */}
                <div className="flex-1 overflow-hidden mb-3 min-h-[60px]">
                  {note.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                      {note.excerpt}
                    </p>
                  )}
                </div>

                {/* 底部：标签和分类 - 固定在底部 */}
                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {note.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {note.category}
                    </span>
                  )}
                  {note.tags &&
                    note.tags.length > 0 &&
                    note.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        <Tag className="w-3 h-3 mr-0.5" />
                        {tag}
                      </span>
                    ))}
                  {note.tags && note.tags.length > 2 && (
                    <span className="text-xs text-gray-500 self-center">
                      +{note.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedTag || selectedCategory
                ? "Try adjusting your filters or search query"
                : "Create your first note or upload a PDF to get started"}
            </p>
            <Button onClick={() => setShowNewNoteDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </div>
        )}
      </div>

      {/* 加载更多按钮 */}
      {!searchQuery &&
        !selectedTag &&
        !selectedCategory &&
        allNotes &&
        !allNotes.isDone &&
        displayNotes &&
        displayNotes.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => {
                // 加载下一页（需要实现状态管理）
                console.log("Load more clicked");
              }}
            >
              Load More
            </Button>
          </div>
        )}

      {/* 创建笔记对话框 */}
      <CreateNoteDialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog} user={user} />

      {/* 过滤对话框 */}
      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        allTags={allTags}
        allCategories={allCategories}
        selectedTag={selectedTag}
        selectedCategory={selectedCategory}
        onTagSelect={setSelectedTag}
        onCategorySelect={setSelectedCategory}
      />

      {/* 离线指示器（只在客户端渲染） */}
      {mounted && <OfflineIndicator onSync={handleSync} />}
    </div>
  );
}

export default Dashboard;
