/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Order } from "@/lib/api";

interface OrderCardProps {
  order: Order;
  viewMode: "list" | "card";
  onViewDetails: (order: Order) => void;
  onOpenChat: (order: Order) => void;
  onViewReport?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onArchive?: (order: Order) => void;
  deleteLoading?: boolean;
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
  onViewReport,
  onDelete,
  onArchive,
  deleteLoading = false,
}) => {
  // Can delete if status is "niitlegdsen" (before agent review) OR if archived
  const canDelete = order.status === "niitlegdsen" || order.archivedByUser;
  // Can archive only if order is completed or cancelled and not already archived
  const canArchive = (order.status === "amjilttai_zahialga" || order.status === "tsutsalsan_zahialga") && !order.archivedByUser;
  // Check if order has agent report (status indicates agent has submitted report)
  const hasReport = order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga";
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
          {hasReport && onViewReport ? (
            <button
              onClick={() => onViewReport(order)}
              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Тайлан
            </button>
          ) : (
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
          )}
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
          {canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(order);
              }}
              disabled={deleteLoading}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              {deleteLoading ? "..." : "Устгах"}
            </button>
          )}
          {canArchive && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(order);
              }}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Архив
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card View
  return (
    <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:border-blue-300 hover:scale-[1.01] transition-all duration-300 overflow-hidden p-4">
      <div className="flex gap-4">
        {/* Thumbnail */}
        {mainImage && (
          <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={mainImage}
              alt={order.productName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          {/* Top: Status */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${getStatusColor(order.status)}`}
            >
              {getStatusText(order.status)}
            </span>
            <p className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Product name */}
          <h4 className="font-bold text-gray-900 text-base truncate">
            {order.productName}
          </h4>

          {/* Description */}
          <p className="text-xs text-gray-500 line-clamp-1 mt-1">
            {order.description}
          </p>
        </div>
      </div>

      {/* Buttons - Bottom */}
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
        {hasReport && onViewReport ? (
          <button
            onClick={() => onViewReport(order)}
            className="h-8 px-3 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Тайлан
          </button>
        ) : (
          <button
            onClick={() => onViewDetails(order)}
            className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Дэлгэрэнгүй
          </button>
        )}

        {order.status !== "tsutsalsan_zahialga" && (
          <button
            onClick={() => onOpenChat(order)}
            className="h-8 px-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Чат
          </button>
        )}

        {canDelete && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(order);
            }}
            disabled={deleteLoading}
            className="h-8 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {deleteLoading ? "..." : "Устгах"}
          </button>
        )}

        {canArchive && onArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(order);
            }}
            className="h-8 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Архив
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
