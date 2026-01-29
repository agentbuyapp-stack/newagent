"use client";

import React, { useState, useMemo } from "react";
import { Order, BundleOrder } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import OrderCard from "@/components/OrderCard";
import BundleOrderCard from "@/components/BundleOrderCard";

const ITEMS_PER_PAGE = 10;

// Combined type for both single and bundle orders
type CombinedOrder =
  | { type: "single"; data: Order }
  | { type: "bundle"; data: BundleOrder };

interface OrderHistorySectionProps {
  orders: Order[];
  bundleOrders: BundleOrder[];
  archivedOrders?: Order[];
  onSelectOrder: (order: Order) => void;
  onSelectBundleOrder: (bundleOrder: BundleOrder) => void;
  onOpenChat: (order: Order) => void;
  onOpenBundleChat: (bundleOrder: BundleOrder) => void;
  onViewReport?: (order: Order) => void;
  onViewBundleReport?: (bundleOrder: BundleOrder) => void;
  onDeleteOrder?: (order: Order) => void;
  onDeleteBundleOrder?: (bundleOrder: BundleOrder) => void;
  onArchiveOrder?: (order: Order) => void;
  onReload: () => void;
  deleteLoading?: boolean;
  archiveLoading?: boolean;
}

export default function OrderHistorySection({
  orders,
  bundleOrders,
  archivedOrders = [],
  onSelectOrder,
  onSelectBundleOrder,
  onOpenChat,
  onOpenBundleChat,
  onViewReport,
  onViewBundleReport,
  onDeleteOrder,
  onDeleteBundleOrder,
  onArchiveOrder,
  onReload,
  deleteLoading = false,
  archiveLoading = false,
}: OrderHistorySectionProps) {
  const apiClient = useApiClient();
  const [showOrderSection, setShowOrderSection] = useState(false);
  const [orderFilter, setOrderFilter] = useState<
    "active" | "completed" | "cancelled" | "archived"
  >("active");
  const [orderViewMode, setOrderViewMode] = useState<"list" | "card" | "compact">("card");
  const [currentPage, setCurrentPage] = useState(1);

  // Combine and filter orders
  const combinedOrders = useMemo((): CombinedOrder[] => {
    const singleOrders: CombinedOrder[] = orders.map((o) => ({
      type: "single",
      data: o,
    }));
    const bundleOrdersList: CombinedOrder[] = bundleOrders.map((o) => ({
      type: "bundle",
      data: o,
    }));
    return [...singleOrders, ...bundleOrdersList];
  }, [orders, bundleOrders]);

  // Archived orders (single only for now)
  const combinedArchivedOrders = useMemo((): CombinedOrder[] => {
    return archivedOrders.map((o) => ({ type: "single", data: o }));
  }, [archivedOrders]);

  const filteredOrders = useMemo(() => {
    // For archived filter, use archived orders list
    if (orderFilter === "archived") {
      return combinedArchivedOrders.sort((a, b) => {
        return (
          new Date(b.data.createdAt).getTime() -
          new Date(a.data.createdAt).getTime()
        );
      });
    }

    return combinedOrders
      .filter((item) => {
        const status = item.data.status;
        if (orderFilter === "active") {
          return [
            "niitlegdsen",
            "agent_sudlaj_bn",
            "tolbor_huleej_bn",
          ].includes(status);
        }
        if (orderFilter === "completed") {
          return status === "amjilttai_zahialga";
        }
        if (orderFilter === "cancelled") {
          return status === "tsutsalsan_zahialga";
        }
        return true;
      })
      .sort((a, b) => {
        return (
          new Date(b.data.createdAt).getTime() -
          new Date(a.data.createdAt).getTime()
        );
      });
  }, [combinedOrders, combinedArchivedOrders, orderFilter]);

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [orderFilter]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  const handleClearAllCancelledOrders = async () => {
    try {
      const cancelledSingle = orders.filter(
        (o) => o.status === "tsutsalsan_zahialga",
      );
      const cancelledBundle = bundleOrders.filter(
        (o) => o.status === "tsutsalsan_zahialga",
      );

      await Promise.all([
        ...cancelledSingle.map((o) => apiClient.cancelOrder(o.id)),
        ...cancelledBundle.map((o) => apiClient.deleteBundleOrder(o.id)),
      ]);

      onReload();
    } catch (error) {
      console.error("Error clearing cancelled orders:", error);
      alert("Алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  const handleClearAllArchivedOrders = async () => {
    try {
      await Promise.all(archivedOrders.map((o) => apiClient.cancelOrder(o.id)));

      onReload();
    } catch (error) {
      console.error("Error clearing archived orders:", error);
      alert("Алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  const totalOrdersCount = orders.length + bundleOrders.length;

  // Count orders by category
  const activeCount = combinedOrders.filter((item) =>
    ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn"].includes(
      item.data.status,
    ),
  ).length;
  const completedCount = combinedOrders.filter(
    (item) => item.data.status === "amjilttai_zahialga",
  ).length;
  const cancelledCount = combinedOrders.filter(
    (item) => item.data.status === "tsutsalsan_zahialga",
  ).length;
  const archivedCount = combinedArchivedOrders.length;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-20">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer min-w-0"
          onClick={() => setShowOrderSection(!showOrderSection)}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-[#0b4ce5] to-[#4a90e2] flex items-center justify-center shadow-md shadow-blue-500/20">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Өмнөх захиалгууд
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Нийт захиалга ({totalOrdersCount})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 text-gray-500 cursor-pointer transition-transform duration-200 ${showOrderSection ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            onClick={() => setShowOrderSection(!showOrderSection)}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {showOrderSection && (
        <div className="mt-4 space-y-2">
          {/* Category tabs */}
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <div className="flex items-center justify-start sm:justify-center border-b border-gray-200 dark:border-gray-700 min-w-max sm:min-w-0 gap-2 pt-2">
              <button
                onClick={() => setOrderFilter("active")}
                className={`relative px-3 sm:px-4 py-1.5 pr-5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-9 sm:min-h-10 ${
                  orderFilter === "active"
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Идэвхтэй
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
                    orderFilter === "active"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {activeCount}
                </span>
              </button>
              <button
                onClick={() => setOrderFilter("completed")}
                className={`relative px-3 sm:px-4 py-1.5 pr-5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-9 sm:min-h-10 ${
                  orderFilter === "completed"
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Амжилттай
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
                    orderFilter === "completed"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {completedCount}
                </span>
              </button>
              <button
                onClick={() => setOrderFilter("cancelled")}
                className={`relative px-3 sm:px-4 py-1.5 pr-5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-9 sm:min-h-10 ${
                  orderFilter === "cancelled"
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Цуцлагдсан
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
                    orderFilter === "cancelled"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {cancelledCount}
                </span>
              </button>
              <button
                onClick={() => setOrderFilter("archived")}
                className={`relative px-3 sm:px-4 py-1.5 pr-5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-9 sm:min-h-10 ${
                  orderFilter === "archived"
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                Архив
                <span
                  className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
                    orderFilter === "archived"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {archivedCount}
                </span>
              </button>
            </div>
          </div>

          {/* Clear All button for cancelled orders */}
          {orderFilter === "cancelled" && filteredOrders.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleClearAllCancelledOrders}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-9 sm:min-h-10"
              >
                Бүгдийг устгах
              </button>
            </div>
          )}

          {/* Clear All button for archived orders */}
          {orderFilter === "archived" && filteredOrders.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleClearAllArchivedOrders}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-9 sm:min-h-10"
              >
                Бүгдийг устгах
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 shrink-0">
              Харах:
            </span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 sm:p-1">
              <button
                onClick={() => setOrderViewMode("compact")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  orderViewMode === "compact"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="hidden xs:inline">Энгийн</span>
              </button>
              <button
                onClick={() => setOrderViewMode("card")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  orderViewMode === "card"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="hidden xs:inline">Карт</span>
              </button>
            </div>
          </div>

          {/* Orders list */}
          <div>
            {filteredOrders.length > 0 ? (
              <>
                <div
                  className={
                    orderViewMode === "card" ? "space-y-4" : orderViewMode === "compact" ? "space-y-1" : "space-y-2"
                  }
                >
                  {paginatedOrders.map((item) => {
                    if (item.type === "single") {
                      return (
                        <OrderCard
                          key={`single-${item.data.id}`}
                          order={item.data}
                          viewMode={orderViewMode}
                          onViewDetails={onSelectOrder}
                          onOpenChat={onOpenChat}
                          onViewReport={onViewReport}
                          onDelete={onDeleteOrder}
                          onArchive={onArchiveOrder}
                          deleteLoading={deleteLoading}
                          archiveLoading={archiveLoading}
                        />
                      );
                    } else {
                      return (
                        <BundleOrderCard
                          key={`bundle-${item.data.id}`}
                          bundleOrder={item.data}
                          viewMode={orderViewMode}
                          onViewDetails={onSelectBundleOrder}
                          onOpenChat={onOpenBundleChat}
                          onViewReport={onViewBundleReport}
                          onDelete={onDeleteBundleOrder}
                        />
                      );
                    }
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-9 sm:min-h-10"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {Array.from(
                          { length: Math.min(totalPages, 5) },
                          (_, i) => {
                            let page: number;
                            if (totalPages <= 5) {
                              page = i + 1;
                            } else if (currentPage <= 3) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i;
                            } else {
                              page = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-8 sm:min-h-10 min-w-8 sm:min-w-10 ${
                                  currentPage === page
                                    ? "bg-blue-500 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          },
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages),
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-9 sm:min-h-10"
                      >
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>

                    <span className="text-xs sm:text-sm text-gray-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(
                        currentPage * ITEMS_PER_PAGE,
                        filteredOrders.length,
                      )}{" "}
                      / {filteredOrders.length}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-center">
                <p>
                  {orderFilter === "active" &&
                    "Идэвхтэй захиалга байхгүй байна."}
                  {orderFilter === "completed" &&
                    "Амжилттай захиалга байхгүй байна."}
                  {orderFilter === "cancelled" &&
                    "Цуцлагдсан захиалга байхгүй байна."}
                  {orderFilter === "archived" &&
                    "Архивласан захиалга байхгүй байна."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
