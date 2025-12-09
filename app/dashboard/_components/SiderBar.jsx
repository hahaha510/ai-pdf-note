"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Layout, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import UploadPDFDialog from "./UploadPDFDialog";
import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";

function SiderBar() {
  const [user, setUser] = useState(null);
  const path = usePathname();
  const GetUserInfo = useQuery(api.user.getUserDetails, {
    userEmail: user?.email,
  });
  console.log("GetUserInfo", GetUserInfo);
  const isUpgrade = GetUserInfo?.upgrade;
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
  }, []);
  const fileList = useQuery(api.fileStorage.getUserFiles, {
    userName: user?.userName,
  });
  return (
    <div className="h-screen shadow-md p-7">
      <div className="flex items-center gap-3 mb-6">
        <Image src="/logo.jpg" alt="logo" width={50} height={50} className="rounded-lg" />
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          AI Notes
        </span>
      </div>
      <div className="mt-10">
        <UploadPDFDialog isMaxFile={fileList?.length >= 5 && !isUpgrade ? true : false}>
          <Button className="w-full ">上传PDF文件</Button>
        </UploadPDFDialog>
        <Link href="/dashboard">
          <div
            className={`flex gap-2 items-center p-3 mt-5
      hover:bg-slate-100 rounded-lg cursor-pointer
      ${path === "/dashboard" ? "bg-slate-200" : ""}
      `}
          >
            <Layout className="w-5 h-5" />
            <h2 className="m-0 leading-none text-base font-medium">工作区</h2>
          </div>
        </Link>
        <Link href="/dashboard/upgrade">
          <div
            className={`flex gap-2 items-center p-3 mt-2
      hover:bg-slate-100 rounded-lg cursor-pointer
      ${path === "/dashboard/upgrade" ? "bg-slate-200" : ""}
      `}
          >
            <Shield className="w-5 h-5 flex-shrink-0" />
            <h2 className="m-0 leading-none text-base font-medium">升级计划</h2>
          </div>
        </Link>
      </div>
      {!isUpgrade && (
        <div className="absolute bottom-24 w-[80%]">
          <Progress value={(fileList?.length / 5) * 100} />
          <p className="text-sm mt-1">已上传 {fileList?.length} / 5 个 PDF</p>
          <p className="text-sm text-gray-500 mt-2">升级以上传更多 PDF 文件</p>
        </div>
      )}
    </div>
  );
}

export default SiderBar;
