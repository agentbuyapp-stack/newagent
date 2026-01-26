"use client";

import { memo } from "react";
import type { OrderStatus, Order } from "@/lib/api";

interface OrderActionButtonsProps {
  status: OrderStatus;
  order: Order;
  isBundleOrder: boolean;
  canArchive: boolean;
  statusUpdateLoading: boolean;
  archiveLoading: boolean;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onOpenReportForm: (order: Order, isBundleOrder: boolean) => void;
  onOpenCancelModal: (orderId: string) => void;
  onArchive: (orderId: string) => void;
}

function OrderActionButtons({
  status,
  order,
  isBundleOrder,
  canArchive,
  statusUpdateLoading,
  archiveLoading,
  onUpdateStatus,
  onOpenReportForm,
  onOpenCancelModal,
  onArchive,
}: OrderActionButtonsProps) {
  return (
    <div className="space-y-3 pt-2">
      {/* Status Update Actions (for agents) */}
      {status === "niitlegdsen" && (
        <button
          onClick={() => onUpdateStatus(order.id, "agent_sudlaj_bn")}
          disabled={statusUpdateLoading}
          className="w-full px-4 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {statusUpdateLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
          {statusUpdateLoading ? "Уншиж байна..." : "Захиалга авах"}
        </button>
      )}

      {status === "agent_sudlaj_bn" && (
        <>
          <button
            onClick={() => onOpenReportForm(order, isBundleOrder)}
            className="w-full px-4 py-3 bg-linear-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Тайлан илгээх
          </button>
          <button
            onClick={() => onOpenCancelModal(order.id)}
            className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Захиалга цуцлах
          </button>
        </>
      )}

      {/* Archive Button - for completed/cancelled orders */}
      {canArchive && (
        <button
          onClick={() => onArchive(order.id)}
          disabled={archiveLoading}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {archiveLoading ? (
            <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          )}
          {archiveLoading ? "Уншиж байна..." : "Архивлах"}
        </button>
      )}
    </div>
  );
}

export default memo(OrderActionButtons);
