"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export function CreateNoteDialog({ open, onOpenChange, user }) {
  const router = useRouter();
  const [noteTitle, setNoteTitle] = useState("");
  const createNote = useMutation(api.workspaceNotes.createNote);

  const handleCreateNote = async () => {
    if (!noteTitle.trim() || !user) return;

    try {
      const noteId = uuidv4();
      await createNote({
        noteId,
        title: noteTitle,
        createdBy: user.userName,
      });

      setNoteTitle("");
      onOpenChange(false);
      router.push(`/workspace/${noteId}`);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建新笔记</DialogTitle>
          <DialogDescription>请输入笔记标题</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            type="text"
            placeholder="笔记标题..."
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleCreateNote();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleCreateNote} disabled={!noteTitle.trim()}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
