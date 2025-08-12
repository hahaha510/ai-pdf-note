"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import WorkspaceHeader from '../_components/WorkspaceHeader'
import PdfViewer from '../_components/PdfViewer'
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { useEffect } from 'react'
import TextEditior from '../_components/TextEditior'
import { EditorProvider } from '../_components/EditorContext'
import { useState } from 'react'

function Workspace() {
    const [user, setUser] = useState(null);
    const [editor, setEditor] = useState(null)
    const {fileId}=useParams();
    useEffect(() => {
      // 仅在客户端执行
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }, []);
    const fileInfo=useQuery(api.fileStorage.getFileRecord,{fileId})
    useEffect(()=>{
      console.log(fileInfo)
    },[fileInfo])
    return (
      <EditorProvider editor={editor} setEditor={setEditor}>
    <div>
      <WorkspaceHeader fileName={fileInfo?.fileName} user={user}/>
      <div className='grid grid-cols-2 gap-5'>
        <div>
          <TextEditior fileId={fileId}/>
        </div>
        <div>
          <PdfViewer fileUrl={fileInfo?.fileUrl}/>
        </div>
      </div>
    </div>
    </EditorProvider>
  )
}

export default Workspace