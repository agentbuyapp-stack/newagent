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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 sm:mb-4">
            AgentBuy Системд тавтай морил
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8">
            User болон Agent эрхтэй хэрэглэгчдэд зориулсан платформ
          </p>
          
          <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            <SignedIn>
              <div 
                onClick={handleUserClick}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">User</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Энгийн хэрэглэгчдийн хуудас. Профайл үзэх, засах боломжтой.
                </p>
              </div>
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/user/dashboard">
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors cursor-pointer">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">User</h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Энгийн хэрэглэгчдийн хуудас. Профайл үзэх, засах боломжтой.
                  </p>
                </div>
              </SignInButton>
            </SignedOut>
            
            <SignedIn>
              <div 
                onClick={handleAgentClick}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Agent</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Agent эрхтэй хэрэглэгчдэд зориулсан хуудас. Нэмэлт функцүүд.
                </p>
              </div>
            </SignedIn>
            
            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/agent/dashboard">
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors cursor-pointer">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Agent</h2>
                  <p className="text-sm sm:text-base text-gray-600">
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
