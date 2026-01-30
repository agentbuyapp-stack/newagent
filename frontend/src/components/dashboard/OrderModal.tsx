/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Order, AgentReport, AdminSettings } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

interface OrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (orderId: string) => void;
  onPaymentPaid: (orderId: string) => void;
  adminSettings: AdminSettings | null;
}

export default function OrderModal({
  order,
  isOpen,
  onClose,
  onCancel,
  onPaymentPaid,
  adminSettings,
}: OrderModalProps) {
  const apiClient = useApiClient();
  const [report, setReport] = useState<AgentReport | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingReport, setLoadingReport] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [showUserInfoInModal, setShowUserInfoInModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [paymentInfo, setPaymentInfo] = useState<{
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    exchangeRate?: number;
  } | null>(null);

  // Load agent report
  useEffect(() => {
    const loadReport = async () => {
      if (
        order.status === "agent_sudlaj_bn" ||
        order.status === "tolbor_huleej_bn" ||
        order.status === "amjilttai_zahialga"
      ) {
        setLoadingReport(true);
        try {
          const fetchedReport = await apiClient.getAgentReport(order.id);
          setReport(fetchedReport);
        } catch (err) {
          console.error("Failed to load agent report:", err);
          setReport(null);
        } finally {
          setLoadingReport(false);
        }
      } else {
        setReport(null);
      }
    };

    if (isOpen && order) {
      loadReport();
    }
  }, [isOpen, order, apiClient]);

  // Set payment info from adminSettings or fetch ?
  // Actually, just use adminSettings as default.
  // The original code had a separate payment info per order?
  // "paymentInfo[selectedOrder.id]?.accountNumber"
  // But line 421 in page.tsx showed it just copies from adminSettings.
  // So we can just use adminSettings.
  
  const calculateUserPaymentAmount = useCallback(
    (agentReport: AgentReport | null, exchangeRate: number = 1): number => {
      if (!agentReport) return 0;
      return agentReport.userAmount * exchangeRate * 1.05;
    },
    []
  );

  if (!isOpen) return null;

  const canCancel =
    order.status === "niitlegdsen" ||
    order.status === "tsutsalsan_zahialga" ||
    order.status === "tolbor_huleej_bn";

  const hasAgentReport = report !== null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Захиалгын дэлгэрэнгүй
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-10 min-w-10"
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

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order ID */}
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Захиалгын ID
            </label>
            <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">
              #{order.id.slice(-4).toUpperCase()}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Статус
            </label>
            <div className="mt-1">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                    ? "Agent шалгаж байна"
                    : order.status === "tolbor_huleej_bn"
                      ? "Төлбөр хүлээж байна"
                      : order.status === "amjilttai_zahialga"
                        ? "Амжилттай захиалга"
                        : "Цуцлагдсан захиалга"}
              </span>
            </div>
          </div>

          {/* User Info Section - Collapsible */}
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
            <button
              onClick={() => setShowUserInfoInModal(!showUserInfoInModal)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Хэрэглэгчийн мэдээлэл
              </h3>
              <svg
                className={`w-5 h-5 transition-transform ${showUserInfoInModal ? "rotate-180" : ""}`}
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
            </button>

            {showUserInfoInModal && (
              <div className="mt-4 space-y-4">
                {/* Images */}
                {order.imageUrls &&
                  order.imageUrls.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                        Зургууд
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {order.imageUrls.map(
                          (imgUrl, index) => (
                            <img
                              key={index}
                              src={imgUrl}
                              alt={`${order.productName} - ${index + 1}`}
                              className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() =>
                                setZoomedImageIndex(
                                  zoomedImageIndex === index
                                    ? null
                                    : index,
                                )
                              }
                            />
                          ),
                        )}
                      </div>
                      {zoomedImageIndex !== null && (
                        <div
                          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4"
                          onClick={() => setZoomedImageIndex(null)}
                        >
                          <img
                            src={
                              order.imageUrls[zoomedImageIndex]
                            }
                            alt={`${order.productName} - ${zoomedImageIndex + 1}`}
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImageIndex(null);
                            }}
                          />
                          <button
                            onClick={() => setZoomedImageIndex(null)}
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition"
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
                      )}
                    </div>
                  )}

                {/* Product Name */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Барааны нэр
                  </label>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                    {order.productName}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Тайлбар
                  </label>
                  {order.description &&
                  order.description.includes(":") &&
                  order.description.split("\n\n").length > 1 ? (
                    <div className="mt-2 space-y-2">
                      {order.description
                        .split("\n\n")
                        .map((productDesc, idx) => {
                          const [productName, ...descParts] =
                            productDesc.split(": ");
                          const productDescription =
                            descParts.join(": ");
                          return (
                            <div
                              key={idx}
                              className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3"
                            >
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {productName}
                              </p>
                              {productDescription && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                  {productDescription}
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                      {order.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Show Agent Report if exists */}
          {hasAgentReport && report && (
            <>
              {/* Agent Report Section */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Agent-ийн тайлан
                </h3>

                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Таны төлөх дүн:</span>
                  {(() => {
                    const exchangeRate = adminSettings?.exchangeRate || 1;
                    const agentYuan = report.userAmount;
                    const userYuan = agentYuan * 1.05;
                    const userMNT = userYuan * exchangeRate;
                    return (
                      <div className="mt-2">
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {userMNT.toLocaleString()}₮
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ({userYuan.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮)
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Агент үнэ: {agentYuan.toLocaleString()}¥ + 5% = {userYuan.toLocaleString()}¥
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {report.quantity && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Тоо ширхэг:
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {report.quantity}
                    </p>
                  </div>
                )}

                {report.additionalDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Нэмэлт тайлбар:
                    </label>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                      {report.additionalDescription}
                    </p>
                  </div>
                )}

                {report.additionalImages &&
                  report.additionalImages.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                        Нэмэлт зураг:
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {report.additionalImages.map(
                          (imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={`Additional ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-600"
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Action Buttons for orders with agent report */}
              {order.status === "tolbor_huleej_bn" && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Payment Info */}
                  {adminSettings ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-2">
                       <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Дансны дугаар:
                        </label>
                        <p className="text-gray-900 dark:text-white font-mono">
                          {adminSettings.accountNumber}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Дансны нэр:
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {adminSettings.accountName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Банк:
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {adminSettings.bank}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                        Дансны мэдээлэл олдсонгүй
                      </p>
                    </div>
                  )}

                  {/* If payment is verified, show waiting message */}
                  {order.userPaymentVerified && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                        Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ. Admin
                        баталгаажуулахад хүлээнэ үү.
                      </p>
                    </div>
                  )}

                  {/* Payment and Cancel Buttons - Only show if payment not verified */}
                  {!order.userPaymentVerified && (
                    <>
                      <button
                        onClick={() => onPaymentPaid(order.id)}
                        className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-[11]"
                      >
                        Төлбөр төлсөн
                      </button>

                      <button
                        onClick={() => onCancel(order.id)}
                        className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[11]"
                      >
                        Цуцлах
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Track Code - Show for successful orders */}
          {order.status === "amjilttai_zahialga" &&
            order.trackCode && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Track Code
                    </label>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          order.trackCode || "",
                        );
                        alert("Track code хуулагдлаа!");
                      }}
                      className="p-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors flex items-center gap-1 min-h-[10]"
                      title="Хуулах"
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs font-medium">
                        Хуулах
                      </span>
                    </button>
                  </div>
                  <p
                    className="text-base font-mono text-blue-500 dark:text-blue-400 font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        order.trackCode || "",
                      );
                      alert("Track code хуулагдлаа!");
                    }}
                    title="Хуулах"
                  >
                    {order.trackCode}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Таны захиалгын track code. Энэ кодыг ашиглан
                    захиалгаа хянах боломжтой.
                  </p>
                </div>
              </div>
            )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Үүсгэсэн огноо
              </label>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {new Date(order.createdAt).toLocaleDateString(
                  "mn-MN",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Шинэчлэгдсэн огноо
              </label>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                {new Date(order.updatedAt).toLocaleDateString(
                  "mn-MN",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            </div>
          </div>

          {/* Cancel Button - Only for cancellable orders */}
          {canCancel && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => onCancel(order.id)}
                className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[11]"
              >
                Захиалга цуцлах / Устгах
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
