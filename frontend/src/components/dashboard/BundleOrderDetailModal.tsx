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
  onOpenChat?: (bundleOrder: BundleOrder) => void;
  paymentLoading?: boolean;
  cancelLoading?: boolean;
  adminSettings?: {
    accountNumber?: string;
    accountName?: string;
    bank?: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "niitlegdsen":
      return "bg-gray-100 text-gray-700";
    case "agent_sudlaj_bn":
      return "bg-amber-100 text-amber-700";
    case "tolbor_huleej_bn":
      return "bg-blue-100 text-blue-700";
    case "amjilttai_zahialga":
      return "bg-green-100 text-green-700";
    case "tsutsalsan_zahialga":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "niitlegdsen":
      return "Шинэ";
    case "agent_sudlaj_bn":
      return "Судлагдаж буй";
    case "tolbor_huleej_bn":
      return "Төлбөр хүлээж";
    case "amjilttai_zahialga":
      return "Амжилттай";
    case "tsutsalsan_zahialga":
      return "Цуцлагдсан";
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
  onOpenChat,
  paymentLoading = false,
  cancelLoading = false,
  adminSettings,
}: BundleOrderDetailModalProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showMyOrder, setShowMyOrder] = useState(false);
  const [showAgentReport, setShowAgentReport] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Toggle item expansion
  const toggleItem = (itemId: string) => {
    const next = new Set(expandedItems);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setExpandedItems(next);
  };

  // Calculate total with 5% markup for user
  const isSingleMode = bundleOrder.reportMode === "single" && bundleOrder.bundleReport;
  const agentTotalYuan = isSingleMode
    ? bundleOrder.bundleReport?.totalUserAmount || 0
    : bundleOrder.items.reduce((sum, item) => sum + (item.agentReport?.userAmount || 0), 0);
  const userTotalYuan = agentTotalYuan * 1.05; // 5% markup
  const userTotalMNT = userTotalYuan * exchangeRate;

  // Check status
  const hasReport = bundleOrder.status === "tolbor_huleej_bn" || bundleOrder.status === "amjilttai_zahialga";
  const isPendingPayment = bundleOrder.status === "tolbor_huleej_bn" && !bundleOrder.userPaymentVerified;
  const canCancel = bundleOrder.status === "tolbor_huleej_bn" && !bundleOrder.userPaymentVerified;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-4 sm:px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Багц захиалга</h2>
                <div className="flex items-center gap-2">
                  <span className="text-white/70 text-xs">{bundleOrder.items.length} бараа</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bundleOrder.status)}`}>
                    {getStatusText(bundleOrder.status)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-5 space-y-4">
              {/* Quick Info Bar */}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">{bundleOrder.userSnapshot.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{bundleOrder.userSnapshot.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <span>{bundleOrder.userSnapshot.cargo}</span>
                </div>
              </div>

              {/* Track Code */}
              {bundleOrder.trackCode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm text-green-700">Трак код:</span>
                  <span className="font-bold text-green-800">{bundleOrder.trackCode}</span>
                </div>
              )}

              {/* My Order Dropdown - User's original order details */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowMyOrder(!showMyOrder)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="font-semibold text-gray-800">Миний захиалга</span>
                    <span className="text-xs text-gray-500">({bundleOrder.items.length} бараа)</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${showMyOrder ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMyOrder && (
                  <div className="p-4 space-y-3 bg-white">
                    {bundleOrder.items.map((item, index) => {
                      const isExpanded = expandedItems.has(`my-${item.id}`);
                      return (
                        <div key={item.id} className="border border-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleItem(`my-${item.id}`)}
                          >
                            {item.imageUrls && item.imageUrls.length > 0 ? (
                              <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                <img src={item.imageUrls[0]} alt={item.productName} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
                                <h4 className="font-medium text-gray-900 text-sm truncate">{item.productName}</h4>
                              </div>
                              <p className="text-xs text-gray-500 truncate">{item.description}</p>
                            </div>
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-2">
                              <p className="text-sm text-gray-700">{item.description}</p>
                              {item.imageUrls && item.imageUrls.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {item.imageUrls.map((url, i) => (
                                    <div
                                      key={i}
                                      className="w-14 h-14 bg-white rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-purple-400 transition-all"
                                      onClick={() => setZoomedImage(url)}
                                    >
                                      <img src={url} alt={`${item.productName} ${i + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Agent Report Dropdown - Only show when has report */}
              {hasReport && (
                <div className="border border-green-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowAgentReport(!showAgentReport)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-semibold text-green-800">Агентын тайлан</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-green-600 transition-transform ${showAgentReport ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAgentReport && (
                    <div className="p-4 bg-white space-y-4">
                      {/* Single Mode Report */}
                      {isSingleMode && bundleOrder.bundleReport && (
                        <div className="space-y-3">
                          <div className="bg-green-50 rounded-lg p-3">
                            <span className="text-sm text-gray-600">Таны төлөх дүн:</span>
                            <div className="mt-2">
                              <p className="text-xl font-bold text-green-700">
                                {userTotalMNT.toLocaleString()}₮
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                ({userTotalYuan.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮)
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Агент үнэ: {agentTotalYuan.toLocaleString()}¥ + 5% = {userTotalYuan.toLocaleString()}¥
                              </p>
                            </div>
                          </div>
                          {bundleOrder.bundleReport.paymentLink && (
                            <div className="text-sm">
                              <span className="text-gray-500">Төлбөрийн мэдээлэл: </span>
                              {bundleOrder.bundleReport.paymentLink.startsWith("http") ? (
                                <a href={bundleOrder.bundleReport.paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {bundleOrder.bundleReport.paymentLink}
                                </a>
                              ) : (
                                <span className="text-gray-700">{bundleOrder.bundleReport.paymentLink}</span>
                              )}
                            </div>
                          )}
                          {bundleOrder.bundleReport.additionalDescription && (
                            <div className="text-sm">
                              <span className="text-gray-500">Тайлбар: </span>
                              <span className="text-gray-700">{bundleOrder.bundleReport.additionalDescription}</span>
                            </div>
                          )}
                          {bundleOrder.bundleReport.additionalImages && bundleOrder.bundleReport.additionalImages.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {bundleOrder.bundleReport.additionalImages.map((url, i) => (
                                <div
                                  key={i}
                                  className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-green-400 transition-all"
                                  onClick={() => setZoomedImage(url)}
                                >
                                  <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Per-item Reports */}
                      {!isSingleMode && bundleOrder.items.some(item => item.agentReport) && (
                        <div className="space-y-3">
                          {bundleOrder.items.map((item, index) => {
                            if (!item.agentReport) return null;
                            const isExpanded = expandedItems.has(`report-${item.id}`);
                            return (
                              <div key={item.id} className="border border-gray-100 rounded-lg overflow-hidden">
                                <div
                                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => toggleItem(`report-${item.id}`)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-400 font-mono">#{index + 1}</span>
                                      <h4 className="font-medium text-gray-900 text-sm truncate">{item.productName}</h4>
                                    </div>
                                    <p className="text-sm font-semibold text-green-600">
                                      {(item.agentReport.userAmount * 1.05 * exchangeRate).toLocaleString()}₮
                                    </p>
                                  </div>
                                  <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>

                                {isExpanded && (
                                  <div className="border-t border-gray-100 p-3 bg-gray-50 space-y-2">
                                    <div className="text-sm">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Үнэ:</span>
                                        <div className="text-right">
                                          <span className="font-semibold text-green-600">
                                            {(item.agentReport.userAmount * 1.05 * exchangeRate).toLocaleString()}₮
                                          </span>
                                          <span className="text-xs text-gray-400 ml-2">
                                            ({(item.agentReport.userAmount * 1.05).toLocaleString()}¥)
                                          </span>
                                        </div>
                                      </div>
                                      {item.agentReport.quantity && (
                                        <div className="flex justify-between items-center mt-1">
                                          <span className="text-gray-500">Тоо:</span>
                                          <span className="font-medium">{item.agentReport.quantity}</span>
                                        </div>
                                      )}
                                    </div>
                                    {item.agentReport.additionalDescription && (
                                      <p className="text-sm text-gray-600">{item.agentReport.additionalDescription}</p>
                                    )}
                                    {item.agentReport.paymentLink && (
                                      <a
                                        href={item.agentReport.paymentLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Төлбөрийн линк
                                      </a>
                                    )}
                                    {item.agentReport.additionalImages && item.agentReport.additionalImages.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {item.agentReport.additionalImages.map((url, i) => (
                                          <div
                                            key={i}
                                            className="w-12 h-12 bg-gray-100 rounded overflow-hidden cursor-pointer hover:ring-2 ring-green-400 transition-all"
                                            onClick={() => setZoomedImage(url)}
                                          >
                                            <img src={url} alt={`Report ${i + 1}`} className="w-full h-full object-cover" />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Total for per-item mode */}
                          <div className="bg-green-50 rounded-lg p-3 border-t border-green-200">
                            <span className="text-sm text-gray-600">Таны төлөх дүн:</span>
                            <div className="mt-2">
                              <p className="text-xl font-bold text-green-700">
                                {userTotalMNT.toLocaleString()}₮
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                ({userTotalYuan.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮)
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Агент үнэ: {agentTotalYuan.toLocaleString()}¥ + 5% = {userTotalYuan.toLocaleString()}¥
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Total Section - Only show if there's a price and report is collapsed */}
              {agentTotalYuan > 0 && !showAgentReport && hasReport && (
                <div className="bg-linear-to-r from-purple-50 to-indigo-50 rounded-xl p-4 flex items-center justify-between">
                  <span className="font-semibold text-gray-700">Таны төлөх дүн</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-700">{userTotalMNT.toLocaleString()}₮</p>
                    <p className="text-sm text-gray-500">{userTotalYuan.toLocaleString()}¥</p>
                  </div>
                </div>
              )}

              {/* Payment Section */}
              {isPendingPayment && onConfirmPayment && (
                <div className="space-y-3">
                  {/* Bank Info */}
                  {adminSettings && (adminSettings.accountNumber || adminSettings.bank) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Төлбөр шилжүүлэх данс
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {adminSettings.bank && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Банк:</span>
                            <span className="font-medium">{adminSettings.bank}</span>
                          </div>
                        )}
                        {adminSettings.accountName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Дансны нэр:</span>
                            <span className="font-medium">{adminSettings.accountName}</span>
                          </div>
                        )}
                        {adminSettings.accountNumber && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Дансны дугаар:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono">{adminSettings.accountNumber}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(adminSettings.accountNumber || "");
                                  alert("Хуулагдлаа!");
                                }}
                                className="px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded text-xs font-medium"
                              >
                                Хуулах
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Confirm Payment Button */}
                  <button
                    onClick={() => onConfirmPayment(bundleOrder.id)}
                    disabled={paymentLoading}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {paymentLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Баталгаажуулж байна...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Төлбөр төлсөн
                      </>
                    )}
                  </button>

                  {/* Chat with Agent Button */}
                  {onOpenChat && (
                    <button
                      onClick={() => onOpenChat(bundleOrder)}
                      className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Агенттай чатлах
                    </button>
                  )}

                  {/* Cancel Order Button */}
                  {canCancel && onCancelOrder && (
                    <button
                      onClick={() => {
                        if (confirm("Захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
                          onCancelOrder(bundleOrder.id);
                        }
                      }}
                      disabled={cancelLoading}
                      className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {cancelLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          Цуцлаж байна...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Захиалга цуцлах
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Payment Verified */}
              {bundleOrder.userPaymentVerified && (
                <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Төлбөр баталгаажсан</span>
                </div>
              )}

              {/* Date */}
              <p className="text-xs text-gray-400 text-center">
                Үүсгэсэн: {new Date(bundleOrder.createdAt).toLocaleDateString("mn-MN", {
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
      </div>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-60 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
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
