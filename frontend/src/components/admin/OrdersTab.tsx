"use client";

import type { Order, AdminSettings, AgentReport } from "@/lib/api";

type OrderFilterType = "pending_payment" | "active" | "completed" | "cancelled";

interface OrdersTabProps {
  orders: Order[];
  adminSettings: AdminSettings | null;
  agentReports: Record<string, AgentReport | null>;
  orderFilter: OrderFilterType;
  onOrderFilterChange: (filter: OrderFilterType) => void;
  onVerifyPayment: (orderId: string) => Promise<void>;
  onCancelPayment: (orderId: string, isBundleOrder?: boolean) => Promise<void>;
  onAgentPayment: (orderId: string) => Promise<void>;
}

export function OrdersTab({
  orders,
  adminSettings,
  agentReports,
  orderFilter,
  onOrderFilterChange,
  onVerifyPayment,
  onCancelPayment,
  onAgentPayment,
}: OrdersTabProps) {
  const filteredOrders = orders
    .filter((order) => {
      if (orderFilter === "pending_payment") {
        return order.status === "tolbor_huleej_bn";
      }
      if (orderFilter === "completed") {
        return order.status === "amjilttai_zahialga";
      }
      if (orderFilter === "cancelled") {
        return order.status === "tsutsalsan_zahialga";
      }
      return false;
    })
    .sort((a, b) => {
      if (a.userPaymentVerified && !b.userPaymentVerified) return -1;
      if (!a.userPaymentVerified && b.userPaymentVerified) return 1;
      return 0;
    });

  const calculateUserAmount = (report: AgentReport | null) => {
    if (!report) return null;
    const exchangeRate = adminSettings?.exchangeRate || 1;
    return report.userAmount * exchangeRate * 1.05;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          Захиалгууд
        </h3>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => onOrderFilterChange("pending_payment")}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-10 whitespace-nowrap ${
            orderFilter === "pending_payment"
              ? "text-orange-600 bg-orange-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Төлбөр хүлээж байна (
          {orders.filter((o) => o.status === "tolbor_huleej_bn").length})
        </button>
        <button
          onClick={() => onOrderFilterChange("completed")}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-10 whitespace-nowrap ${
            orderFilter === "completed"
              ? "text-green-600 bg-green-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Дууссан (
          {orders.filter((o) => o.status === "amjilttai_zahialga").length})
        </button>
        <button
          onClick={() => onOrderFilterChange("cancelled")}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-10 whitespace-nowrap ${
            orderFilter === "cancelled"
              ? "text-red-600 bg-red-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Цуцалсан (
          {orders.filter((o) => o.status === "tsutsalsan_zahialga").length})
        </button>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const report = agentReports[order.id];
            const userProfile = order.user?.profile;
            const agentProfile = order.agent?.profile;
            const userAmount = calculateUserAmount(report);

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors"
              >
                {/* Top row: Product name, Amount, Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {order.productName}
                    </h4>
                    {report && (
                      <p className="text-lg sm:text-xl font-bold text-green-600 mt-1">
                        {userAmount?.toLocaleString()} ₮
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        order.status === "niitlegdsen"
                          ? "bg-gray-100 text-gray-800"
                          : order.status === "agent_sudlaj_bn"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "tolbor_huleej_bn"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "amjilttai_zahialga"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status === "niitlegdsen"
                        ? "Нийтэлсэн"
                        : order.status === "agent_sudlaj_bn"
                          ? "Шалгаж байна"
                          : order.status === "tolbor_huleej_bn"
                            ? "Төлбөр хүлээж"
                            : order.status === "amjilttai_zahialga"
                              ? "Амжилттай"
                              : "Цуцлагдсан"}
                    </span>
                    {order.status === "tolbor_huleej_bn" && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${order.userPaymentVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                      >
                        {order.userPaymentVerified ? "Төлсөн" : "Хүлээж байна"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info row: Phone numbers and payment link */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mb-3">
                  {userProfile?.phone && (
                    <span>
                      User:{" "}
                      <span className="font-medium text-gray-900">
                        {userProfile.phone}
                      </span>
                    </span>
                  )}
                  {agentProfile?.phone && (
                    <span>
                      Agent:{" "}
                      <span className="font-medium text-gray-900">
                        {agentProfile.phone}
                      </span>
                    </span>
                  )}
                  {report?.paymentLink && (
                    <a
                      href={report.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-37.5 sm:max-w-50"
                    >
                      Холбоос
                    </a>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-row sm:flex-row gap-2">
                  {order.status === "tolbor_huleej_bn" && (
                    <button
                      onClick={() => onVerifyPayment(order.id)}
                      className="px-3 py-2 text-xs sm:text-sm text-white bg-green-500 rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors font-medium text-center"
                    >
                      Төлбөр батлах
                    </button>
                  )}
                  {order.status === "tolbor_huleej_bn" && (
                    <button
                      onClick={() => onCancelPayment(order.id, false)}
                      className="px-3 py-2 text-xs sm:text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors font-medium text-center"
                    >
                      Төлбөр цуцлах
                    </button>
                  )}
                  {order.status === "amjilttai_zahialga" &&
                    !order.agentPaymentPaid &&
                    order.agent && (
                      <button
                        onClick={() => onAgentPayment(order.id)}
                        className="px-3 py-2 text-xs sm:text-sm text-white bg-purple-500 rounded-lg hover:bg-purple-600 active:bg-purple-700 transition-colors font-medium text-center"
                      >
                        Урамшуулал олгох
                      </button>
                    )}
                  {order.status === "amjilttai_zahialga" &&
                    order.agentPaymentPaid && (
                      <span className="px-3 py-2 text-xs sm:text-sm text-purple-700 bg-purple-100 rounded-lg font-medium text-center">
                        Урамшуулал олгосон
                      </span>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
          {orderFilter === "pending_payment"
            ? "Төлбөр хүлээж байгаа захиалга байхгүй байна."
            : orderFilter === "completed"
              ? "Дууссан захиалга байхгүй байна."
              : "Цуцалсан захиалга байхгүй байна."}
        </div>
      )}
    </div>
  );
}

export type { OrderFilterType };
