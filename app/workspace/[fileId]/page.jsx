"use client";
import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import PdfViewer from "../_components/PdfViewer";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import TextEditior from "../_components/TextEditior";
import { CollaborativeEditor } from "../_components/CollaborativeEditor";
import { EditorProvider } from "../_components/EditorContext";
import { useState } from "react";
import { Eye } from "lucide-react";

function Workspace() {
  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [permission, setPermission] = useState("owner"); // owner | view | edit
  const { fileId } = useParams();
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("share");

  // 获取分享信息（如果有）
  const shareInfo = useQuery(api.shares.getShareByToken, shareToken ? { shareToken } : "skip");

  const updateShareAccess = useMutation(api.shares.updateShareAccess);

  useEffect(() => {
    // 仅在客户端执行
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // 获取笔记信息（包含 PDF 文件信息）
  const noteInfo = useQuery(
    api.workspaceNotes.getNoteWithPdfInfo,
    fileId ? { noteId: fileId } : "skip"
  );

  const currentNote = noteInfo;

  // 检查权限
  useEffect(() => {
    if (shareToken && shareInfo) {
      // 通过分享链接访问
      if (shareInfo.expired || !shareInfo.isActive) {
        setPermission("none");
      } else {
        setPermission(shareInfo.permission); // view 或 edit
        // 更新访问统计
        updateShareAccess({ shareToken });
      }
    } else if (user && currentNote) {
      // 检查是否是笔记所有者
      if (currentNote.createdBy === user.email) {
        setPermission("owner");
      } else {
        setPermission("none");
      }
    }
  }, [shareToken, shareInfo, user, currentNote, updateShareAccess]);
  const isPdfNote = currentNote?.type === "pdf" || currentNote?.pdfFile?.fileUrl;

  return (
    <EditorProvider editor={editor} setEditor={setEditor}>
      <div>
        <WorkspaceHeader
          fileName={currentNote?.title || currentNote?.fileName}
          noteId={currentNote?.noteId || fileId}
          user={user}
          noteType={isPdfNote ? "pdf" : "note"}
          noteData={currentNote}
        />

        {/* 权限提示 */}
        {permission === "view" && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Eye className="w-4 h-4" />
              <span>你正在以「只读模式」查看此笔记</span>
            </div>
          </div>
        )}
        {permission === "edit" && shareToken && (
          <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
              <Eye className="w-4 h-4" />
              <span>你正在以「编辑者」身份协同编辑此笔记</span>
            </div>
          </div>
        )}

        {isPdfNote ? (
          // PDF 笔记模式：编辑器 + PDF 查看器
          <div className="grid grid-cols-2 gap-5 p-5 h-[calc(100vh-80px)]">
            <div className="overflow-y-auto h-full">
              {shareToken ? (
                <CollaborativeEditor
                  fileId={fileId}
                  user={user}
                  permission={permission}
                  initialContent={currentNote?.content || ""}
                />
              ) : (
                <TextEditior fileId={fileId} />
              )}
            </div>
            <div className="overflow-y-auto h-full">
              <PdfViewer fileUrl={currentNote?.pdfFile?.fileUrl} />
            </div>
          </div>
        ) : (
          // 普通笔记模式：全宽编辑器
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {shareToken ? (
                <CollaborativeEditor
                  fileId={fileId}
                  user={user}
                  permission={permission}
                  initialContent={currentNote?.content || ""}
                />
              ) : (
                <TextEditior fileId={fileId} />
              )}
            </div>
          </div>
        )}
      </div>
    </EditorProvider>
  );
}

export default Workspace;
