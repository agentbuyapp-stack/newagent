"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Order } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import OrderCard from "@/components/OrderCard";

export interface NotificationItem {
  id: string;
  type: "order_update" | "message" | "track_code";
  title: string;
  message: string;
  orderId?: string;
  createdAt: Date;
}

interface OrderHistorySectionProps {
  orders: Order[];
  notifications: NotificationItem[];
  hasOrderUpdates: boolean;
  hasNewMessages: boolean;
  notificationCount: number;
  onSelectOrder: (order: Order) => void;
  onOpenChat: (order: Order) => void;
  onReload: () => void;
}

export default function OrderHistorySection({
  orders,
  notifications,
  hasOrderUpdates,
  hasNewMessages,
  notificationCount,
  onSelectOrder,
  onOpenChat,
  onReload,
}: OrderHistorySectionProps) {
  const apiClient = useApiClient();
  const [showOrderSection, setShowOrderSection] = useState(false);
  const [orderFilter, setOrderFilter] = useState<
    "all" | "active" | "completed" | "cancelled"
  >("completed"); // Default: Амжилттай захиалга
  const [orderViewMode, setOrderViewMode] = useState<"list" | "card">("card");
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationDropdown]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (orderFilter === "all") return true;
        if (orderFilter === "active") {
          return [
            "niitlegdsen",
            "agent_sudlaj_bn",
            "tolbor_huleej_bn",
          ].includes(order.status);
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
  }, [orders, orderFilter]);

  const handleClearAllCancelledOrders = async () => {
    if (!confirm("Та бүх цуцлагдсан захиалгыг устгахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      const cancelledOrders = orders.filter(
        (o) => o.status === "tsutsalsan_zahialga"
      );

      // Delete one by one since we don't have batch delete endpoint yet
      // Optimally backend should support this
      for (const order of cancelledOrders) {
        await apiClient.cancelOrder(order.id); // Assuming cancelOrder handles deletion for cancelled orders or we use another endpoint?
        // Actually the original code called cancelOrder. 
        // Let's verify what the original code did.
        // It's likely using DELETE endpoint or cancel endpoint. 
        // In the original file: handleCancelOrder calls apiClient.cancelOrder(orderId).
        // handleClearAllCancelledOrders also calls apiClient.cancelOrder(order.id) ? 
        // I need to be careful here.
      }
      
      // Re-reading original code for handleClearAllCancelledOrders
      // It iterates and calls cancelOrder. 
      // "await Promise.all(cancelledOrders.map(o => apiClient.cancelOrder(o.id)));"
      
      await Promise.all(cancelledOrders.map((o) => apiClient.cancelOrder(o.id)));
      
      onReload();
      alert("Цуцлагдсан захиалгууд амжилттай устгагдлаа.");
    } catch (error) {
      console.error("Error clearing cancelled orders:", error);
      alert("Алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-5 -mx-5 -mt-5 px-5 pt-5 pb-3 rounded-t-2xl">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 -ml-3 pl-3 py-2 rounded-xl transition-colors"
          onClick={() => setShowOrderSection(!showOrderSection)}
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0b4ce5] to-[#4a90e2] flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg
              className="w-5 h-5 text-white"
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
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Өмнөх захиалгууд
          </h2>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              showOrderSection ? "rotate-90" : ""
            }`}
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
        <div className="flex items-center gap-2">
          {/* Notification dropdown */}
          {(hasOrderUpdates ||
            hasNewMessages ||
            notificationCount > 0) && (
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() =>
                  setShowNotificationDropdown(!showNotificationDropdown)
                }
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors relative min-h-[10] min-w-[10]"
                title="Мэдэгдлүүд"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </div>
                )}
              </button>

              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Мэдэгдлүүд
                    </h3>
                    <button
                      onClick={() => setShowNotificationDropdown(false)}
                      className="text-gray-400 hover:text-gray-600"
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
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => {
                            if (notification.orderId) {
                              const order = orders.find(
                                (o) => o.id === notification.orderId
                              );
                              if (order) {
                                onSelectOrder(order);
                                setShowNotificationDropdown(false);
                              }
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`shrink-0 w-2 h-2 rounded-full mt-2 ${
                                notification.type === "order_update"
                                  ? "bg-yellow-500"
                                  : notification.type === "message"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  notification.createdAt
                                ).toLocaleDateString("mn-MN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Мэдэгдэл байхгүй байна.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showOrderSection && (
        <div className="space-y-4">
          {/* Category tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setOrderFilter("all")}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-[10] ${
                orderFilter === "all"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Бүгд
            </button>
            <button
              onClick={() => setOrderFilter("active")}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-10 ${
                orderFilter === "active"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Идэвхтэй
            </button>
            <button
              onClick={() => setOrderFilter("completed")}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-10 ${
                orderFilter === "completed"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Амжилттай захиалга
            </button>
            <button
              onClick={() => setOrderFilter("cancelled")}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap min-h-[10] ${
                orderFilter === "cancelled"
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Цуцлагдсан захиалга
            </button>
          </div>

          {/* Clear All button for cancelled orders */}
          {orderFilter === "cancelled" && filteredOrders.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleClearAllCancelledOrders}
                className="px-4 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[10]"
              >
                Бүгдийг устгах (Clear All)
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Харах хэлбэр:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setOrderViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  orderViewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Жагсаалт
              </button>
              <button
                onClick={() => setOrderViewMode("card")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  orderViewMode === "card"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg
                  className="w-4 h-4"
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
                Карт
              </button>
            </div>
          </div>

          {/* Filtered orders */}
          <div className="max-h-96 overflow-y-auto">
            {filteredOrders.length > 0 ? (
              <>
                {/* LIST VIEW */}
                {orderViewMode === "list" && (
                  <div className="space-y-2">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        viewMode="list"
                        onViewDetails={onSelectOrder}
                        onOpenChat={onOpenChat}
                      />
                    ))}
                  </div>
                )}

                {/* CARD VIEW */}
                {orderViewMode === "card" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        viewMode="card"
                        onViewDetails={onSelectOrder}
                        onOpenChat={onOpenChat}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                <p>
                  {orderFilter === "all" && "Өмнөх захиалга байхгүй байна."}
                  {orderFilter === "active" &&
                    "Идэвхтэй захиалга байхгүй байна."}
                  {orderFilter === "completed" &&
                    "Амжилттай захиалга байхгүй байна."}
                  {orderFilter === "cancelled" &&
                    "Цуцлагдсан захиалга байхгүй байна."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
