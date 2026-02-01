"use client";

import { memo } from "react";
import type { RewardRequest } from "@/lib/api";

interface RewardsSectionProps {
  rewardRequests: RewardRequest[];
  showRewards: boolean;
  onToggle: () => void;
}

function RewardsSection({
  rewardRequests,
  showRewards,
  onToggle,
}: RewardsSectionProps) {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow relative z-10">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Урамшуулал
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Урамшууллын хүсэлтүүд ({rewardRequests.length})
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform duration-200 ${showRewards ? "rotate-180" : ""}`}
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

      {showRewards && (
        <div className="mt-4 space-y-4">
          <div>
            {rewardRequests.length > 0 ? (
              <div className="space-y-3">
                {rewardRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`border rounded-xl p-4 ${
                      request.status === "approved"
                        ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                        : request.status === "rejected"
                          ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
                          : "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {Math.round(request.amount).toLocaleString()} ₮
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                          {new Date(request.createdAt).toLocaleDateString("mn-MN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === "approved"
                              ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200"
                              : request.status === "rejected"
                                ? "bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200"
                                : "bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200"
                          }`}
                        >
                          {request.status === "approved"
                            ? "Батлагдсан"
                            : request.status === "rejected"
                              ? "Татгалзсан"
                              : "Хүлээж байна"}
                        </span>
                        {request.approvedAt && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            Батлагдсан:{" "}
                            {new Date(request.approvedAt).toLocaleDateString("mn-MN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                Урамшууллын хүсэлт байхгүй байна.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RewardsSection);
