"use client";
export default function AuthLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="py-6">
        <div className="container mx-auto flex justify-center">
          <h1 className="text-2xl font-bold text-blue-600">AI PDF Notes</h1>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-500">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} AI PDF Notes. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
} 