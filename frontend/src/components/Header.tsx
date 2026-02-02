"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SignedIn, useAuth } from "@clerk/nextjs";
import ProfileDropdown from "@/components/ProfileDropdown";
import NotificationDropdown from "@/components/NotificationDropdown";
import ResearchCardDisplay from "@/components/ResearchCardDisplay";
import ThemeToggle from "@/components/ThemeToggle";
import { apiClient, type User } from "@/lib/api";

// Footer page-үүд (нэвтрэлгүйгээр харах боломжтой)
const publicPages = [
  "/about",
  "/terms",
  "/privacy",
  "/faq",
  "/tutorial",
  "/help",
];

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
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
        <Link
          href={isSignedIn ? getDashboardUrl() : "/"}
          className="flex items-center gap-2"
        >
          <img
            src="/icon.png"
            alt="AgentBuy"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg"
          />
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-tight">
              Agentbuy.mn
            </span>
            <span className="text-[6px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Худалдан авалт хялбар боллоо
            </span>
          </div>
        </Link>
        {!isPublicPage ? (
          <SignedIn>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              {user && <ResearchCardDisplay userRole={user.role} />}
              <NotificationDropdown />
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </SignedIn>
        ) : (
          <SignedIn>
            <Link
              href={getDashboardUrl()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Буцах
            </Link>
          </SignedIn>
        )}
      </div>
    </header>
  );
}
