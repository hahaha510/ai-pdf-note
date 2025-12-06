"use client";

import { useState } from "react";
import { Sparkles, FileText, Grid3x3, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

/**
 * AI 功能组件 - 摘要和主题聚合
 */
export function AIFeatures({ notes }) {
  const [showSummary, setShowSummary] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [summary, setSummary] = useState("");
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 生成摘要
  const generateSummary = async () => {
    if (notes.length === 0) return;

    setIsLoading(true);
    setShowSummary(true);
    setSummary("");

    try {
      const notesData = notes.slice(0, 10).map((note) => ({
        title: note.title,
        content: note.plainContent || note.content || "",
      }));

      const response = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesData }),
      });

      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("生成摘要失败:", error);
      setSummary("生成摘要失败，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  // 提取主题
  const extractTopics = async () => {
    if (notes.length === 0) return;

    setIsLoading(true);
    setShowTopics(true);
    setTopics([]);

    try {
      const notesData = notes.map((note) => ({
        noteId: note.noteId,
        title: note.title,
        content: note.plainContent || note.content || "",
      }));

      const response = await fetch("/api/ai-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesData, topK: 8 }),
      });

      const data = await response.json();

      if (data.success) {
        setTopics(data.topics);
      }
    } catch (error) {
      console.error("提取主题失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* AI 功能按钮 */}
      <div className="flex items-center gap-2">
        <Button
          onClick={generateSummary}
          disabled={notes.length === 0}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          AI 摘要
        </Button>

        <Button
          onClick={extractTopics}
          disabled={notes.length === 0}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Grid3x3 className="w-4 h-4" />
          主题聚合
        </Button>
      </div>

      {/* 摘要对话框 */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI 笔记摘要
            </DialogTitle>
            <DialogDescription>
              基于你的最近 {Math.min(notes.length, 10)} 篇笔记生成的综合摘要
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-600">AI 正在分析你的笔记...</span>
              </div>
            ) : summary ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* 主题聚合对话框 */}
      <Dialog open={showTopics} onOpenChange={setShowTopics}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-blue-500" />
              主题聚合分析
            </DialogTitle>
            <DialogDescription>AI 识别出的 {notes.length} 篇笔记中的主要主题</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">AI 正在分析主题...</span>
              </div>
            ) : topics.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {topics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-5 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                        {topic.topic}
                      </h3>
                      <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {topic.count} 篇
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {topic.noteIds.slice(0, 3).map((id) => {
                        const note = notes.find((n) => n.noteId === id);
                        return note ? (
                          <span
                            key={id}
                            className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400 truncate max-w-[150px]"
                            title={note.title}
                          >
                            {note.title}
                          </span>
                        ) : null;
                      })}
                      {topic.noteIds.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{topic.noteIds.length - 3} 更多
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
