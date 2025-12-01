"use client"
import React, { useState } from 'react'
import { useMutation } from 'convex/react'
import { useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';

function UpgradePlans() {
  const [user,setUser]=useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const updateUserUpgradeMutation = useMutation(api.user.updateUserUpgrade);
  useEffect(()=>{
    const user=JSON.parse(localStorage.getItem('user'));
    setUser(user);
  },[])
  const handlePlanSelect = async (planName) => {
    if(planName==='unlimited'){
  const res= await updateUserUpgradeMutation({userEmail:user.email})
     console.log('res',res);
     if(res==='success'){
      toast.success('Upgrade successful');
     }else{
      toast.error('Upgrade failed');
     }
    }
    
  };

  return (
    <div className="p-8">
        <h2 className='font-medium text-3xl mb-2'>Upgrade Plans</h2>
        <p className="text-gray-600 mb-8">Update your plan to upload multiple pdf to take notes</p>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start md:gap-8">
    {/* Free Plan */}
    <div 
      className={`rounded-2xl border p-6 shadow-sm sm:px-8 lg:p-12 cursor-pointer transition-all duration-200 ${
        selectedPlan === 'free' 
          ? 'border-purple-600 ring-1 ring-purple-600' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => handlePlanSelect('free')}
    >
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">
          Free
          <span className="sr-only">Plan</span>
        </h2>

        <p className="mt-2 sm:mt-4">
          <strong className="text-3xl font-bold text-gray-900 sm:text-4xl">0$</strong>
          <span className="text-sm font-medium text-gray-700">/month</span>
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">5 PDF Upload</span>
        </li>

        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">Unlimited Notes Taking</span>
        </li>

        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">Email support</span>
        </li>

        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">Help center access</span>
        </li>
      </ul>

      <button
        className={`mt-8 w-full rounded-full border px-12 py-3 text-center text-sm font-medium transition-colors ${
          selectedPlan === 'free'
            ? 'border-purple-600 bg-purple-600 text-white hover:bg-purple-700'
            : 'border-purple-600 bg-white text-purple-600 hover:bg-purple-50'
        }`}
        onClick={() => handlePlanSelect('free')}
      >
        {selectedPlan === 'free' ? 'Selected' : 'Current Plan'}
      </button>
    </div>

    {/* Unlimited Plan */}
    <div 
      className={`rounded-2xl border p-6 shadow-sm sm:px-8 lg:p-12 cursor-pointer transition-all duration-200 ${
        selectedPlan === 'unlimited' 
          ? 'border-purple-600 ring-1 ring-purple-600' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => handlePlanSelect('unlimited')}
    >
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">
          Unlimited
          <span className="sr-only">Plan</span>
        </h2>

        <p className="mt-2 sm:mt-4">
          <strong className="text-3xl font-bold text-gray-900 sm:text-4xl">9.99$</strong>
          <span className="text-sm font-medium text-gray-700">/One Time</span>
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">Unlimited PDF Upload</span>
        </li>

        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">Unlimited Notes Taking</span>
        </li>

        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">Email support</span>
        </li>

        <li className="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-5 h-5 text-green-600 flex-shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span className="text-gray-700">Help center access</span>
        </li>
      </ul>

      <button
        className={`mt-8 w-full rounded-full border px-12 py-3 text-center text-sm font-medium transition-colors ${
          selectedPlan === 'unlimited'
            ? 'border-purple-600 bg-purple-600 text-white hover:bg-purple-700'
            : 'border-purple-600 bg-white text-purple-600 hover:bg-purple-50'
        }`}
        onClick={() => handlePlanSelect('unlimited')}
      >
        {selectedPlan === 'unlimited' ? 'Selected' : 'Get Started'}
      </button>
    </div>
  </div>
</div>
    </div>
  )
}

export default UpgradePlans