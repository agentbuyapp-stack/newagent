"use client";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export const AuthBtn = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto px-4 sm:px-0">
      {/* Signed Out - Show Sign In buttons */}
      <SignedOut>
        <SignInButton forceRedirectUrl="/user/dashboard">
          <button className="group relative bg-linear-to-r from-[#0b4ce5] to-[#4a90e2] rounded-2xl flex justify-center items-center w-full sm:w-52 h-14 sm:h-16 px-8 py-4 cursor-pointer border-2 border-white/20 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-[#4a90e2] to-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 text-white font-bold text-[18px] sm:text-[20px] tracking-wide">
              Хэрэглэгч
            </span>
          </button>
        </SignInButton>
      </SignedOut>
      <SignedOut>
        <SignInButton forceRedirectUrl="/agent/dashboard">
          <button className="group relative bg-linear-to-r from-[#4a90e2] to-[#00d4ff] rounded-2xl flex justify-center items-center w-full sm:w-52 h-14 sm:h-16 px-8 py-4 cursor-pointer border-2 border-white/20 shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-600/50 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-[#00d4ff] to-[#0b4ce5] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 text-white font-bold text-[18px] sm:text-[20px] tracking-wide">
              Агент
            </span>
          </button>
        </SignInButton>
      </SignedOut>

      {/* Signed In - Show navigation buttons */}
      <SignedIn>
        <button
          onClick={() => router.push("/user/dashboard")}
          className="group relative bg-linear-to-r from-[#0b4ce5] to-[#4a90e2] rounded-2xl flex justify-center items-center w-full sm:w-52 h-14 sm:h-16 px-8 py-4 cursor-pointer border-2 border-white/20 shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-r from-[#4a90e2] to-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 text-white font-bold text-[18px] sm:text-[20px] tracking-wide">
            Хэрэглэгч
          </span>
        </button>
      </SignedIn>
      <SignedIn>
        <button
          onClick={() => router.push("/agent/dashboard")}
          className="group relative bg-linear-to-r from-[#4a90e2] to-[#00d4ff] rounded-2xl flex justify-center items-center w-full sm:w-52 h-14 sm:h-16 px-8 py-4 cursor-pointer border-2 border-white/20 shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-600/50 hover:scale-105 overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-r from-[#00d4ff] to-[#0b4ce5] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative z-10 text-white font-bold text-[18px] sm:text-[20px] tracking-wide">
            Агент
          </span>
        </button>
      </SignedIn>
    </div>
  );
};
