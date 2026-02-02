"use client";

import { useState } from "react";
import type { Order, AgentReport, LatestVoiceMessage } from "@/lib/api";
import MyOrderCard from "./MyOrderCard";
import type { OrderFilterType } from "@/hooks/useAgentOrders";

type ViewModeType = "card" | "list" | "compact";

interface MyOrdersSectionProps {
  totalOrders: number;
  filteredOrders: Order[];
  paginatedOrders: Order[];
  agentReports: Record<string, AgentReport | null>;
  exchangeRate: number;

  // Filter
  orderFilter: OrderFilterType;
  setOrderFilter: (filter: OrderFilterType) => void;

  // Counts
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  archivedCount: number;

  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;

  // Actions
  onViewOrder: (order: Order) => void;
  onOpenChat: (order: Order) => void;
  onOpenReportForm: (order: Order, isBundleOrder: boolean) => void;
  onClearOrder: (orderId: string) => void;
  onArchiveOrder: (orderId: string) => void;
  onClearAllCancelled: () => void;
  onClearAllArchived: () => void;
  canArchiveOrder: (order: Order) => boolean;
  calculateUserPaymentAmount: (report: AgentReport | null, exchangeRate: number) => number;
  onSendVoiceMessage: (orderId: string, audioBase64: string, duration: number) => Promise<void>;
  latestVoiceMessages: Record<string, LatestVoiceMessage | null>;
  currentUserId?: string;

  // Loading states
  archiveLoading: boolean;
  clearLoading: boolean;
}

export function MyOrdersSection({
  totalOrders,
  filteredOrders,
  paginatedOrders,
  agentReports,
  exchangeRate,
  orderFilter,
  setOrderFilter,
  activeCount,
  completedCount,
  cancelledCount,
  archivedCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onViewOrder,
  onOpenChat,
  onOpenReportForm,
  onClearOrder,
  onArchiveOrder,
  onClearAllCancelled,
  onClearAllArchived,
  canArchiveOrder,
  calculateUserPaymentAmount,
  onSendVoiceMessage,
  latestVoiceMessages,
  currentUserId,
  archiveLoading,
  clearLoading,
}: MyOrdersSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewModeType>("card");

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow relative z-10">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
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
              Миний захиалгууд
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Таны авсан захиалгууд ({totalOrders})
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
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

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Category tabs */}
          <div className="flex flex-row gap-1 sm:gap-2 border-b border-slate-600 pt-2 overflow-x-auto pb-px">
            <FilterTab
              label="Идэвхтэй"
              count={activeCount}
              isActive={orderFilter === "active"}
              onClick={() => setOrderFilter("active")}
            />
            <FilterTab
              label="Амжилттай"
              count={completedCount}
              isActive={orderFilter === "completed"}
              onClick={() => setOrderFilter("completed")}
            />
            <FilterTab
              label="Цуцлагдсан"
              count={cancelledCount}
              isActive={orderFilter === "cancelled"}
              onClick={() => setOrderFilter("cancelled")}
            />
            <FilterTab
              label="Архив"
              count={archivedCount}
              isActive={orderFilter === "archived"}
              onClick={() => setOrderFilter("archived")}
              hideCount
            />
          </div>

          {/* Clear All button for cancelled orders */}
          {orderFilter === "cancelled" && filteredOrders.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={onClearAllCancelled}
                disabled={clearLoading}
                className="px-4 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {clearLoading ? "Устгаж байна..." : "Бүгдийг устгах"}
              </button>
            </div>
          )}

          {/* Archive info - Agent cannot delete, only view archived orders */}
          {orderFilter === "archived" && filteredOrders.length > 0 && (
            <div className="flex items-center mb-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Нийт {archivedCount} захиалга
              </span>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 shrink-0">
              Харах:
            </span>
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 sm:p-1">
              <button
                onClick={() => setViewMode("compact")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  viewMode === "compact"
                    ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden xs:inline">Энгийн</span>
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  viewMode === "card"
                    ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden xs:inline">Карт</span>
              </button>
            </div>
          </div>

          {/* Filtered orders */}
          <div>
            {filteredOrders.length > 0 ? (
              <>
                <div className={
                  viewMode === "card"
                    ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
                    : "space-y-1"
                }>
                  {paginatedOrders.map((order) => (
                    <MyOrderCard
                      key={order.id}
                      order={order}
                      viewMode={viewMode}
                      agentReport={agentReports[order.id]}
                      exchangeRate={exchangeRate}
                      canArchive={canArchiveOrder(order)}
                      archiveLoading={archiveLoading}
                      onViewOrder={onViewOrder}
                      onOpenChat={onOpenChat}
                      onOpenReportForm={onOpenReportForm}
                      onClearOrder={onClearOrder}
                      onArchiveOrder={onArchiveOrder}
                      calculateUserPaymentAmount={calculateUserPaymentAmount}
                      onSendVoiceMessage={onSendVoiceMessage}
                      latestVoiceMessage={latestVoiceMessages[order.id]}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredOrders.length}
                    onPageChange={onPageChange}
                  />
                )}
              </>
            ) : (
              <EmptyState filter={orderFilter} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components
function FilterTab({
  label,
  count,
  isActive,
  onClick,
  hideCount = false,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  hideCount?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-2 sm:px-4 py-2 ${hideCount ? "" : "pr-5 sm:pr-6"} text-xs sm:text-sm font-medium transition whitespace-nowrap ${
        isActive
          ? "text-blue-400 border-b-2 border-blue-400"
          : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
      }`}
    >
      {label}
      {!hideCount && (
        <span
          className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs flex items-center justify-center font-semibold ${
            isActive
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-slate-300"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-9 sm:min-h-10"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                onClick={() => onPageChange(page)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-8 sm:min-h-10 min-w-8 sm:min-w-10 ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-1.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-9 sm:min-h-10"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
        {(currentPage - 1) * itemsPerPage + 1}-
        {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}
      </span>
    </div>
  );
}

function EmptyState({ filter }: { filter: OrderFilterType }) {
  const messages = {
    active: "Идэвхтэй захиалга байхгүй",
    completed: "Амжилттай захиалга байхгүй",
    cancelled: "Цуцлагдсан захиалга байхгүй",
    archived: "Архивласан захиалга байхгүй",
  };

  return (
    <div className="text-center py-8 bg-gray-100 dark:bg-slate-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
      <svg
        className="w-10 h-10 text-slate-500 mx-auto mb-2"
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
      <p className="text-slate-400 font-medium">{messages[filter]}</p>
    </div>
  );
}
