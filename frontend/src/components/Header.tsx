"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SignedIn, useAuth } from "@clerk/nextjs";
import ProfileDropdown from "@/components/ProfileDropdown";
import SignOutButton from "@/components/SignOutButton";
import NotificationDropdown from "@/components/NotificationDropdown";
import { apiClient, type User } from "@/lib/api";

// Footer page-үүд (нэвтрэлгүйгээр харах боломжтой)
const publicPages = ["/about", "/terms", "/privacy", "/faq", "/tutorial", "/help"];

export default function Header() {
  const pathname = usePathname();
  const { getToken, isSignedIn } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  // User role авах
  useEffect(() => {
    const fetchUser = async () => {
      if (!isSignedIn) {
        setUser(null);
        return;
      }

      try {
        apiClient.setTokenGetter(getToken);
        const userData = await apiClient.getMe();
        setUser(userData);
      } catch (e) {
        console.error("Failed to fetch user:", e);
        setUser(null);
      }
    };

    fetchUser();
  }, [isSignedIn, getToken]);

  // Home хуудсанд header харуулахгүй
  if (pathname === "/") {
    return null;
  }

  // Admin dashboard-д өөрийн header байгаа учир харуулахгүй
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Footer page-үүдэд зөвхөн logo харуулах
  const isPublicPage = publicPages.includes(pathname || "");

  // Role-оос хамааран dashboard URL тодорхойлох
  const getDashboardUrl = () => {
    if (!user) return "/";
    if (user.role === "agent") return "/agent/dashboard";
    if (user.role === "admin") return "/admin/dashboard";
    return "/user/dashboard";
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
        <Link href={isSignedIn ? getDashboardUrl() : "/"} className="flex items-center gap-2 sm:gap-3">
          <img src="/icon.png" alt="AgentBuy" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
          <span className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Agentbuy.mn</span>
        </Link>
        {!isPublicPage ? (
          <SignedIn>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              <NotificationDropdown />
              <ProfileDropdown />
              <SignOutButton />
            </div>
          </SignedIn>
        ) : (
          <SignedIn>
            <Link
              href={getDashboardUrl()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Буцах
            </Link>
          </SignedIn>
        )}
      </div>
    </header>
  );
}
