/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { BundleOrder } from "@/lib/api";

interface BundleOrderDetailModalProps {
  bundleOrder: BundleOrder;
  onClose: () => void;
  exchangeRate?: number;
  onConfirmPayment?: (bundleOrderId: string) => Promise<void>;
  onCancelOrder?: (bundleOrderId: string) => Promise<void>;
  onRemoveItem?: (bundleOrderId: string, itemId: string) => Promise<void>;
  onOpenChat?: (bundleOrder: BundleOrder) => void;
  paymentLoading?: boolean;
  cancelLoading?: boolean;
  removeItemLoading?: string | null;
  adminSettings?: {
    accountNumber?: string;
    accountName?: string;
    bank?: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "niitlegdsen":
      return "bg-gray-100 text-gray-800";
    case "agent_sudlaj_bn":
      return "bg-yellow-100 text-yellow-800";
    case "tolbor_huleej_bn":
      return "bg-blue-100 text-blue-800";
    case "amjilttai_zahialga":
      return "bg-green-100 text-green-800";
    case "tsutsalsan_zahialga":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "niitlegdsen":
      return "Нийтэлсэн";
    case "agent_sudlaj_bn":
      return "Agent шалгаж байна";
    case "tolbor_huleej_bn":
      return "Төлбөр хүлээж байна";
    case "amjilttai_zahialga":
      return "Амжилттай захиалга";
    case "tsutsalsan_zahialga":
      return "Цуцлагдсан захиалга";
    default:
      return status;
  }
};

