"use client"
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect,} from "react";

export default function Home() {
  const {user}=useUser()
  const createUser=useMutation(api.user.createUser)
  console.log(api.user)
  useEffect(()=>{
    user&&checkUser()
  },[user])
  
  const checkUser=async()=>{
    const result=await createUser({
      email:user?.primaryEmailAddress?.emailAddress,
      userName:user?.fullName,
      imageUrl:user?.imageUrl,
    })
    console.log('result',result)
  }
  return (
    <div >
      <h2>World</h2>
        <Button >Click me</Button>
        <UserButton />
    </div>
  );
}
