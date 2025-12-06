"use client";

import { useState } from "react";
import { Search, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Image from "next/image";

/**
 * AI 智能搜索组件
 */
export function AISearch({ notes, onSelectNote }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || notes.length === 0) return;

    setIsSearching(true);
    setShowResults(true);

    try {
      // 准备笔记数据（包含 embedding）
      const notesData = notes.map((note) => ({
        noteId: note.noteId,
        title: note.title,
        content: note.plainContent || note.content || "",
        type: note.type,
        embedding: note.embedding, // 如果有预计算的 embedding
      }));

      // 调用 AI 搜索 API
      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          notes: notesData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      } else {
        console.error("搜索失败:", data.error);
      }
    } catch (error) {
      console.error("AI 搜索错误:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Sparkles className="absolute left-8 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-500" />

        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="AI 智能搜索：用自然语言描述你要找的笔记..."
          className="pl-14 pr-52 py-6 text-sm bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-500"
        />

        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-44 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="absolute right-28 top-1/2 -translate-y-1/2 z-10"
          size="sm"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              搜索中
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              搜索
            </>
          )}
        </Button>
      </div>

      {/* 搜索结果 */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-[500px] overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>AI 正在分析你的笔记...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-purple-950">
                <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  找到 {results.length} 条相关笔记
                </p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((note) => (
                  <div
                    key={note.noteId}
                    onClick={() => {
                      onSelectNote(note);
                      setShowResults(false);
                    }}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Image
                        src={note.type === "pdf" ? "/pdf.png" : "/file.svg"}
                        alt={note.type}
                        width={24}
                        height={24}
                        className="flex-shrink-0 mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 line-clamp-1">{note.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {note.content?.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                            相关度: {Math.round(note.score * 100)}%
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {note.type === "pdf" ? "PDF" : "笔记"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">😕 没有找到相关笔记</p>
              <p className="text-xs">尝试换个说法或关键词</p>
            </div>
          )}
        </div>
      )}

      {/* 点击外部关闭结果 */}
      {showResults && <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)} />}
    </div>
  );
}
