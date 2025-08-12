"use client"
import React, { useState ,useEffect} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import uuid4 from "uuid4";
import axios from "axios";
import { useAction } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner"
function UploadPDFDialog({children,isMaxFile}){
    const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);
    const AddFileEntry = useMutation(api.fileStorage.AddFileEntryToDb);
    const getFileUrl = useMutation(api.fileStorage.getFileUrl);
    const embeddDocuments = useAction(api.myAction.ingest);
    const [file, setFile] = useState(null);
    const [loading,setLoading] = useState(false);
    const [fileName,setFileName] = useState("");
    const [user,setUser] = useState(null);
    const [open,setOpen] = useState(false);
    useEffect(() => {
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    }, []);

    const onFileSelect = (event)=>{
        setFile(event.target.files[0]);
    }

    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
            // 当弹窗关闭时，重置表单状态
            setFile(null);
            setFileName("");
            setLoading(false);
        }
    }

    //pdf上传到convex数据库
    const onUpload = async ()=>{
      setLoading(true);
      const postUrl = await generateUploadUrl();
      const result=await fetch(postUrl,{
        method:"POST",
        headers:{"Content-Type":file?.type},
        body:file,
      });
      const {storageId} = await result.json();
      console.log('storageId',storageId);
      const fileId=uuid4()
      const fileUrl=await getFileUrl({storageId:storageId});
      //到表中添加文件信息
      const resp=await AddFileEntry({
        fileId:fileId,
        storageId:storageId,
        fileName:fileName??"Untitled File",
        fileUrl:fileUrl,
        createdBy:user?.userName,
      })
      console.log('resp',resp);
      const ApiResp=await axios.get('/api/pdf-loader?pdfUrl='+fileUrl)
      console.log('ApiResp',ApiResp.data.result);
      const embeddResult=await embeddDocuments({
        splitText:ApiResp.data.result,
        fileId:fileId
      })
      console.log('embeddResult',embeddResult);
      setLoading(false)
      setOpen(false)
      toast('File uploaded successfully');
    }
 
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className='w-full ' disabled={isMaxFile} onClick={()=>setOpen(true)}>+ Upload PDF File</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Pdf File</DialogTitle>
            <DialogDescription asChild>
              <div>
                <h2 className="mt-5">Select a file to Upload</h2>
                  <div className="gap-2 p-3 rounded-md border">
                      <input type="file" accept="application/pdf" 
                      onChange={(event)=>onFileSelect(event)}
                      ></input>
                  </div>
                  <div className="mt-2">
                    <label>File Name *</label>
                    <Input placeholder="File Name" onChange={(event)=>setFileName(event.target.value)}></Input>
                  </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary" >
              Close
            </Button>
          </DialogClose>
          <Button onClick={onUpload} disabled={loading}>
            {
              loading? <Loader2Icon className="animate-spin"></Loader2Icon>
              : "Upload"
            }
            </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    )
}
export default UploadPDFDialog;
