"use client";

import React, { useState, useMemo } from "react";
import { BundleOrder, BundleItem } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import BundleOrderCard from "@/components/BundleOrderCard";

const ITEMS_PER_PAGE = 10;

interface BundleOrderHistorySectionProps {
  bundleOrders: BundleOrder[];
  onSelectBundleOrder: (bundleOrder: BundleOrder) => void;
  onOpenChat: (bundleOrder: BundleOrder) => void;
  onViewItemReport?: (bundleOrder: BundleOrder, item: BundleItem) => void;
  onReload: () => void;
}

export default function BundleOrderHistorySection({
  bundleOrders,
  onSelectBundleOrder,
  onOpenChat,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onViewItemReport,
  onReload,
}: BundleOrderHistorySectionProps) {
  const apiClient = useApiClient();
  const [showSection, setShowSection] = useState(false);
  const [orderFilter, setOrderFilter] = useState<
    "all" | "active" | "completed" | "cancelled"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return bundleOrders
      .filter((order) => {
        if (orderFilter === "all") return true;
        if (orderFilter === "active") {
          return ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn"].includes(
            order.status
          );
        }
        if (orderFilter === "completed") {
          return order.status === "amjilttai_zahialga";
        }
        if (orderFilter === "cancelled") {
          return order.status === "tsutsalsan_zahialga";
        }
        return true;
      })
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [bundleOrders, orderFilter]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [orderFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  const handleClearAllCancelled = async () => {
    if (!confirm("Та бүх цуцлагдсан багц захиалгыг устгахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      const cancelledOrders = bundleOrders.filter(
        (o) => o.status === "tsutsalsan_zahialga"
      );
      await Promise.all(cancelledOrders.map((o) => apiClient.deleteBundleOrder(o.id)));
      onReload();
      alert("Цуцлагдсан багц захиалгууд амжилттай устгагдлаа.");
    } catch (error) {
      console.error("Error clearing cancelled bundle orders:", error);
      alert("Алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  if (bundleOrders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div
        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 -mx-5 -mt-5 px-5 pt-5 pb-3 rounded-t-2xl transition-colors"
        onClick={() => setShowSection(!showSection)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-linear-to-br from-purple-100 to-indigo-100 rounded-xl">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Багц захиалгууд ({bundleOrders.length})
          </h2>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showSection ? "rotate-90" : ""}`}
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
        </div>
      </div>

      {showSection && (
        <div className="space-y-3 mt-4">
          {/* Filter tabs */}
          <div className="flex items-center justify-center border-b border-gray-200">
            <button
              onClick={() => setOrderFilter("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-10 ${
                orderFilter === "all"
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Бүгд
            </button>
            <button
              onClick={() => setOrderFilter("active")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-10 ${
                orderFilter === "active"
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Идэвхтэй
            </button>
            <button
              onClick={() => setOrderFilter("completed")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-10 ${
                orderFilter === "completed"
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Амжилттай
            </button>
            <button
              onClick={() => setOrderFilter("cancelled")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-10 ${
                orderFilter === "cancelled"
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Цуцлагдсан
            </button>
          </div>

          {/* Clear cancelled button */}
          {orderFilter === "cancelled" && filteredOrders.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClearAllCancelled}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Бүгдийг устгах
              </button>
            </div>
          )}

          {/* Bundle Orders List */}
          <div>
            {filteredOrders.length > 0 ? (
              <>
                <div className="space-y-3">
                  {paginatedOrders.map((bundleOrder) => (
                    <BundleOrderCard
                      key={bundleOrder.id}
                      bundleOrder={bundleOrder}
                      viewMode="card"
                      onViewDetails={onSelectBundleOrder}
                      onOpenChat={onOpenChat}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-10 min-w-10 ${
                            currentPage === page
                              ? "bg-purple-500 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <span className="ml-4 text-sm text-gray-500">
                      {filteredOrders.length} захиалгаас {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                <p>
                  {orderFilter === "all" && "Багц захиалга байхгүй байна."}
                  {orderFilter === "active" && "Идэвхтэй багц захиалга байхгүй байна."}
                  {orderFilter === "completed" && "Амжилттай багц захиалга байхгүй байна."}
                  {orderFilter === "cancelled" && "Цуцлагдсан багц захиалга байхгүй байна."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
