"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { type User, type Profile } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import ProfileForm from "./ProfileForm";

export default function ProfileDropdown() {
  const { user: clerkUser } = useUser();
  const apiClient = useApiClient();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clerkUser) {
      loadProfile();
    }
  }, [clerkUser]);

  // For agents, refresh points periodically and on window focus
  useEffect(() => {
    if (user?.role === "agent") {
      const interval = setInterval(() => {
        loadProfile();
      }, 30000); // Refresh every 30 seconds

      // Refresh when window gains focus (user switches back to tab)
      const handleFocus = () => {
        loadProfile();
      };
      window.addEventListener('focus', handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [user?.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const loadProfile = async () => {
    if (!clerkUser) return;

    setLoading(true);
    try {
      const userData = await apiClient.getMe();
      setUser(userData);
      if (userData.profile) {
        setProfile(userData.profile);
      }
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
      });
      // Don't show error to user, just log it
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSuccess = async () => {
    await loadProfile();
    setShowProfileForm(false);
    // Keep dropdown open to show updated profile
  };

  const handleCancelForm = () => {
    setShowProfileForm(false);
  };

  return (
    <>
      {/* Agent Points Display - Outside dropdown container */}
      {user?.role === "agent" && user.agentPoints !== undefined && (() => {
        const displayPoints = Math.max(0, user.agentPoints || 0);
        return (
          <div
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 border rounded-xl ${displayPoints > 0
              ? "bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer"
              : "bg-gray-50 border-gray-200 cursor-default"
              } transition-colors`}
            onClick={displayPoints > 0 ? async () => {
              const points = displayPoints;
              if (!confirm(`Та ${points.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮ оноогоо зарахдаа итгэлтэй байна уу? Оноо 0 болж, admin-д урамшуулал хүсэлт илгээгдэнэ.`)) {
                return;
              }

              try {
                await apiClient.createRewardRequest();
                alert("Оноо амжилттай зарагдлаа. Admin-д хүсэлт илгээгдлээ.");
                // Reload profile to update points
                await loadProfile();
              } catch (err: any) {
                alert(err.message || "Алдаа гарлаа");
              }
            } : undefined}
            title={displayPoints > 0 ? "Оноо зарах - Дарах" : "Оноо байхгүй"}
          >
            <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${displayPoints > 0 ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs sm:text-sm font-semibold ${displayPoints > 0 ? "text-blue-600" : "text-gray-400"}`}>
              {displayPoints.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮
            </span>
          </div>
        );
      })()}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors min-h-[40px] min-w-[40px]"
          title="Миний мэдээлэл"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Миний мэдээлэл</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[32px] min-w-[32px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-4 text-gray-500">Ачааллаж байна...</div>
              ) : showProfileForm ? (
                <div>
                  <ProfileForm profile={profile} onSuccess={handleProfileSuccess} hideCargo={user?.role === "agent"} />
                  <button
                    onClick={handleCancelForm}
                    className="mt-3 w-full px-4 py-2.5 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium min-h-[44px]"
                  >
                    Цуцлах
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Имэйл</label>
                    <p className="mt-1 text-sm text-gray-900">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">Эрх</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {user?.role === "agent"
                        ? (user?.isApproved ? "agent" : "agent (батлагдаагүй)")
                        : user?.role === "user"
                          ? (user?.isApproved ? "user" : "user (батлагдаагүй)")
                          : user?.role || "user"}
                    </p>
                  </div>

                  {profile ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Нэр</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.name}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600">Утас</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
                      </div>

                      {user?.role === "agent" ? (
                        profile.accountNumber && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Дансны дугаар</label>
                            <p className="mt-1 text-sm text-gray-900">{profile.accountNumber}</p>
                          </div>
                        )
                      ) : (
                        profile.cargo && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Ачаа</label>
                            <p className="mt-1 text-sm text-gray-900">{profile.cargo}</p>
                          </div>
                        )
                      )}

                      <button
                        onClick={() => setShowProfileForm(true)}
                        className="w-full px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-[44px]"
                      >
                        Профайл засах
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl">
                        Профайл үүсгээгүй байна.
                      </div>
                      <button
                        onClick={() => setShowProfileForm(true)}
                        className="w-full px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-[44px]"
                      >
                        Профайл үүсгэх
                      </button>
                    </>
                  )}

                  {user?.role === "admin" && (
                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      <Link
                        href="/admin/dashboard"
                        className="block w-full px-4 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors text-center font-medium min-h-[40px]"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

