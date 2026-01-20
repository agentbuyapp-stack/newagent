"use client";

import React from "react";
import { BundleOrder } from "@/lib/api";

interface BundleOrderCardProps {
  bundleOrder: BundleOrder;
  viewMode: "list" | "card";
  onViewDetails: (bundleOrder: BundleOrder) => void;
  onOpenChat: (bundleOrder: BundleOrder) => void;
}

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case "niitlegdsen": return "bg-gray-100 text-gray-800";
    case "agent_sudlaj_bn": return "bg-yellow-100 text-yellow-800";
    case "tolbor_huleej_bn": return "bg-blue-100 text-blue-800";
    case "amjilttai_zahialga": return "bg-green-100 text-green-800";
    case "tsutsalsan_zahialga": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "niitlegdsen": return "Шинэ";
    case "agent_sudlaj_bn": return "Судлагдаж буй";
    case "tolbor_huleej_bn": return "Төлбөр хүлээж";
    case "amjilttai_zahialga": return "Амжилттай";
    case "tsutsalsan_zahialga": return "Цуцлагдсан";
    default: return status;
  }
};

export const BundleOrderCard: React.FC<BundleOrderCardProps> = ({
  bundleOrder,
  viewMode,
  onViewDetails,
  onOpenChat,
}) => {
  // Get first 3 product names
  const productNames = bundleOrder.items
    .slice(0, 3)
    .map((item) => item.productName)
    .join(", ");
  const hasMoreItems = bundleOrder.items.length > 3;
  const displayName = hasMoreItems
    ? `${productNames} (+${bundleOrder.items.length - 3})`
    : productNames;

  // Get first image from first item
  const mainImage =
    bundleOrder.items[0]?.imageUrls && bundleOrder.items[0].imageUrls.length > 0
      ? bundleOrder.items[0].imageUrls[0]
      : null;

  // List View
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all p-3 flex items-center gap-3">
        {/* Bundle indicator */}
        <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>

        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{displayName}</h4>
            <span className="text-xs text-purple-600 font-medium">({bundleOrder.items.length})</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bundleOrder.status)} whitespace-nowrap`}>
              {getStatusText(bundleOrder.status)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(bundleOrder.createdAt).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onViewDetails(bundleOrder)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Дэлгэрэнгүй
          </button>
          {bundleOrder.status !== "tsutsalsan_zahialga" && (
            <button
              onClick={() => onOpenChat(bundleOrder)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Чат
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card View - same as OrderCard but with bundle indicator
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:border-purple-300 hover:scale-[1.01] transition-all duration-300 overflow-hidden p-4">
      <div className="flex gap-4">
        {/* Thumbnail */}
        {mainImage ? (
          <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden relative">
            <img
              src={mainImage}
              alt={displayName}
              className="w-full h-full object-cover"
            />
            {/* Bundle badge */}
            <div className="absolute bottom-1 right-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {bundleOrder.items.length}
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 shrink-0 bg-purple-50 rounded-xl flex items-center justify-center relative">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {/* Bundle badge */}
            <div className="absolute bottom-1 right-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {bundleOrder.items.length}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          {/* Top: Status */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${getStatusColor(bundleOrder.status)}`}
            >
              {getStatusText(bundleOrder.status)}
            </span>
            <p className="text-xs text-gray-400">
              {new Date(bundleOrder.createdAt).toLocaleDateString("mn-MN", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Product names */}
          <h4 className="font-bold text-gray-900 text-base truncate">
            {displayName}
          </h4>

          {/* User info snippet */}
          <p className="text-xs text-gray-500 line-clamp-1 mt-1">
            {bundleOrder.userSnapshot.name} • {bundleOrder.userSnapshot.cargo}
          </p>
        </div>
      </div>

      {/* Buttons - Bottom */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewDetails(bundleOrder)}
          className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Дэлгэрэнгүй
        </button>

        {bundleOrder.status !== "tsutsalsan_zahialga" && (
          <button
            onClick={() => onOpenChat(bundleOrder)}
            className="h-8 px-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Чат
          </button>
        )}
      </div>
    </div>
  );
};

export default BundleOrderCard;