export default function BundleOrderDetailModal({
  bundleOrder,
  onClose,
  exchangeRate = 1,
  onConfirmPayment,
  onCancelOrder,
  onRemoveItem,
  onOpenChat,
  paymentLoading = false,
  cancelLoading = false,
  removeItemLoading = null,
  adminSettings,
}: BundleOrderDetailModalProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showUserInfo, setShowUserInfo] = useState(false);

  // Calculate total with 5% markup for user
  const isSingleMode = bundleOrder.reportMode === "single" && bundleOrder.bundleReport;
  const agentTotalYuan = isSingleMode
    ? bundleOrder.bundleReport?.totalUserAmount || 0
    : bundleOrder.items.reduce((sum, item) => sum + (item.agentReport?.userAmount || 0), 0);
  const userTotalYuan = agentTotalYuan * 1.05;
  const userTotalMNT = userTotalYuan * exchangeRate;

  // Check status
  const hasReport = bundleOrder.status === "tolbor_huleej_bn" || bundleOrder.status === "amjilttai_zahialga";
  const canCancel =
    bundleOrder.status === "niitlegdsen" ||
    bundleOrder.status === "tsutsalsan_zahialga" ||
    bundleOrder.status === "tolbor_huleej_bn";
  const canRemoveItems = bundleOrder.status === "tolbor_huleej_bn" && !bundleOrder.userPaymentVerified && bundleOrder.items.length > 1;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Багц захиалгын дэлгэрэнгүй
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-10 min-w-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Order ID */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Захиалгын ID</label>
              <p className="text-lg font-mono text-gray-900 dark:text-white mt-1">
                #{bundleOrder.id.slice(-4).toUpperCase()}
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Статус</label>
              <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bundleOrder.status)}`}>
                  {getStatusText(bundleOrder.status)}
                </span>
              </div>
            </div>

            {/* Track Code - Show for successful orders */}
            {bundleOrder.status === "amjilttai_zahialga" && bundleOrder.trackCode && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Track Code</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bundleOrder.trackCode || "");
                      alert("Track code хуулагдлаа!");
                    }}
                    className="p-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors flex items-center gap-1 min-h-[10]"
                    title="Хуулах"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium">Хуулах</span>
                  </button>
                </div>
                <p
                  className="text-base font-mono text-blue-500 dark:text-blue-400 font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(bundleOrder.trackCode || "");
                    alert("Track code хуулагдлаа!");
                  }}
                  title="Хуулах"
                >
                  {bundleOrder.trackCode}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Таны захиалгын track code. Энэ кодыг ашиглан захиалгаа хянах боломжтой.
                </p>
              </div>
            )}

            {/* User Info Section - Collapsible */}
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
              <button
                onClick={() => setShowUserInfo(!showUserInfo)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Миний захиалга ({bundleOrder.items.length} бараа)
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${showUserInfo ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserInfo && (
                <div className="mt-4 space-y-4">
                  {bundleOrder.items.map((item, idx) => (
                    <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{idx + 1}</span>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.productName}</h4>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{item.description}</p>

                      {/* Images */}
                      {item.imageUrls && item.imageUrls.length > 0 && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {item.imageUrls.map((imgUrl, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={imgUrl}
                              alt={`${item.productName} - ${imgIdx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setZoomedImage(imgUrl)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agent Report Section */}
            {hasReport && agentTotalYuan > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agent-ийн тайлан</h3>

                {/* Single Mode Report */}
                {isSingleMode && bundleOrder.bundleReport && (
                  <div className="space-y-3">
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Таны төлөх дүн:</span>
                      <div className="mt-2">
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {userTotalMNT.toLocaleString()}₮
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ({userTotalYuan.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮)
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Агент үнэ: {agentTotalYuan.toLocaleString()}¥ + 5% = {userTotalYuan.toLocaleString()}¥
                        </p>
                      </div>
                    </div>

                    {bundleOrder.bundleReport.paymentLink && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Төлбөрийн мэдээлэл:</label>
                        {bundleOrder.bundleReport.paymentLink.startsWith("http") ? (
                          <a href={bundleOrder.bundleReport.paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline block mt-1">
                            {bundleOrder.bundleReport.paymentLink}
                          </a>
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{bundleOrder.bundleReport.paymentLink}</p>
                        )}
                      </div>
                    )}

                    {bundleOrder.bundleReport.additionalDescription && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Нэмэлт тайлбар:</label>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{bundleOrder.bundleReport.additionalDescription}</p>
                      </div>
                    )}

                    {bundleOrder.bundleReport.additionalImages && bundleOrder.bundleReport.additionalImages.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Нэмэлт зураг:</label>
                        <div className="grid grid-cols-3 gap-3">
                          {bundleOrder.bundleReport.additionalImages.map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={`Additional ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80"
                              onClick={() => setZoomedImage(imgUrl)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Per-item Reports */}
                {!isSingleMode && bundleOrder.items.some(item => item.agentReport) && (
                  <div className="space-y-3">
                    {bundleOrder.items.map((item, idx) => {
                      if (!item.agentReport) return null;
                      const itemUserYuan = item.agentReport.userAmount * 1.05;
                      const itemUserMNT = itemUserYuan * exchangeRate;
                      return (
                        <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{idx + 1}</span>
                              <span className="font-medium text-gray-900 dark:text-white">{item.productName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600 dark:text-green-400">{itemUserMNT.toLocaleString()}₮</span>
                              {/* Remove Item Button */}
                              {canRemoveItems && onRemoveItem && (
                                <button
                                  onClick={() => {
                                    if (confirm(`"${item.productName}" барааг хасахдаа итгэлтэй байна уу? Энэ бараанд зарцуулсан карт буцаагдахгүй.`)) {
                                      onRemoveItem(bundleOrder.id, item.id);
                                    }
                                  }}
                                  disabled={removeItemLoading === item.id}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                  title="Бараа хасах"
                                >
                                  {removeItemLoading === item.id ? (
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          {item.agentReport.quantity && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">Тоо: {item.agentReport.quantity}</p>
                          )}
                          {item.agentReport.additionalDescription && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.agentReport.additionalDescription}</p>
                          )}
                          {item.agentReport.paymentLink && (
                            <a href={item.agentReport.paymentLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                              Төлбөрийн линк
                            </a>
                          )}
                          {item.agentReport.additionalImages && item.agentReport.additionalImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {item.agentReport.additionalImages.map((imgUrl, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={imgUrl}
                                  alt={`Report ${imgIdx + 1}`}
                                  className="w-full h-16 object-cover rounded border border-gray-200 dark:border-gray-600 cursor-pointer"
                                  onClick={() => setZoomedImage(imgUrl)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Total for per-item mode */}
                    <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Нийт төлөх дүн:</span>
                      <div className="mt-2">
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          {userTotalMNT.toLocaleString()}₮
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ({userTotalYuan.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮)
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Агент үнэ: {agentTotalYuan.toLocaleString()}¥ + 5% = {userTotalYuan.toLocaleString()}¥
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons for orders waiting for payment */}
            {bundleOrder.status === "tolbor_huleej_bn" && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Payment Info */}
                {adminSettings ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Дансны дугаар:</label>
                      <p className="text-gray-900 dark:text-white font-mono">{adminSettings.accountNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Дансны нэр:</label>
                      <p className="text-gray-900 dark:text-white">{adminSettings.accountName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Банк:</label>
                      <p className="text-gray-900 dark:text-white">{adminSettings.bank}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">Дансны мэдээлэл олдсонгүй</p>
                  </div>
                )}

                {/* If payment is verified, show waiting message */}
                {bundleOrder.userPaymentVerified && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                      Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ. Admin баталгаажуулахад хүлээнэ үү.
                    </p>
                  </div>
                )}

                {/* Payment and Cancel Buttons - Only show if payment not verified */}
                {!bundleOrder.userPaymentVerified && onConfirmPayment && (
                  <>
                    <button
                      onClick={() => onConfirmPayment(bundleOrder.id)}
                      disabled={paymentLoading}
                      className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Баталгаажуулж байна...
                        </>
                      ) : (
                        "Төлбөр төлсөн"
                      )}
                    </button>

                    {/* Chat with Agent Button */}
                    {onOpenChat && (
                      <button
                        onClick={() => onOpenChat(bundleOrder)}
                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium min-h-[44px] flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Агенттай чатлах
                      </button>
                    )}

                    {onCancelOrder && (
                      <button
                        onClick={() => {
                          if (confirm("Захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
                            onCancelOrder(bundleOrder.id);
                          }
                        }}
                        disabled={cancelLoading}
                        className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {cancelLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Цуцлаж байна...
                          </>
                        ) : (
                          "Цуцлах"
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Үүсгэсэн огноо</label>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {new Date(bundleOrder.createdAt).toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Шинэчлэгдсэн огноо</label>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {new Date(bundleOrder.updatedAt).toLocaleDateString("mn-MN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Cancel Button - For cancellable orders not in tolbor_huleej_bn */}
            {canCancel && bundleOrder.status !== "tolbor_huleej_bn" && onCancelOrder && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    if (confirm("Захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
                      onCancelOrder(bundleOrder.id);
                    }
                  }}
                  disabled={cancelLoading}
                  className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[44px] disabled:opacity-50"
                >
                  Захиалга цуцлах / Устгах
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImage(null);
            }}
          />
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
