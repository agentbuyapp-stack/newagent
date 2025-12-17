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
    } catch (err) {
      console.error("Failed to load profile:", err);
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
      {user?.role === "agent" && user.agentPoints !== undefined && user.agentPoints > 0 && (
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs sm:text-sm font-semibold text-green-700">
            Миний оноо: {user.agentPoints.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮
          </span>
          <button
            onClick={async () => {
              const points = user.agentPoints || 0;
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
            }}
            className="ml-2 px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
            title="Оноо зарах"
          >
            Зарах
          </button>
        </div>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          title="Миний мэдээлэл"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-3 sm:p-4">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Миний мэдээлэл</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
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
                <ProfileForm profile={profile} onSuccess={handleProfileSuccess} />
                <button
                  onClick={handleCancelForm}
                  className="mt-3 w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Цуцлах
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Имэйл</label>
                  <p className="mt-1 text-sm text-gray-900">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Эрх</label>
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
                      <label className="block text-sm font-medium text-gray-700">Нэр</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Утас</label>
                      <p className="mt-1 text-sm text-gray-900">{profile.phone}</p>
                    </div>

                    {profile.cargo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ачаа</label>
                        <p className="mt-1 text-sm text-gray-900">{profile.cargo}</p>
                      </div>
                    )}

                    <button
                      onClick={() => setShowProfileForm(true)}
                      className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                      Профайл засах
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                      Профайл үүсгээгүй байна.
                    </div>
                    <button
                      onClick={() => setShowProfileForm(true)}
                      className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                      Профайл үүсгэх
                    </button>
                  </>
                )}

                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Link
                    href="/user/dashboard"
                    className="block w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    User Dashboard
                  </Link>
                  {(user?.role === "agent" || user?.role === "admin") && (
                    <Link
                      href="/agent/dashboard"
                      className="block w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Agent Dashboard
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      className="block w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </>
  );
}

