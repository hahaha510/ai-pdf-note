"use client"
import React, { useState,useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Layout ,Shield} from "lucide-react";
import {Progress} from "@/components/ui/progress";
import UploadPDFDialog from "./UploadPDFDialog";
import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

function SiderBar() {
  const [user,setUser]=useState(null);
  const path=usePathname();
  const GetUserInfo=useQuery(api.user.getUserDetails,{
    userEmail:user?.email,
  })
  console.log('GetUserInfo',GetUserInfo);
  const isUpgrade=GetUserInfo?.upgrade;
  useEffect(()=>{
    const userData=JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  },[])
  const fileList=useQuery(api.fileStorage.getUserFiles,{
    userName:user?.userName,
  })
  return (
  <div className="h-screen shadow-md p-7">
    <Image src="/logo.svg" alt="logo" width={170} height={120} />
    <div className="mt-10">
      <UploadPDFDialog isMaxFile={(fileList?.length>=5&&!isUpgrade)?true:false}>
        <Button className='w-full '>+ Upload PDF</Button>
      </UploadPDFDialog>
      <Link href="/dashboard">
      <div className={`flex gap-2 items-center p-3 mt-5
      hover:bg-slate-100 rounded-lg cursor-pointer 
      ${path==='/dashboard'?'bg-slate-200':''}
      `} style={{position:'relative'}}
      >
        <Layout />
        <h2 style={{position:'absolute',top:'13px',left:'45%',transform:'translateX(-50%)'}}>Workspace</h2>
      </div>
      </Link>
      <Link href="/dashboard/upgrade">
        <div className={`flex gap-2 items-center p-3 mt-5
      hover:bg-slate-100 rounded-lg cursor-pointer 
      ${path==='/dashboard/upgrade'?'bg-slate-200':''}
      `} style={{position:'relative'}}
      >
        <Shield className="w-5 h-5 flex-shrink-0 mt-0.5"/>
        <h2 style={{position:'absolute',top:'13px',left:'40%',transform:'translateX(-50%)'}}>Upgrade</h2>
      </div>
      </Link>
    </div>
   { !isUpgrade &&<div className="absolute bottom-24 w-[80%]">
      <Progress value={fileList?.length/5*100}  />
      <p className="text-sm mt-1">{fileList?.length} out of 5 Pdf Uploaded</p>
      <p className="text-sm text-gray-500 mt-2">Upgrade to Upload more PDF</p>
    </div>}
  </div>
  );
}

export default SiderBar;