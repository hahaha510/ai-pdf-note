"use client"
import React from 'react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import { useEditor,EditorContent } from '@tiptap/react'
import EditorExtension from './EditorExtension'
import TextAlign from '@tiptap/extension-text-align'
import Blockquote from '@tiptap/extension-blockquote'
import CodeBlock from '@tiptap/extension-code-block'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Heading from '@tiptap/extension-heading'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useEffect } from 'react'
import { useEditorContext } from './EditorContext'
function TextEditior({fileId}) {
  const notes=useQuery(api.notes.GetNotes,{
    fileId:fileId
  })
    const {setEditor}=useEditorContext()
    const editor = useEditor({
        extensions: [
          StarterKit,
          Placeholder.configure({
            placeholder: 'Start taking your notes here...',
          }),
          TextAlign.configure({
            types: ['heading', 'paragraph'],
          }),
          Blockquote.configure({
            HTMLAttributes: {
              class: 'border-l-2 border-gray-300 pl-4'
            }
          }),
          CodeBlock,
          Highlight.configure({ multicolor: true }),
          Underline,
          Strike,
          Heading.configure({
            levels: [1, 2, 3],
          }),
        ],
        immediatelyRender: false,
        editorProps: {
            attributes: {
              class: "focus:outline-none h-[90vh] p-5"
            }
          }
      }) 
      useEffect(()=>{
        if(notes){
          editor&&editor.commands.setContent(notes)
        }
      },[notes,editor])
      // console.log(editor)
      useEffect(() => {
        if (editor ) {
          setEditor(editor)
        }
      }, [editor])
  return (
      <div>
        {editor&&<EditorExtension editor={editor}/>} 
          <div className='overflow-scroll h-[85vh]'>
          <EditorContent editor={editor} />
          </div>
      </div>
       
  )
}

export default TextEditior