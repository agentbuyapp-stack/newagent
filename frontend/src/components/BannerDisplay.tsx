"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApiClient } from "@/lib/useApiClient";
import type { Banner } from "@/lib/api";

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}

// Get YouTube thumbnail
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

interface BannerDisplayProps {
  className?: string;
  autoSlideInterval?: number;
}

export default function BannerDisplay({ className = "", autoSlideInterval = 4000 }: BannerDisplayProps) {
  const apiClient = useApiClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      const response = await apiClient.getActiveBanners();
      if (response.success) {
        setBanners(response.data.map(b => ({ ...b, id: b._id || b.id })));
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Auto-slide effect
  useEffect(() => {
    if (banners.length <= 1 || isHovered || showVideo) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoSlideInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [banners.length, autoSlideInterval, isHovered, showVideo, currentIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setShowVideo(false);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setShowVideo(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setShowVideo(false);
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const videoId = currentBanner?.type === "video" ? getYouTubeVideoId(currentBanner.url) : null;

  const handleBannerClick = () => {
    if (currentBanner.type === "video" && videoId) {
      setShowVideo(true);
    } else if (currentBanner.type === "link" || currentBanner.type === "image") {
      window.open(currentBanner.url, "_blank");
    }
  };

  const getBannerImage = (banner: Banner) => {
    const vid = banner.type === "video" ? getYouTubeVideoId(banner.url) : null;
    return banner.thumbnailUrl || (vid ? getYouTubeThumbnail(vid) : banner.url);
  };

  return (
    <div className={`${className}`}>
      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 px-1">
        Танд дуулгах боломжууд
      </h3>

      <div
        className="relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Video modal */}
      {showVideo && videoId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video">
            <iframe
              className="w-full h-full rounded-xl"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={currentBanner.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setShowVideo(false)}
              className="absolute -top-10 right-0 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main carousel */}
      <div className="relative overflow-hidden rounded-xl max-w-5xl mx-auto">
        {/* Slides container */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => {
            const vid = banner.type === "video" ? getYouTubeVideoId(banner.url) : null;

            return (
              <div
                key={banner.id}
                className="w-full flex-shrink-0"
              >
                <div
                  className="relative aspect-[2/1] sm:aspect-[2.5/1] md:aspect-[3/1] cursor-pointer"
                  onClick={handleBannerClick}
                >
                  <img
                    src={getBannerImage(banner)}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="text-white font-bold text-sm sm:text-lg md:text-xl line-clamp-1">
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p className="text-white/90 text-xs sm:text-sm mt-1 line-clamp-1">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Play button for videos */}
                  {banner.type === "video" && vid && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Link indicator */}
                  {banner.type === "link" && (
                    <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg">
                      <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-all ${isHovered ? "opacity-100" : "opacity-0"}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={goToNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-all ${isHovered ? "opacity-100" : "opacity-0"}`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Pagination dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? "w-4 sm:w-6 h-1.5 bg-white rounded-full"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70 rounded-full"
                }`}
              />
            ))}
          </div>
        )}

        {/* Progress bar */}
        {banners.length > 1 && !isHovered && !showVideo && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
            <div
              key={currentIndex}
              className="h-full bg-white/70 animate-progress"
              style={{ ["--duration" as string]: `${autoSlideInterval}ms` }}
            />
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes progressAnim {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progressAnim var(--duration) linear forwards;
        }
      `}</style>
      </div>
    </div>
  );
}
