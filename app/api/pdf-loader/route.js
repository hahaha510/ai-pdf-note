import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// const pdfUrl="https://majestic-puma-134.convex.cloud/api/storage/99781f55-669c-4c28-9371-a03bf2540b33"
export async function GET(req) {
    const reqUrl=req.url;
    const {searchParams}=new URL(reqUrl);
    const pdfUrl=searchParams.get('pdfUrl');
    console.log('pdfUrl',pdfUrl);
    console.log('req',req);
    //1.记载pdf文件
    const response=await fetch(pdfUrl);
    const data=await response.blob();
    const loader=new WebPDFLoader(data);
    const docs=await loader.load();
    let pdfTextContent="";
    docs.forEach(doc=>{
        pdfTextContent+=doc.pageContent;
    })
    //2.分割pdf文件成chunks
    const splitter=new RecursiveCharacterTextSplitter({
        chunkSize:100,
        chunkOverlap:20,
    })
    //这是简单文本数组 没有元数据
    // const output=await splitter.splitText(pdfTextContent);
    //这是一个document对象数组，有元数据
    const output=await splitter.createDocuments([pdfTextContent]);

    let splitterList=[]
    output.forEach(doc=>{
        splitterList.push(doc.pageContent)
    })
    return NextResponse.json({result:splitterList})    
}