"use client"
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect,useState } from "react";
import Image from "next/image";
import Link from "next/link";
function Dashboard() {
  const [user,setUser]=useState(null);
  useEffect(()=>{
    const userData=JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  },[])
  console.log('user1111',user?.userName)
  const fileList=useQuery(api.fileStorage.getUserFiles,{
    userName:user?.userName,
  })
  console.log('fileList111',fileList)
  return (
  <div>
    <h2 className="text-3xl font-medium">Workspace</h2>
    <div className="grid grid-cols-2  md:grid-cols-3 lg:grid-grid-cols-4  xl:grid-cols-5 gap-5 mt-10">
     {/* 添加骨架图 */}
      {fileList?.length>0?fileList?.map((file,index)=>(
        <Link href={`/workspace/`+file.fileId} key={index}>
        <div key={index} className="flex p-5 shadow-md rounded-md flex-col 
        items-center justify-center border cursor-pointer hover:scale-105 transition-all">
          <Image src={'/pdf.png'} alt='file' width={50} height={50}></Image>
          <h2 className="mt-2 font-medium text-lg">{file?.fileName}</h2>
        </div>
        </Link>
      )):[1,2,3,4,5,6,7].map((item,index)=>(
        <div key={index} className="bg-slate-200 rounded-md h-[150px] animate-pulse"></div>
      ))
    }
    </div>
  </div>
  );
}

export default Dashboard;