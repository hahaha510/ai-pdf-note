"use client";
import React from "react";
import { useParams } from "next/navigation";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import PdfViewer from "../_components/PdfViewer";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import TextEditior from "../_components/TextEditior";
import { EditorProvider } from "../_components/EditorContext";
import { useState } from "react";

function Workspace() {
  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const { fileId } = useParams();

  useEffect(() => {
    // 仅在客户端执行
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // 从新的 workspaceNotes 表获取笔记信息
  const noteInfo = useQuery(api.workspaceNotes.getNote, fileId ? { noteId: fileId } : "skip");

  // 兼容性：如果新表中没有，尝试从旧的 pdfFiles 表获取（用于迁移）
  const legacyFileInfo = useQuery(
    api.fileStorage.getFileRecord,
    !noteInfo && fileId ? { fileId } : "skip"
  );

  const currentNote = noteInfo || legacyFileInfo;
  const isPdfNote = currentNote?.type === "pdf" || currentNote?.fileUrl;

  return (
    <EditorProvider editor={editor} setEditor={setEditor}>
      <div>
        <WorkspaceHeader
          fileName={currentNote?.title || currentNote?.fileName}
          noteId={fileId}
          user={user}
          noteType={isPdfNote ? "pdf" : "note"}
          noteData={currentNote}
        />

        {isPdfNote ? (
          // PDF 笔记模式：编辑器 + PDF 查看器
          <div className="grid grid-cols-2 gap-5 p-5 h-[calc(100vh-80px)]">
            <div className="overflow-y-auto h-full">
              <TextEditior fileId={fileId} />
            </div>
            <div className="overflow-y-auto h-full">
              <PdfViewer fileUrl={currentNote?.fileUrl} />
            </div>
          </div>
        ) : (
          // 普通笔记模式：全宽编辑器
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <TextEditior fileId={fileId} />
            </div>
          </div>
        )}
      </div>
    </EditorProvider>
  );
}

export default Workspace;
