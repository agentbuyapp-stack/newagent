"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn } from "@clerk/nextjs";
import ProfileDropdown from "@/components/ProfileDropdown";
import SignOutButton from "@/components/SignOutButton";

// Footer page-үүд (нэвтрэлгүйгээр харах боломжтой)
const publicPages = ["/about", "/terms", "/privacy", "/faq", "/tutorial", "/help"];

export default function Header() {
  const pathname = usePathname();

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

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Agentbuy.mn</span>
        </Link>
        {!isPublicPage && (
          <SignedIn>
            <div className="flex items-center gap-2 sm:gap-4">
              <ProfileDropdown />
              <SignOutButton />
            </div>
          </SignedIn>
        )}
      </div>
    </header>
  );
}
