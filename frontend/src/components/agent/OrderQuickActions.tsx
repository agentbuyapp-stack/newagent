"use client";

import type { OrderStatus, Order } from "@/lib/api";

interface OrderQuickActionsProps {
  status: OrderStatus;
  orderId: string;
  hasAgentReport: boolean;
  isBundleOrder: boolean;
  onTakeOrder: (orderId: string, status: OrderStatus) => void;
  onOpenReportForm: (order: Order, isBundleOrder: boolean) => void;
  order: Order;
}

export default function OrderQuickActions({
  status,
  orderId,
  hasAgentReport,
  isBundleOrder,
  onTakeOrder,
  onOpenReportForm,
  order,
}: OrderQuickActionsProps) {
  if (status === "niitlegdsen") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">Шинэ захиалга</p>
            <p className="text-sm text-amber-600">
              Энэ захиалгыг авч, судалж эхлэх үү?
            </p>
          </div>
          <button
            onClick={() => onTakeOrder(orderId, "agent_sudlaj_bn")}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
          >
            Авах
          </button>
        </div>
      </div>
    );
  }

  if (status === "agent_sudlaj_bn" && !hasAgentReport) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-indigo-600"
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
          </div>
          <div className="flex-1">
            <p className="font-medium text-indigo-800">
              Тайлан илгээх шаардлагатай
            </p>
            <p className="text-sm text-indigo-600">
              Барааны үнэ, зураг зэргийг хэрэглэгчид илгээнэ үү
            </p>
          </div>
          <button
            onClick={() => onOpenReportForm(order, isBundleOrder)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            Тайлан илгээх
          </button>
        </div>
      </div>
    );
  }

  return null;
}
