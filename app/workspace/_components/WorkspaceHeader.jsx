import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useEditorContext } from './EditorContext'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useParams } from 'next/navigation'
function WorkspaceHeader({fileName,user}) {  
  const {editor}=useEditorContext()
  const saveNotes=useMutation(api.notes.AddNotes)
  let {fileId} = useParams()
  const handleSave = () => {
    if (editor) {
      const content = editor.getHTML()
      saveNotes({fileId:fileId,notes:content,createdBy:user.userName||''})
      console.log('saveNotes success')            
    }
  }
  return (
    <div className='p-4 flex justify-between shadow-md items-center'>
        <Image src={'/logo.svg'} alt='logo' width={140} height={100}></Image>
            <div className='font-bold text-lg'>{fileName}</div>
            <div className='flex p-4 justify-between items-center'>
              <Button className='m-2' onClick={()=>handleSave()}>
                Save
              </Button>
              <div >user</div>
            </div>
        </div>
  )
}

export default WorkspaceHeader