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
