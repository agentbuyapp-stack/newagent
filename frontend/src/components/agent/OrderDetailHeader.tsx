"use client";

import { memo } from "react";
import Image from "next/image";
import type { OrderStatus } from "@/lib/api";
import { getStatusText } from "@/lib/orderHelpers";

interface OrderDetailHeaderProps {
  isBundleOrder: boolean;
  bundleItemsCount: number;
  productName: string;
  status: OrderStatus;
  orderId: string;
  mainImage: string | null;
  onClose: () => void;
}

function getStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "niitlegdsen":
      return "bg-gray-100 text-gray-700";
    case "agent_sudlaj_bn":
      return "bg-amber-100 text-amber-700";
    case "tolbor_huleej_bn":
      return "bg-blue-100 text-blue-700";
    case "amjilttai_zahialga":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

function OrderDetailHeader({
  isBundleOrder,
  bundleItemsCount,
  productName,
  status,
  orderId,
  mainImage,
  onClose,
}: OrderDetailHeaderProps) {
  if (isBundleOrder) {
    return (
      <div className="sticky top-0 bg-linear-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Багц захиалга</h2>
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-xs">{bundleItemsCount} бараа</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
                  {getStatusText(status)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 bg-linear-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 z-10">
      <div className="flex items-start gap-4">
        {/* Product Thumbnail */}
        {mainImage ? (
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white/20 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg relative">
            <Image
              src={mainImage}
              alt={productName}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white/20 rounded-xl flex items-center justify-center border-2 border-white/30">
            <svg
              className="w-8 h-8 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Title and Status */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">
            {productName}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadgeClass(status)}`}>
              {getStatusText(status)}
            </span>
          </div>
          <p className="text-xs text-white/70 mt-1.5 font-mono">
            #{orderId.slice(-4).toUpperCase()}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all min-h-10 min-w-10"
        >
          <svg
            className="w-6 h-6"
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
      </div>
    </div>
  );
}

export default memo(OrderDetailHeader);
