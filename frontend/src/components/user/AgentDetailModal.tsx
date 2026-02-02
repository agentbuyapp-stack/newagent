/* eslint-disable @next/next/no-img-element */
"use client";

import type { PublicAgent } from "@/lib/api";

interface AgentDetailModalProps {
  agent: PublicAgent;
  onClose: () => void;
}

export function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div
          className={`relative p-6 pb-16 rounded-t-2xl ${
            agent.rank === 1
              ? "bg-linear-to-br from-yellow-400 via-amber-400 to-orange-400"
              : agent.rank === 2
                ? "bg-linear-to-br from-gray-300 via-slate-400 to-gray-400"
                : agent.rank === 3
                  ? "bg-linear-to-br from-orange-300 via-amber-400 to-yellow-400"
                  : "bg-linear-to-br from-purple-500 via-indigo-500 to-blue-500"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-white"
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

          {/* Rank badge */}
          {agent.rank && agent.rank <= 10 && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold">
              {agent.rank === 1
                ? "🥇 #1"
                : agent.rank === 2
                  ? "🥈 #2"
                  : agent.rank === 3
                    ? "🥉 #3"
                    : `#${agent.rank}`}
            </div>
          )}
        </div>

        {/* Avatar - overlapping header */}
        <div className="relative -mt-12 flex justify-center">
          {agent.avatarUrl ? (
            <img
              src={agent.avatarUrl}
              alt={agent.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg ${
                agent.rank === 1
                  ? "bg-linear-to-br from-yellow-400 to-amber-500"
                  : agent.rank === 2
                    ? "bg-linear-to-br from-gray-400 to-slate-500"
                    : agent.rank === 3
                      ? "bg-linear-to-br from-orange-400 to-amber-500"
                      : "bg-linear-to-br from-purple-400 to-indigo-500"
              }`}
            >
              {agent.name[0]?.toUpperCase()}
            </div>
          )}
          {/* Online status */}
          <div
            className={`absolute bottom-0 right-1/2 translate-x-10 w-5 h-5 rounded-full border-3 border-white ${
              agent.availabilityStatus === "online"
                ? "bg-green-500"
                : agent.availabilityStatus === "busy"
                  ? "bg-yellow-500"
                  : "bg-gray-400"
            }`}
          />
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Name and status */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {agent.name}
              {agent.featured && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                  Онцлох
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {agent.availabilityStatus === "online"
                ? "🟢 Онлайн"
                : agent.availabilityStatus === "busy"
                  ? "🟡 Завгүй"
                  : "⚫ Офлайн"}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(agent.avgRating) ? "text-yellow-400" : "text-gray-300"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-700 font-semibold">
              {agent.avgRating.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm">
              ({agent.reviewCount} үнэлгээ)
            </span>
          </div>

          {/* Bio */}
          {agent.bio && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Танилцуулга
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {agent.bio}
              </p>
            </div>
          )}

          {/* Specialties */}
          {agent.specialties && agent.specialties.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Мэргэшил
              </h3>
              <div className="flex flex-wrap gap-2">
                {agent.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {agent.successRate}%
              </p>
              <p className="text-xs text-gray-500">Амжилтын хувь</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {agent.totalTransactions}
              </p>
              <p className="text-xs text-gray-500">Нийт гүйлгээ</p>
            </div>
            {agent.experienceYears && agent.experienceYears > 0 && (
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {agent.experienceYears}
                </p>
                <p className="text-xs text-gray-500">Жилийн туршлага</p>
              </div>
            )}
            {agent.responseTime && (
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {agent.responseTime}
                </p>
                <p className="text-xs text-gray-500">Хариу өгөх хугацаа</p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            {agent.languages && agent.languages.length > 0 && (
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Хэл</p>
                  <p className="text-sm text-gray-700">
                    {agent.languages.join(", ")}
                  </p>
                </div>
              </div>
            )}
            {agent.workingHours && (
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Ажлын цаг</p>
                  <p className="text-sm text-gray-700">{agent.workingHours}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
