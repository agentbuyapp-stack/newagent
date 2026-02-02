"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApiClient } from "@/lib/useApiClient";
import type { ProductShowcase } from "@/lib/api";

interface ProductShowcaseDisplayProps {
  className?: string;
}

export default function ProductShowcaseDisplay({ className = "" }: ProductShowcaseDisplayProps) {
  const apiClient = useApiClient();
  const [showcases, setShowcases] = useState<ProductShowcase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShowcases = useCallback(async () => {
    try {
      const response = await apiClient.getActiveShowcases();
      if (response.success) {
        setShowcases(response.data);
      }
    } catch (error) {
      console.error("Error fetching showcases:", error);
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => {
    fetchShowcases();
  }, [fetchShowcases]);

  if (loading || showcases.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showcases.map((showcase) => (
        <ShowcaseRow key={showcase.id} showcase={showcase} />
      ))}
    </div>
  );
}

function ShowcaseRow({ showcase }: { showcase: ProductShowcase }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);

  const hasProducts = showcase.products.length > 0;

  // Keep ref in sync with state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Auto scroll effect
  useEffect(() => {
    if (!hasProducts) return;

    const el = scrollRef.current;
    if (!el) return;

    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      if (!isPausedRef.current && el) {
        scrollPositionRef.current += scrollSpeed;

        // Calculate the width of one set of products
        const oneSetWidth = el.scrollWidth / 3;

        // Reset to beginning when we've scrolled past the first set
        if (scrollPositionRef.current >= oneSetWidth) {
          scrollPositionRef.current = 0;
        }

        el.scrollLeft = scrollPositionRef.current;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasProducts]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("mn-MN").format(price) + "₮";
  };

  // Early return after all hooks
  if (!hasProducts) return null;

  // Duplicate products for seamless loop (3x for smoother loop)
  const duplicatedProducts = [...showcase.products, ...showcase.products, ...showcase.products];

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          {showcase.title}
        </h3>
      </div>

      {/* Scrolling container */}
      <div
        className="overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onScroll={(e) => {
          // Sync scroll position when user manually scrolls
          scrollPositionRef.current = e.currentTarget.scrollLeft;
        }}
        ref={scrollRef}
      >
        <div
          className="flex gap-3"
        >
          {duplicatedProducts.map((product, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-28 sm:w-32 md:w-36 group cursor-pointer"
              onClick={() => product.link && window.open(product.link, "_blank")}
            >
              {/* Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Badge */}
                <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 text-white text-[9px] sm:text-[10px] font-medium rounded-md shadow-sm ${
                  product.badge === "zahialgaar" ? "bg-orange-500" : "bg-green-500"
                }`}>
                  {product.badge === "zahialgaar" ? "Захиалгаар" : "Бэлэн"}
                </div>
                {/* Hover overlay */}
                {product.link && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                )}
              </div>

              {/* Info */}
              <div className="px-0.5">
                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {product.name}
                </p>
                {product.price && (
                  <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {formatPrice(product.price)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
