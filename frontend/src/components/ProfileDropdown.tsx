"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { type User, type Profile } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import ProfileForm from "./ProfileForm";

export default function ProfileDropdown() {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      window.addEventListener("focus", handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", handleFocus);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
    } catch (e: unknown) {
      console.error("Failed to load profile:", e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      const errorStack = e instanceof Error ? e.stack : undefined;
      console.error("Error details:", {
        message: errorMessage,
        stack: errorStack,
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

  const handleSignOut = async () => {
    if (!confirm("Та системээс гарахдаа итгэлтэй байна уу?")) {
      return;
    }
    await signOut();
    router.push("/");
  };

  return (
    <>
      {/* Agent Points Display - Outside dropdown container */}
      {user?.role === "agent" &&
        user.agentPoints !== undefined &&
        (() => {
          const displayPoints = Math.max(0, user.agentPoints || 0);
          return (
            <div
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 border rounded-lg sm:rounded-xl ${
                displayPoints > 0
                  ? "bg-blue-50 border-blue-200 hover:bg-blue-100 cursor-pointer"
                  : "bg-gray-50 border-gray-200 cursor-default"
              } transition-colors`}
              onClick={
                displayPoints > 0
                  ? async () => {
                      const points = displayPoints;
                      if (
                        !confirm(
                          `Та ${points.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮ оноогоо зарахдаа итгэлтэй байна уу? Оноо 0 болж, admin-д урамшуулал хүсэлт илгээгдэнэ.`,
                        )
                      ) {
                        return;
                      }

                      try {
                        await apiClient.createRewardRequest();
                        alert(
                          "Оноо амжилттай зарагдлаа. Admin-д хүсэлт илгээгдлээ.",
                        );
                        // Reload profile to update points
                        await loadProfile();
                      } catch (e: unknown) {
                        const errorMessage =
                          e instanceof Error ? e.message : "Алдаа гарлаа";
                        alert(errorMessage);
                      }
                    }
                  : undefined
              }
              title={displayPoints > 0 ? "Оноо зарах - Дарах" : "Оноо байхгүй"}
            >
              <svg
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${displayPoints > 0 ? "text-blue-600" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                className={`text-[10px] sm:text-xs font-semibold ${displayPoints > 0 ? "text-blue-600" : "text-gray-400"}`}
              >
                {displayPoints.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                ₮
              </span>
            </div>
          );
        })()}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors min-h-10 min-w-10"
          title="Миний мэдээлэл"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[85vh] overflow-y-auto shadow-lg">
            <div className="p-3 sm:p-4">
              <div className="flex justify-between items-center mb-2 sm:mb-3 sticky top-0 bg-white dark:bg-gray-800 pb-2 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Миний мэдээлэл
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 min-h-8 min-w-8"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-4 text-gray-500">
                  Ачааллаж байна...
                </div>
              ) : showProfileForm ? (
                <div className="max-h-[70vh] overflow-y-auto">
                  <ProfileForm
                    profile={profile}
                    onSuccess={handleProfileSuccess}
                    hideCargo={user?.role === "agent"}
                  />
                  <button
                    onClick={handleCancelForm}
                    className="mt-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 transition-colors font-medium min-h-11"
                  >
                    Цуцлах
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Имэйл
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {clerkUser?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Эрх
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {user?.role === "agent"
                        ? user?.isApproved
                          ? "agent"
                          : "agent (батлагдаагүй)"
                        : user?.role || "user"}
                    </p>
                  </div>

                  {profile ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                          Нэр
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {profile.name}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                          Утас
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {profile.phone}
                        </p>
                      </div>

                      {user?.role === "agent"
                        ? profile.accountNumber && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                Дансны дугаар
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {profile.accountNumber}
                              </p>
                            </div>
                          )
                        : profile.cargo && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                                Карго
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                {profile.cargo}
                              </p>
                            </div>
                          )}

                      {/* Email notification status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                          Email мэдэгдэл
                        </label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {profile.emailNotificationsEnabled !== false ? "Идэвхтэй" : "Идэвхгүй"}
                        </p>
                      </div>

                      <button
                        onClick={() => setShowProfileForm(true)}
                        className="w-full px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-11"
                      >
                        Профайл засах
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                        Профайл үүсгээгүй байна.
                      </div>
                      <button
                        onClick={() => setShowProfileForm(true)}
                        className="w-full px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-11"
                      >
                        Профайл үүсгэх
                      </button>
                    </>
                  )}

                  {user?.role === "admin" && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <Link
                        href="/admin/dashboard"
                        className="block w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 transition-colors text-center font-medium min-h-10"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    </div>
                  )}

                  {/* Sign Out Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-800 hover:border-red-500 rounded-xl transition-colors font-medium min-h-11"
                    >
                      Гарах
                    </button>
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
