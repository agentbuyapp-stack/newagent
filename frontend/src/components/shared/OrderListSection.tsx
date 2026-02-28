"use client";

import { useState, useMemo } from "react";
import type { Order, AgentReport } from "@/lib/api";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  niitlegdsen:         { label: "Шинэ",          color: "bg-gray-100 text-gray-600" },
  agent_sudlaj_bn:     { label: "Судалж байна",  color: "bg-yellow-50 text-yellow-700" },
  tolbor_huleej_bn:    { label: "Төлбөр хүлээж", color: "bg-blue-50 text-blue-700" },
  amjilttai_zahialga:  { label: "Амжилттай",     color: "bg-green-50 text-green-700" },
  tsutsalsan_zahialga: { label: "Цуцлагдсан",    color: "bg-red-50 text-red-600" },
};

interface FilterTab {
  key: string;
  label: string;
  count: number;
}

interface OrderListSectionProps {
  orders: Order[];
  archivedOrders?: Order[];
  onOrderClick: (order: Order) => void;
  filterTabs: FilterTab[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
  title: string;
  totalCount: number;
  showUserName?: boolean;
  onLoadArchive?: () => Promise<void>;
  archiveLoading?: boolean;
  archiveCount?: number;
  emptyText?: string;
  emptySubtext?: string;
  agentReports?: Record<string, AgentReport | null>;
  exchangeRate?: number;
}

const ITEMS_PER_PAGE = 10;

export default function OrderListSection({
  orders,
  archivedOrders,
  onOrderClick,
  filterTabs,
  activeFilter,
  onFilterChange,
  title,
  totalCount,
  showUserName,
  onLoadArchive,
  archiveLoading,
  archiveCount = 0,
  emptyText = "Захиалга байхгүй",
  emptySubtext,
  agentReports,
  exchangeRate,
}: OrderListSectionProps) {
  const [page, setPage] = useState(1);

  const displayOrders = activeFilter === "archived" ? (archivedOrders || []) : orders;
  const sortedOrders = useMemo(
    () => [...displayOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [displayOrders]
  );
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(
    () => sortedOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [sortedOrders, page]
  );

  const handleFilterChange = (key: string) => {
    setPage(1);
    onFilterChange(key);
    if (key === "archived" && onLoadArchive) {
      onLoadArchive();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-3">
        <h3 className="text-[11px] sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {title} <span className="text-gray-300 font-normal">({totalCount})</span>
        </h3>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 sm:gap-2 mb-3 overflow-x-auto scrollbar-hide pb-0.5">
        {filterTabs.map((tab) => (
          <button key={tab.key} onClick={() => handleFilterChange(tab.key)}
            className={`text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}>
            {tab.label}{tab.count > 0 ? ` (${tab.count})` : ""}
          </button>
        ))}
        {/* Archive tab */}
        {onLoadArchive && (
          <button onClick={() => handleFilterChange("archived")}
            className={`text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === "archived"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}>
            Архив{archiveCount > 0 ? ` (${archiveCount})` : ""}
          </button>
        )}
      </div>

      {/* Archive loading */}
      {activeFilter === "archived" && archiveLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-3 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Order list */}
      {!(activeFilter === "archived" && archiveLoading) && paginatedOrders.length > 0 ? (
        <>
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {paginatedOrders.map((order) => {
              const s = STATUS_MAP[order.status] || STATUS_MAP.niitlegdsen;
              const userSnap = (order as Order & { userSnapshot?: { name: string } }).userSnapshot;
              const userName = showUserName ? (order.user?.profile?.name || userSnap?.name) : undefined;
              // Price for tolbor_huleej_bn / amjilttai_zahialga
              const showPrice = (order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga") && exchangeRate;
              let priceAmount = 0;
              if (showPrice) {
                const ext = order as Order & { bundleReport?: { totalUserAmount: number }; bundleItems?: { agentReport?: { userAmount: number } }[]; reportMode?: string };
                const report = agentReports?.[order.id];
                let baseAmount = ext.bundleReport?.totalUserAmount || report?.userAmount || 0;
                if (!baseAmount && ext.reportMode === "per_item" && ext.bundleItems) {
                  baseAmount = ext.bundleItems.reduce((sum, i) => sum + (i.agentReport?.userAmount || 0), 0);
                }
                priceAmount = baseAmount > 0 ? Math.round(baseAmount * (exchangeRate || 1) * 1.05) : 0;
              }
              return (
                <button key={order.id} type="button" onClick={() => onOrderClick(order)}
                  className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
                  {order.imageUrls && order.imageUrls.length > 0 ? (
                    <img src={order.imageUrls[0]} alt="" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-sm font-medium text-gray-800 truncate">{order.productName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {userName && (
                        <span className="text-[10px] sm:text-[11px] text-blue-500 font-medium truncate max-w-[80px]">{userName}</span>
                      )}
                      <span className="text-[10px] sm:text-[11px] text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("mn-MN", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`text-[10px] sm:text-[11px] font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${s.color}`}>
                      {s.label}
                    </span>
                    {showPrice && priceAmount > 0 && (
                      <span className="text-[11px] sm:text-[12px] font-bold text-gray-800">
                        {priceAmount.toLocaleString()}<span className="text-[9px] text-gray-400">₮</span>
                      </span>
                    )}
                  </div>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(page - 1, 1))} disabled={page === 1}
                className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-xs text-gray-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(page + 1, totalPages))} disabled={page === totalPages}
                className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </>
      ) : !(activeFilter === "archived" && archiveLoading) ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">{emptyText}</p>
          {emptySubtext && <p className="text-xs text-gray-400 mt-1">{emptySubtext}</p>}
        </div>
      ) : null}
    </>
  );
}
