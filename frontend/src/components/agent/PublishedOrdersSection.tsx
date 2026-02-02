"use client";

import { useState } from "react";
import Image from "next/image";
import type { Order } from "@/lib/api";

interface PublishedOrdersSectionProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onTakeOrder: (orderId: string) => void;
}

export function PublishedOrdersSection({
  orders,
  onViewOrder,
  onTakeOrder,
}: PublishedOrdersSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-shadow relative z-10">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Нээлттэй захиалгууд
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Авах боломжтой захиалгууд ({orders.length})
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
        <div className="mt-4">
          <div className="space-y-3 sm:space-y-4">
            {orders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orders.map((order) => {
                  const mainImage =
                    order.imageUrls && order.imageUrls.length > 0
                      ? order.imageUrls[0]
                      : order.imageUrl || null;

                  const userSnapshot = (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot;

                  return (
                    <div
                      key={order.id}
                      className="bg-linear-to-br from-slate-700 to-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 hover:border-indigo-500 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 p-3"
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 shrink-0 bg-gray-200 dark:bg-slate-600 rounded-lg overflow-hidden relative">
                          {mainImage ? (
                            <Image
                              src={mainImage}
                              alt={order.productName}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-gray-500 dark:text-slate-400"
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
                          {/* New badge */}
                          <span className="absolute -top-1 -left-1 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                            Шинэ
                          </span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          {/* Top: Status & Date */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            {(order.user?.profile || userSnapshot) && (
                              <span className="text-xs font-medium text-blue-400 truncate">
                                {order.user?.profile?.name || userSnapshot?.name || "Нэргүй"}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          {/* Product name */}
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                            {order.productName}
                          </h4>

                          {/* User cargo */}
                          {(order.user?.profile?.cargo || userSnapshot?.cargo) && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Карго:{" "}
                              <span className="font-medium text-blue-400">
                                {order.user?.profile?.cargo || userSnapshot?.cargo}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Buttons - Bottom */}
                      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-200 dark:border-slate-600">
                        <button
                          onClick={() => onViewOrder(order)}
                          className="h-7 px-2.5 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Харах
                        </button>
                        <button
                          onClick={() => onTakeOrder(order.id)}
                          className="flex-1 h-7 px-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <svg
                            className="w-3.5 h-3.5"
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
                          Авах
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-100 dark:bg-slate-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
                <svg
                  className="w-12 h-12 text-slate-500 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-gray-600 dark:text-slate-300 font-medium">
                  Нээлттэй захиалга байхгүй байна
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Шинэ захиалга ирэхэд энд харагдана
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
