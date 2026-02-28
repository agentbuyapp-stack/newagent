/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useRef } from "react";
import { apiClient } from "@/lib/api";
import type { GalleryItem } from "@/lib/api";

export const StatsSection = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.getGalleryImages().then(setImages).catch(() => {});
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || images.length === 0) return;

    let animId: number;
    let speed = 0.5;

    const scroll = () => {
      el.scrollLeft += speed;
      // Reset to start when scrolled past halfway (seamless loop)
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      }
      animId = requestAnimationFrame(scroll);
    };

    animId = requestAnimationFrame(scroll);

    const pause = () => { speed = 0; };
    const resume = () => { speed = 0.5; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause);
    el.addEventListener("touchend", resume);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [images]);

  if (images.length === 0) return null;

  // Duplicate images for seamless loop
  const loopImages = [...images, ...images];

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-linear-to-r from-[#0b4ce5] via-[#3b72e8] to-[#00b4d8] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white">
            Бидний хийсэн ажлууд
          </h2>
          <p className="mt-2 text-blue-100 text-[13px] sm:text-base">
            Амжилттай гүйцэтгэсэн захиалгуудын жишээнүүд
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loopImages.map((item, idx) => (
            <div
              key={idx}
              className="shrink-0 w-48 sm:w-64 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg relative"
            >
              <img
                src={item.url}
                alt={item.caption || `Ажлын жишээ ${(idx % images.length) + 1}`}
                className="w-full h-48 sm:h-64 object-cover hover:scale-105 transition-transform duration-300"
              />
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2.5 pt-6">
                  <p className="text-white text-xs sm:text-sm font-medium line-clamp-2">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
