"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import NewOrderForm from "@/components/dashboard/NewOrderForm";

interface HomePageHeroTextProps {
  profile?: { name?: string; phone?: string; cargo?: string } | null;
  isProfileComplete?: boolean;
  hasOrdersLeft?: boolean;
  dailyLimit?: { todayCount: number; maxPerDay: number; remaining: number } | null;
  onShowProfile?: () => void;
  onOrderSuccess?: () => void;
  heroImages?: string[];
}

export const HomePageHeroText = ({
  profile, isProfileComplete, hasOrdersLeft, dailyLimit, onShowProfile, onOrderSuccess, heroImages,
}: HomePageHeroTextProps) => {
  const { isAuthenticated } = useAuthContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const hasHeroImages = heroImages && heroImages.length > 0;

  const nextSlide = useCallback(() => {
    if (!hasHeroImages) return;
    setCurrentSlide((prev) => (prev + 1) % heroImages!.length);
  }, [hasHeroImages, heroImages]);

  useEffect(() => {
    if (!hasHeroImages || heroImages!.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [hasHeroImages, heroImages, nextSlide]);

  return (
    <div className="flex flex-col justify-center items-center gap-3 sm:gap-5 w-full px-4 pt-16 sm:pt-24 relative">
      {/* Hero background images slideshow */}
      {hasHeroImages && (
        <div className="absolute inset-0 -top-20 overflow-hidden -z-10">
          {heroImages!.map((url, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={url}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                idx === currentSlide ? "opacity-30" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-white" />
        </div>
      )}
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 animate-fade-in">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[11px] sm:text-sm font-medium text-blue-700">
          {isAuthenticated && profile?.name
            ? `Сайн байна уу, ${profile.name}!`
            : "Монголын #1 худалдааны агент платформ"}
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="max-w-4xl text-center animate-fade-in-up">
        <span className="block text-[22px] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
          Хятадаас бараа захиалах
        </span>
        <span
          className="block text-[22px] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mt-0.5 sm:mt-2 text-transparent bg-clip-text bg-linear-to-r from-[#0b4ce5] via-[#4a90e2] to-[#00d4ff]"
          style={{ backgroundSize: "200% 200%", animation: "gradient-shift 3s ease infinite" }}
        >
          хамгийн хялбар арга
        </span>
      </h1>

      {/* Subtitle */}
      <p className="max-w-md sm:max-w-2xl text-center text-gray-500 text-[13px] sm:text-base md:text-lg leading-relaxed animate-fade-in-up animation-delay-150">
        {isAuthenticated
          ? "Барааныхаа мэдээллийг оруулаад, агент судалгаа хийж, үнийн санал өгнө"
          : "Taobao, 1688, Pinduoduo зэрэг сайтуудаас найдвартай агентаар дамжуулан бараагаа захиалаарай"}
      </p>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 animate-fade-in-up animation-delay-200">
        {[
          { num: "1", label: "Бараа оруулах" },
          { num: "2", label: "Тайлан харах" },
          { num: "3", label: "Төлбөр төлөх" },
        ].map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                i === 0
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-200/60 text-gray-400"
              }`}>
                {step.num}
              </div>
              <span className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                i === 0 ? "text-gray-900" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-8 sm:w-20 h-[2px] mx-1.5 sm:mx-3 mb-4 sm:mb-5 ${
                i === 0 ? "bg-blue-300" : "bg-gray-200"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Action Area */}
      <div className="w-full max-w-2xl animate-fade-in-up animation-delay-300">
        {isAuthenticated ? (
          /* ── Logged in: real form ── */
          <div className="bg-white rounded-2xl shadow-xl shadow-blue-500/10 border border-gray-200 overflow-hidden">
            {!hasOrdersLeft ? (
              <div className="px-5 sm:px-10 py-8 sm:py-14 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">Өнөөдрийн хязгаар дууссан</h3>
                <p className="text-[13px] sm:text-sm text-gray-500 mb-3 max-w-xs mx-auto">
                  Та өнөөдөр {dailyLimit?.maxPerDay ?? 5} захиалга үүсгэсэн байна. Маргааш дахин оролдоно уу.
                </p>
                <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-4 py-2">
                  <span className="text-sm font-bold text-gray-700">{dailyLimit?.todayCount ?? 0}/{dailyLimit?.maxPerDay ?? 5}</span>
                  <span className="text-xs text-gray-500">өнөөдрийн захиалга</span>
                </div>
              </div>
            ) : !isProfileComplete ? (
              <div className="px-5 sm:px-10 py-8 sm:py-14 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">Профайлаа бөглөнө үү</h3>
                <p className="text-[13px] sm:text-sm text-gray-500 mb-5 sm:mb-6 max-w-xs mx-auto">Захиалга үүсгэхийн тулд эхлээд мэдээллээ оруулна уу</p>
                <button onClick={onShowProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30">
                  Профайл бөглөх
                </button>
              </div>
            ) : (
              <div className="px-4 sm:px-8 py-5 sm:py-8">
                <NewOrderForm onSuccess={onOrderSuccess || (() => {})} />
              </div>
            )}
          </div>
        ) : (
          /* ── Not logged in: fake input → login ── */
          <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3 bg-white rounded-2xl p-1.5 sm:p-2 shadow-xl shadow-blue-500/10 border border-gray-200">
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <input type="text" placeholder="Барааны мэдээллээ оруулна уу..."
                className="w-full text-[13px] sm:text-base text-gray-800 placeholder-gray-400 outline-none bg-transparent" readOnly />
            </div>
            <Link href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[13px] sm:text-base px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer whitespace-nowrap text-center">
              Захиалга өгөх
            </Link>
          </div>
        )}
      </div>

      {/* Platform logos */}
      <div className="flex items-center gap-3 sm:gap-6 mt-1 sm:mt-2 animate-fade-in-up animation-delay-500">
        <span className="text-[11px] sm:text-xs text-gray-400 hidden sm:block">Дэмжигдсэн:</span>
        <div className="flex items-center gap-2.5 sm:gap-5">
          {[
            { src: "/taobao.png", alt: "Taobao" },
            { src: "/alibaba.png", alt: "1688/Alibaba" },
            { src: "/pinduoduo-stock-e-commerce-1609177441009.webp", alt: "Pinduoduo" },
            { src: "/Dewu-Poizon-E-Commerce-1024x576.jpg", alt: "Poizon" },
          ].map((p) => (
            <img key={p.alt} src={p.src} alt={p.alt}
              className="w-7 h-7 sm:w-10 sm:h-10 rounded-md sm:rounded-lg object-cover opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
          ))}
        </div>
      </div>
    </div>
  );
};
