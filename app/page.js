"use client"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {useEffect,useState} from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const [user,setUser]=useState(null);
  const router=useRouter();
  useEffect(()=>{
    const user=JSON.parse(localStorage.getItem('user'));
    setUser(user);
  },[])

  const getStarted=()=>{
    if(user){
      router.push('/dashboard');
    }else{
      router.push('/sign-in');
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header with Logo */}
      <header className="absolute top-0 left-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <Image 
              src="/logo.svg" 
              alt="AI PDF Notes Logo" 
              width={170} 
              height={40} 
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="text-gray-900">Simplify</span>{" "}
            <span className="text-red-600">PDF</span>{" "}
            <span className="text-blue-600">Note-Taking</span>{" "}
            <span className="text-gray-900">with AI-Powered</span>
          </h1>
          
          {/* Descriptive Text */}
          <p className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed max-w-3xl mx-auto">
            Elevate your note-taking experience with our AI-powered PDF app. 
            Seamlessly extract key insights, summaries, and annotations from any PDF with just a few clicks.
          </p>
          
          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg rounded-full font-medium transition-all duration-200 transform hover:scale-105"
              onClick={getStarted}
            >
              Get started
            </Button>
            <Link href="#features">
              <Button variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 px-8 py-4 text-lg rounded-full font-medium transition-all duration-200 transform hover:scale-105">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Our AI PDF Notes?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of document analysis with cutting-edge AI technology
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Extraction</h3>
            <p className="text-gray-600">
              AI automatically extracts key points, summaries, and important information from your PDFs
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Notes</h3>
            <p className="text-gray-600">
              Create, edit, and organize your notes with an intuitive interface designed for productivity
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Process large documents in seconds with our optimized AI algorithms
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
