"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";

export const CTASection = () => {
  const { isAuthenticated } = useAuthContext();

  return (
    <section className="py-12 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-6">
          Одоо эхлэхэд бэлэн үү?
        </h2>
        <p className="text-gray-500 text-[13px] sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-10">
          Бүртгүүлээд хүссэн бараагаа Хятадаас захиалж эхлээрэй. Энгийн, хурдан, найдвартай.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {!isAuthenticated ? (
            <Link href="/login"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] sm:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/30 text-center">
              Бүртгүүлэх — Үнэгүй
            </Link>
          ) : (
            <Link href="/"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[14px] sm:text-lg px-8 sm:px-10 py-3 sm:py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-blue-500/30 text-center">
              Dashboard руу очих
            </Link>
          )}
        </div>

        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-4 sm:gap-6 text-gray-400">
          {["Үнэгүй бүртгэл", "Аюулгүй төлбөр", "24/7 дэмжлэг"].map((text) => (
            <div key={text} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-sm">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
