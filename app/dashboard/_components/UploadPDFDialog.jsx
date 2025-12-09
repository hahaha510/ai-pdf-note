"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import uuid4 from "uuid4";
import axios from "axios";
import { useAction } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
function UploadPDFDialog({ isMaxFile }) {
  const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const AddFileEntry = useMutation(api.fileStorage.AddFileEntryToDb);
  const getFileUrl = useMutation(api.fileStorage.getFileUrl);
  const embeddDocuments = useAction(api.myAction.ingest);
  const createPdfNote = useMutation(api.workspaceNotes.createPdfNote);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, []);

  const onFileSelect = (event) => {
    setFile(event.target.files[0]);
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      // 当弹窗关闭时，重置表单状态
      setFile(null);
      setFileName("");
      setLoading(false);
    }
  };

  //pdf上传到convex数据库
  const onUpload = async () => {
    if (!file) {
      toast.error("请先选择文件");
      return;
    }

    try {
      setLoading(true);
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file?.type },
        body: file,
      });
      const { storageId } = await result.json();
      console.log("storageId", storageId);
      const fileId = uuid4();
      const fileUrl = await getFileUrl({ storageId: storageId });
      const title = fileName ?? "未命名文件";

      // 1. 创建 PDF 文件记录
      const resp = await AddFileEntry({
        fileId: fileId,
        storageId: storageId,
        fileName: title,
        fileUrl: fileUrl,
        createdBy: user?.userName,
        fileSize: file?.size,
        mimeType: file?.type,
        uploadedAt: Date.now(),
      });
      console.log("resp", resp);

      // 2. 创建 PDF 笔记（引用文件）
      await createPdfNote({
        noteId: fileId,
        title: title,
        pdfFileId: fileId, // 引用关系
        createdBy: user?.userName,
      });

      const ApiResp = await axios.get("/api/pdf-loader?pdfUrl=" + fileUrl);
      console.log("ApiResp", ApiResp.data.result);
      const embeddResult = await embeddDocuments({
        splitText: ApiResp.data.result,
        fileId: fileId,
      });
      console.log("embeddResult", embeddResult);
      setLoading(false);
      handleOpenChange(false);
      toast("文件上传成功");
    } catch (error) {
      console.error("上传失败:", error);
      setLoading(false);
      toast.error("文件上传失败，请重试");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full " disabled={isMaxFile} onClick={() => setOpen(true)}>
          上传PDF文件
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>上传 PDF 文件</DialogTitle>
          <DialogDescription asChild>
            <div>
              <h2 className="mt-5">选择要上传的文件</h2>
              <div className="gap-2 p-3 rounded-md border">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => onFileSelect(event)}
                ></input>
              </div>
              <div className="mt-2">
                <label>文件名称 *</label>
                <Input
                  placeholder="请输入文件名称"
                  onChange={(event) => setFileName(event.target.value)}
                ></Input>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              关闭
            </Button>
          </DialogClose>
          <Button onClick={onUpload} disabled={loading}>
            {loading ? <Loader2Icon className="animate-spin"></Loader2Icon> : "上传"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default UploadPDFDialog;
