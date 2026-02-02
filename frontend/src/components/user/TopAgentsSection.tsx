/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { PublicAgent } from "@/lib/api";

interface TopAgentsSectionProps {
  agents: PublicAgent[];
  onAgentClick: (agent: PublicAgent) => void;
}

export function TopAgentsSection({ agents, onAgentClick }: TopAgentsSectionProps) {
  const [showAgents, setShowAgents] = useState(false);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowAgents(!showAgents)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-md shadow-yellow-500/20">
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Топ 10 Агентууд
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Шилдэг агентуудын жагсаалт
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showAgents ? "rotate-180" : ""}`}
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

      {showAgents && (
        <div className="mt-4 space-y-4">
          {agents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
              onClick={() => onAgentClick(agent)}
            />
          ))}

          {agents.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg
                className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p>Одоогоор топ агент байхгүй байна</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  index,
  onClick,
}: {
  agent: PublicAgent;
  index: number;
  onClick: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Онлайн";
      case "busy":
        return "Завгүй";
      default:
        return "Офлайн";
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-3.5 h-3.5 ${
              i < fullStars
                ? "text-yellow-400"
                : i === fullStars && hasHalf
                  ? "text-yellow-400"
                  : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg cursor-pointer ${
        index === 0
          ? "bg-linear-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-700 shadow-md"
          : index === 1
            ? "bg-linear-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-700 dark:via-slate-800 dark:to-gray-700 border-gray-200 dark:border-gray-600"
            : index === 2
              ? "bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/30 dark:via-amber-900/20 dark:to-yellow-900/30 border-orange-200 dark:border-orange-700"
              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
      }`}
    >
      {/* Top Badge for top 3 */}
      {index < 3 && (
        <div
          className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold ${
            index === 0
              ? "bg-linear-to-r from-yellow-400 to-amber-500 text-white"
              : index === 1
                ? "bg-linear-to-r from-gray-400 to-slate-500 text-white"
                : "bg-linear-to-r from-orange-400 to-amber-500 text-white"
          }`}
        >
          {index === 0 ? "🥇 #1" : index === 1 ? "🥈 #2" : "🥉 #3"}
        </div>
      )}

      <div className="p-4">
        <div className="flex gap-4">
          {/* Avatar with Online Status */}
          <div className="relative shrink-0">
            {agent.avatarUrl ? (
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className={`w-16 h-16 rounded-full object-cover border-2 ${
                  index < 3
                    ? "border-yellow-300 dark:border-yellow-600"
                    : "border-gray-200 dark:border-gray-600"
                }`}
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                  index === 0
                    ? "bg-linear-to-br from-yellow-400 to-amber-500"
                    : index === 1
                      ? "bg-linear-to-br from-gray-400 to-slate-500"
                      : index === 2
                        ? "bg-linear-to-br from-orange-400 to-amber-500"
                        : "bg-linear-to-br from-purple-400 to-indigo-500"
                }`}
              >
                {agent.name[0]?.toUpperCase()}
              </div>
            )}
            {/* Online Status Indicator */}
            <div
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(agent.availabilityStatus)}`}
              title={getStatusText(agent.availabilityStatus)}
            />
            {/* Rank Badge for non-top-3 */}
            {index >= 3 && (
              <div className="absolute -top-1 -left-1 w-6 h-6 bg-linear-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                {index + 1}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  {agent.name}
                  {agent.featured && (
                    <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-xs rounded font-medium">
                      Онцлох
                    </span>
                  )}
                </h4>
                {/* Rating */}
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(agent.avgRating)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({agent.reviewCount} үнэлгээ)
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {agent.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {agent.bio}
              </p>
            )}

            {/* Specialties */}
            {agent.specialties && agent.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {agent.specialties.slice(0, 3).map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-xs rounded-full font-medium"
                  >
                    {specialty}
                  </span>
                ))}
                {agent.specialties.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                    +{agent.specialties.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1.5 text-sm">
                <svg
                  className="w-4 h-4 text-green-500"
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
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  {agent.successRate}%
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  амжилт
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <svg
                  className="w-4 h-4 text-blue-500"
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
                <span className="text-gray-700 dark:text-gray-300 font-semibold">
                  {agent.totalTransactions}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  гүйлгээ
                </span>
              </div>
              {agent.experienceYears && agent.experienceYears > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <svg
                    className="w-4 h-4 text-purple-500"
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
                  <span className="text-gray-700 dark:text-gray-300 font-semibold">
                    {agent.experienceYears}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    жил
                  </span>
                </div>
              )}
              {agent.responseTime && (
                <div className="hidden sm:flex items-center gap-1.5 text-sm">
                  <svg
                    className="w-4 h-4 text-amber-500"
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
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {agent.responseTime}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
