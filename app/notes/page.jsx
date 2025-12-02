"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Tag,
  Calendar,
  Trash2,
  Edit,
  Filter,
  X,
  Keyboard,
  Loader2,
} from "lucide-react";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcuts";
import { NoteCardSkeletonGrid } from "@/components/NoteCardSkeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export default function NotesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [searchInputRef, setSearchInputRef] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(12); // 初始显示12条
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      router.push("/sign-in");
    } else {
      setUser(userData);
    }
  }, [router]);

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + N: 新建笔记
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setShowNewNoteDialog(true);
      }
      // Ctrl/Cmd + K: 聚焦搜索
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef?.focus();
      }
      // Ctrl/Cmd + /: 显示快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcutsDialog(true);
      }
      // Esc: 关闭对话框
      if (e.key === "Escape") {
        setShowNewNoteDialog(false);
        setShowFilterDialog(false);
        setShowShortcutsDialog(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef]);

  // 查询笔记
  const notes = useQuery(api.onlineNotes.getUserNotes, user ? { userName: user.userName } : "skip");

  // 搜索笔记
  const searchResults = useQuery(
    api.onlineNotes.searchNotes,
    user && searchQuery ? { userName: user.userName, searchQuery } : "skip"
  );

  // 获取所有标签
  const allTags = useQuery(api.onlineNotes.getAllTags, user ? { userName: user.userName } : "skip");

  // 获取所有分类
  const allCategories = useQuery(
    api.onlineNotes.getAllCategories,
    user ? { userName: user.userName } : "skip"
  );

  // 按标签筛选
  const notesByTag = useQuery(
    api.onlineNotes.getNotesByTag,
    user && selectedTag ? { userName: user.userName, tag: selectedTag } : "skip"
  );

  // 按分类筛选
  const notesByCategory = useQuery(
    api.onlineNotes.getNotesByCategory,
    user && selectedCategory ? { userName: user.userName, category: selectedCategory } : "skip"
  );

  // 创建笔记
  const createNote = useMutation(api.onlineNotes.createNote);

  // 删除笔记
  const deleteNote = useMutation(api.onlineNotes.deleteNote);

  // 使用 useMemo 优化性能，避免不必要的重新计算
  const allDisplayNotes = useMemo(() => {
    return searchQuery
      ? searchResults
      : selectedTag
        ? notesByTag
        : selectedCategory
          ? notesByCategory
          : notes;
  }, [
    searchQuery,
    searchResults,
    selectedTag,
    notesByTag,
    selectedCategory,
    notesByCategory,
    notes,
  ]);

  // 应用无限滚动限制
  const displayNotes = useMemo(() => {
    if (!allDisplayNotes) return null;
    return allDisplayNotes.slice(0, displayLimit);
  }, [allDisplayNotes, displayLimit]);

  // 检查是否还有更多笔记
  const hasMore = allDisplayNotes && allDisplayNotes.length > displayLimit;

  // 加载更多笔记
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayLimit((prev) => prev + 12);
      setIsLoadingMore(false);
    }, 300); // 模拟加载延迟
  }, [hasMore, isLoadingMore]);

  // 无限滚动 ref
  const lastNoteRef = useInfiniteScroll(loadMore, hasMore);

  // 创建新笔记
  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;

    try {
      const noteId = await createNote({
        title: newNoteTitle,
        content: "",
        tags: [],
        category: "",
        createdBy: user.userName,
      });

      setNewNoteTitle("");
      setShowNewNoteDialog(false);
      router.push(`/notes/${noteId}`);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  // 删除笔记
  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote({ noteId });
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  // 格式化日期
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 清除筛选
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTag(null);
    setSelectedCategory(null);
    setDisplayLimit(12); // 重置显示限制
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* 搜索和操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            ref={(el) => setSearchInputRef(el)}
            type="text"
            placeholder="Search notes... (Ctrl/⌘+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsDialog(true)}
            title="Keyboard shortcuts (Ctrl/⌘+/)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowFilterDialog(true)}
            className="flex-1 sm:flex-initial"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>

          <Button onClick={() => setShowNewNoteDialog(true)} className="flex-1 sm:flex-initial">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* 活动的筛选条件 */}
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
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-600">
            Clear all
          </Button>
        </div>
      )}

      {/* 笔记网格 */}
      {displayNotes && displayNotes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayNotes.map((note, index) => {
              // 为最后一个元素添加 ref 以触发无限滚动
              const isLastNote = index === displayNotes.length - 1;

              return (
                <Card
                  key={note._id}
                  ref={isLastNote ? lastNoteRef : null}
                  className="cursor-pointer hover:shadow-lg dark:hover:shadow-gray-700 transition-all duration-200 group bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  onClick={() => router.push(`/notes/${note._id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="line-clamp-2 text-gray-900 dark:text-gray-100">
                        {note.title}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/notes/${note._id}`);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteNote(note._id, e)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                      {note.excerpt || "No content"}
                    </p>

                    {/* 标签 */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {note.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{note.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* 分类和日期 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {note.category && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {note.category}
                        </span>
                      )}
                      <span className="flex items-center ml-auto">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 加载更多指示器 */}
          {hasMore && (
            <div className="flex justify-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more notes...</span>
                </div>
              ) : (
                <Button variant="outline" onClick={loadMore} className="flex items-center gap-2">
                  Load More ({allDisplayNotes.length - displayLimit} remaining)
                </Button>
              )}
            </div>
          )}
        </>
      ) : !allDisplayNotes ? (
        // 加载骨架屏
        <NoteCardSkeletonGrid count={12} />
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedTag || selectedCategory
              ? "Try adjusting your filters or search query"
              : "Create your first note to get started"}
          </p>
          <Button onClick={() => setShowNewNoteDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Note
          </Button>
        </div>
      )}

      {/* 新建笔记对话框 */}
      <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>Enter a title for your new note</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleCreateNote();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={!newNoteTitle.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 筛选对话框 */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Notes</DialogTitle>
            <DialogDescription>Filter notes by tags or categories</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 标签筛选 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags && allTags.length > 0 ? (
                  allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag === selectedTag ? null : tag);
                        setShowFilterDialog(false);
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTag === tag
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tags available</p>
                )}
              </div>
            </div>

            {/* 分类筛选 */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {allCategories && allCategories.length > 0 ? (
                  allCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category === selectedCategory ? null : category);
                        setShowFilterDialog(false);
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategory === category
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No categories available</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 快捷键帮助对话框 */}
      <KeyboardShortcutsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
    </div>
  );
}
