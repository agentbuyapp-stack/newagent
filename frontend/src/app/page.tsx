"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleUserClick = () => {
    router.push("/user/dashboard");
  };

  const handleAgentClick = () => {
    router.push("/agent/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AgentBuy Системд тавтай морил
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            User болон Agent эрхтэй хэрэглэгчдэд зориулсан платформ
          </p>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <SignedIn>
              <div 
                onClick={handleUserClick}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">User</h2>
                <p className="text-gray-600">
                  Энгийн хэрэглэгчдийн хуудас. Профайл үзэх, засах боломжтой.
                </p>
              </div>
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/user/dashboard">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">User</h2>
                  <p className="text-gray-600">
                    Энгийн хэрэглэгчдийн хуудас. Профайл үзэх, засах боломжтой.
                  </p>
                </div>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <div 
                onClick={handleAgentClick}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent</h2>
                <p className="text-gray-600">
                  Agent эрхтэй хэрэглэгчдэд зориулсан хуудас. Нэмэлт функцүүд.
                </p>
              </div>
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/agent/dashboard">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent</h2>
              <p className="text-gray-600">
                Agent эрхтэй хэрэглэгчдэд зориулсан хуудас. Нэмэлт функцүүд.
              </p>
                </div>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
}
