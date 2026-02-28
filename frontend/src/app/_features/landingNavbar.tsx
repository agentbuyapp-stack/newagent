/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";

interface CargoOption {
  id: string;
  name: string;
}

interface LandingNavbarProps {
  dailyLimit?: { todayCount: number; maxPerDay: number; remaining: number } | null;
  selectedCargo?: string;
  cargos?: CargoOption[];
  onCargoChange?: (cargoName: string) => void;
  emailNotificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  isAgent?: boolean;
  agentPoints?: number;
  onRequestReward?: () => void;
}

export const LandingNavbar = ({
  dailyLimit,
  selectedCargo,
  cargos,
  onCargoChange,
  emailNotificationsEnabled,
  onToggleNotifications,
  isAgent,
  agentPoints = 0,
  onRequestReward,
}: LandingNavbarProps) => {
  const { isAuthenticated, logout } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCargoList, setShowCargoList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
        setShowCargoList(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [settingsOpen]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <img src="/icon.png" alt="AgentBuy" className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg" />
            <div className="flex flex-col">
              <span className="text-[15px] sm:text-lg font-bold leading-tight text-gray-900">AgentBuy</span>
              <span className="text-[10px] text-gray-500 leading-tight hidden sm:block">Худалдан авалт хялбар боллоо</span>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("how-it-works")} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">Хэрхэн ажилладаг</button>
              <button onClick={() => scrollToSection("platforms")} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">Платформууд</button>
              <button onClick={() => scrollToSection("testimonials")} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">Сэтгэгдэл</button>
              <button onClick={() => scrollToSection("contact")} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">Холбоо барих</button>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            {!isAuthenticated ? (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25">Нэвтрэх</Link>
            ) : (
              <>
                {/* Agent bonus badge */}
                {isAgent && (
                  <button
                    onClick={() => {
                      if (agentPoints <= 0) {
                        alert("Танд одоогоор бонус оноо байхгүй байна.");
                        return;
                      }
                      if (confirm(`${agentPoints.toLocaleString(undefined, { maximumFractionDigits: 0 })}₮ бонусыг авах хүсэлт илгээх үү?\nОноо 0 болж, admin-д хүсэлт очно.`)) {
                        if (onRequestReward) onRequestReward();
                      }
                    }}
                    className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 border transition-all ${
                      agentPoints > 0
                        ? "bg-amber-50 border-amber-300 hover:bg-amber-100 hover:shadow-sm cursor-pointer"
                        : "bg-white/80 backdrop-blur border-gray-200/60 cursor-default"
                    }`}
                  >
                    <svg className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${agentPoints > 0 ? "text-amber-500" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.96-3.12 3.19z"/>
                    </svg>
                    <span className={`text-[11px] sm:text-xs font-bold ${agentPoints > 0 ? "text-amber-700" : "text-gray-500"}`}>
                      {agentPoints.toLocaleString(undefined, { maximumFractionDigits: 0 })}₮
                    </span>
                  </button>
                )}

                {/* Daily limit badge */}
                {dailyLimit && (
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-white/80 backdrop-blur rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 border border-gray-200/60">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-[11px] sm:text-xs font-bold text-gray-800">{dailyLimit.remaining}/{dailyLimit.maxPerDay}</span>
                  </div>
                )}

                {/* Settings gear button */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => { setSettingsOpen(!settingsOpen); setShowCargoList(false); }}
                    className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all ${
                      settingsOpen
                        ? "bg-blue-100 text-blue-600"
                        : "bg-white/80 backdrop-blur text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>

                  {/* Settings dropdown */}
                  {settingsOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-50 min-w-[220px] overflow-hidden">
                      {/* Cargo section */}
                      {onCargoChange && cargos && cargos.length > 0 && (
                        <>
                          <button
                            onClick={() => setShowCargoList(!showCargoList)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <div className="text-left">
                                <p className="text-[13px] font-medium text-gray-800">Карго</p>
                                <p className="text-[11px] text-gray-400">{selectedCargo || "Сонгоогүй"}</p>
                              </div>
                            </div>
                            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCargoList ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {showCargoList && (
                            <div className="bg-gray-50 border-y border-gray-100 max-h-[180px] overflow-y-auto">
                              {cargos.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => {
                                    onCargoChange(c.name);
                                    setShowCargoList(false);
                                    setSettingsOpen(false);
                                  }}
                                  className={`w-full text-left text-[12px] px-5 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                                    selectedCargo === c.name ? "font-semibold text-indigo-700 bg-indigo-50/70" : "text-gray-600"
                                  }`}
                                >
                                  {c.name}
                                  {selectedCargo === c.name && (
                                    <svg className="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="border-b border-gray-100" />
                        </>
                      )}

                      {/* Notification toggle */}
                      {onToggleNotifications !== undefined && (
                        <>
                          <button
                            onClick={() => {
                              if (onToggleNotifications) onToggleNotifications();
                            }}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <svg className={`w-4 h-4 ${emailNotificationsEnabled ? "text-green-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                              </svg>
                              <span className="text-[13px] font-medium text-gray-800">Мэдэгдэл</span>
                            </div>
                            <div className={`relative w-9 h-5 rounded-full transition-colors ${emailNotificationsEnabled ? "bg-green-500" : "bg-gray-300"}`}>
                              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${emailNotificationsEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                            </div>
                          </button>
                          <div className="border-b border-gray-100" />
                        </>
                      )}

                      {/* Logout */}
                      <button
                        onClick={() => {
                          setSettingsOpen(false);
                          if (confirm("Та системээс гарахдаа итгэлтэй байна уу?")) logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 transition-colors group"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-[13px] font-medium text-gray-600 group-hover:text-red-500 transition-colors">Гарах</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {!isAuthenticated && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && !isAuthenticated && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <button onClick={() => scrollToSection("how-it-works")} className="block w-full text-left text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Хэрхэн ажилладаг</button>
            <button onClick={() => scrollToSection("platforms")} className="block w-full text-left text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Платформууд</button>
            <button onClick={() => scrollToSection("testimonials")} className="block w-full text-left text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Сэтгэгдэл</button>
            <button onClick={() => scrollToSection("contact")} className="block w-full text-left text-sm font-medium text-gray-600 hover:text-blue-600 py-2">Холбоо барих</button>
            <Link href="/login" className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all mt-2">Нэвтрэх</Link>
          </div>
        </div>
      )}
    </nav>
  );
};
