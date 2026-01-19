"use client";

import React from "react";
import { Order } from "@/lib/api";

interface OrderCardProps {
  order: Order;
  viewMode: "list" | "card";
  onViewDetails: (order: Order) => void;
  onOpenChat: (order: Order) => void;
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

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  viewMode,
  onViewDetails,
  onOpenChat,
}) => {
  const mainImage =
    order.imageUrls && order.imageUrls.length > 0
      ? order.imageUrls[0]
      : order.imageUrl || null;

  // List View
  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all p-3 flex items-center gap-3">
        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{order.productName}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} whitespace-nowrap`}>
              {getStatusText(order.status)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onViewDetails(order)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Дэлгэрэнгүй
          </button>
          {order.status !== "tsutsalsan_zahialga" && (
            <button
              onClick={() => onOpenChat(order)}
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

  // Card View
  return (
   <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden">
  <div className="flex gap-2 p-2">
    {/* Thumbnail */}
    {mainImage && (
      <div className="w-28 h-28 shrink-0 bg-gray-200 rounded-md overflow-hidden">
        <img
          src={mainImage}
          alt={order.productName}
          className="w-full h-full object-cover"
        />
      </div>
    )}

    {/* Content */}
    <div className="min-w-0 flex-1 space-y-1">
      {/* Top row: ID + Status */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono text-gray-400 truncate">
          ID: {order.id.slice(0, 6)}...
        </p>
        <span
          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${getStatusColor(
            order.status
          )}`}
        >
          {getStatusText(order.status)}
        </span>
      </div>

      {/* Product name */}
      <h4 className="font-bold text-gray-900 text-lg truncate">
        {order.productName}
      </h4>

      {/* Description */}
      <p className="text-[11px] text-gray-500 line-clamp-1">
        {order.description}
      </p>

      {/* Date */}
      <p className="text-[10px] text-gray-400">
        {new Date(order.createdAt).toLocaleDateString("mn-MN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>

      {/* Buttons */}
     
    </div>
     <div className="flex items-end justify-end gap-2 pt-1">
        <button
          onClick={() => onViewDetails(order)}
          className="h-7 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-[11px] font-semibold transition-all inline-flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Дэлгэрэнгүй
        </button>

        {order.status !== "tsutsalsan_zahialga" && (
          <button
            onClick={() => onOpenChat(order)}
            className="h-7 px-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-md text-[11px] font-semibold transition-all inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Чат
          </button>
        )}
      </div>
  </div>
</div>

  );
};

export default OrderCard;
