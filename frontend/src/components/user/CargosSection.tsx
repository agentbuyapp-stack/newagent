"use client";

import { useState } from "react";
import type { Cargo } from "@/lib/api";

interface CargosSectionProps {
  cargos: Cargo[];
}

export function CargosSection({ cargos }: CargosSectionProps) {
  const [showCargos, setShowCargos] = useState(false);

  if (cargos.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowCargos(!showCargos)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Каргонууд
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Түншлэгч карго компаниуд ({cargos.length})
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showCargos ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {showCargos && (
        <div className="mt-4 space-y-3">
          {cargos.map((cargo) => (
            <CargoCard key={cargo.id} cargo={cargo} />
          ))}
        </div>
      )}
    </div>
  );
}

function CargoCard({ cargo }: { cargo: Cargo }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden border border-orange-100 dark:border-orange-900/50 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg transition-all min-h-55"
      style={{
        backgroundImage: cargo.imageUrl ? `url(${cargo.imageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Gradient overlay - only at bottom */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 ${cargo.imageUrl ? "bg-linear-to-t from-black/90 to-transparent" : ""}`}
      />
      {!cargo.imageUrl && (
        <div className="absolute inset-0 bg-linear-to-br from-white dark:from-gray-800 to-orange-50/50 dark:to-orange-900/20" />
      )}

      {/* Content positioned at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4
          className={`font-bold text-base sm:text-lg ${cargo.imageUrl ? "text-white drop-shadow-md" : "text-gray-900 dark:text-white"}`}
        >
          {cargo.name}
        </h4>
        {cargo.description && (
          <p
            className={`text-xs mt-1 ${cargo.imageUrl ? "text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
          >
            {cargo.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {cargo.phone && (
            <a
              href={`tel:${cargo.phone}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400"}`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {cargo.phone}
            </a>
          )}

          {cargo.website && (
            <a
              href={
                cargo.website.startsWith("http")
                  ? cargo.website
                  : `https://${cargo.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400"}`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              Вэбсайт
            </a>
          )}

          {cargo.facebook && (
            <a
              href={
                cargo.facebook.startsWith("http")
                  ? cargo.facebook
                  : `https://${cargo.facebook}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400"}`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          )}

          {cargo.location && (
            <a
              href={cargo.location}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400"}`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Байршил
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
