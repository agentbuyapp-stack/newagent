/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import type { Order, AgentReport } from "@/lib/api";

interface OrderDetailModalProps {
  order: Order;
  agentReport: AgentReport | null | undefined;
  adminSettings: {
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    exchangeRate?: number;
  } | null;
  onClose: () => void;
  onOpenChat: (order: Order) => void;
  onCancelOrder: (orderId: string) => void;
  onPaymentPaid: (orderId: string) => void;
  onArchiveOrder: (orderId: string) => void;
  cancelLoading: boolean;
  paymentLoading: boolean;
  archiveLoading: boolean;
  canCancelOrder: (order: Order) => boolean;
  canArchiveOrder: (order: Order) => boolean;
}

export function OrderDetailModal({
  order,
  agentReport,
  adminSettings,
  onClose,
  onOpenChat,
  onCancelOrder,
  onPaymentPaid,
  onArchiveOrder,
  cancelLoading,
  paymentLoading,
  archiveLoading,
  canCancelOrder,
  canArchiveOrder,
}: OrderDetailModalProps) {
  const [showUserInfoInModal, setShowUserInfoInModal] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(true);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);

  const hasAgentReport = agentReport !== null && agentReport !== undefined;
  const mainImage =
    order.imageUrls && order.imageUrls.length > 0 ? order.imageUrls[0] : null;

  // Status helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "niitlegdsen":
        return "bg-gray-100 text-gray-700";
      case "agent_sudlaj_bn":
        return "bg-amber-100 text-amber-700";
      case "tolbor_huleej_bn":
        return "bg-blue-100 text-blue-700";
      case "amjilttai_zahialga":
        return "bg-emerald-100 text-emerald-700";
      case "tsutsalsan_zahialga":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "niitlegdsen":
        return "Шинэ захиалга";
      case "agent_sudlaj_bn":
        return "Судлагдаж байна";
      case "tolbor_huleej_bn":
        return "Төлбөр хүлээж байна";
      case "amjilttai_zahialga":
        return "Амжилттай";
      case "tsutsalsan_zahialga":
        return "Цуцлагдсан";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "niitlegdsen":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        );
      case "agent_sudlaj_bn":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        );
      case "tolbor_huleej_bn":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
      case "amjilttai_zahialga":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
      case "tsutsalsan_zahialga":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
      default:
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-2xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with gradient and product image */}
        <div className="sticky top-0 bg-linear-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 z-10">
          <div className="flex items-start gap-4">
            {/* Product Thumbnail */}
            {mainImage ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white/20 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
                <img
                  src={mainImage}
                  alt={order.productName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white/20 rounded-xl flex items-center justify-center border-2 border-white/30">
                <svg
                  className="w-8 h-8 text-white/70"
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

            {/* Title and Status */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                {order.productName}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(order.status)}`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {getStatusIcon(order.status)}
                  </svg>
                  {getStatusText(order.status)}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1.5">
                {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all min-h-10 min-w-10"
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
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Track Code - Priority display for successful orders */}
          {order.status === "amjilttai_zahialga" && order.trackCode && (
            <TrackCodeSection trackCode={order.trackCode} />
          )}

          {/* Product Details Card */}
          <ProductDetailsSection
            order={order}
            showUserInfoInModal={showUserInfoInModal}
            setShowUserInfoInModal={setShowUserInfoInModal}
            zoomedImageIndex={zoomedImageIndex}
            setZoomedImageIndex={setZoomedImageIndex}
          />

          {/* Report Section - Collapsible (for payment waiting status) */}
          {order.status === "tolbor_huleej_bn" &&
            hasAgentReport &&
            agentReport && (
              <PaymentReportSection
                order={order}
                agentReport={agentReport}
                adminSettings={adminSettings}
                showPaymentSection={showPaymentSection}
                setShowPaymentSection={setShowPaymentSection}
                onPaymentPaid={onPaymentPaid}
                onCancelOrder={onCancelOrder}
                paymentLoading={paymentLoading}
                cancelLoading={cancelLoading}
              />
            )}

          {/* Agent Report for non-payment statuses */}
          {hasAgentReport &&
            agentReport &&
            order.status !== "tolbor_huleej_bn" && (
              <CompletedReportSection
                agentReport={agentReport}
                exchangeRate={adminSettings?.exchangeRate || 1}
              />
            )}

          {/* Dates Section */}
          <DatesSection order={order} />

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Chat Button */}
            {order.status !== "tsutsalsan_zahialga" && (
              <button
                onClick={() => onOpenChat(order)}
                className="w-full px-4 py-3 bg-linear-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Чат нээх
              </button>
            )}

            {/* Archive Button - for completed/cancelled orders */}
            {canArchiveOrder(order) && (
              <button
                onClick={() => onArchiveOrder(order.id)}
                disabled={archiveLoading}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {archiveLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                ) : (
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
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                )}
                {archiveLoading ? "Уншиж байна..." : "Архивлах"}
              </button>
            )}

            {/* Cancel/Delete Button - not shown for tolbor_huleej_bn (handled in payment section) */}
            {canCancelOrder(order) && order.status !== "tolbor_huleej_bn" && (
              <button
                onClick={() => onCancelOrder(order.id)}
                disabled={cancelLoading}
                className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoading ? (
                  <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
                {cancelLoading ? "Устгаж байна..." : "Захиалга устгах"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function TrackCodeSection({ trackCode }: { trackCode: string }) {
  return (
    <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
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
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
            Трак код
          </p>
          <p className="text-lg font-bold text-emerald-800 font-mono truncate">
            {trackCode}
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(trackCode);
            alert("Track code хуулагдлаа!");
          }}
          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
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
          Хуулах
        </button>
      </div>
    </div>
  );
}

function ProductDetailsSection({
  order,
  showUserInfoInModal,
  setShowUserInfoInModal,
  zoomedImageIndex,
  setZoomedImageIndex,
}: {
  order: Order;
  showUserInfoInModal: boolean;
  setShowUserInfoInModal: (show: boolean) => void;
  zoomedImageIndex: number | null;
  setZoomedImageIndex: (index: number | null) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setShowUserInfoInModal(!showUserInfoInModal)}
        className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Барааны мэдээлэл</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showUserInfoInModal ? "rotate-180" : ""}`}
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
        <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
          {/* Images Gallery */}
          {order.imageUrls && order.imageUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Зурагнууд
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {order.imageUrls.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-blue-300"
                    onClick={() =>
                      setZoomedImageIndex(
                        zoomedImageIndex === index ? null : index
                      )
                    }
                  >
                    <img
                      src={imgUrl}
                      alt={`${order.productName} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {/* Zoomed Image Modal */}
              {zoomedImageIndex !== null && (
                <div
                  className="fixed inset-0 bg-black/90 flex items-center justify-center z-70 p-4"
                  onClick={() => setZoomedImageIndex(null)}
                >
                  <img
                    src={order.imageUrls[zoomedImageIndex]}
                    alt={`${order.productName} - ${zoomedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-xl"
                  />
                  <button
                    onClick={() => setZoomedImageIndex(null)}
                    className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
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
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Барааны нэр
            </p>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {order.productName}
            </p>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Тайлбар
            </p>
            {order.description &&
            order.description.includes(":") &&
            order.description.split("\n\n").length > 1 ? (
              <div className="space-y-2">
                {order.description.split("\n\n").map((productDesc, idx) => {
                  const [productName, ...descParts] = productDesc.split(": ");
                  const productDescription = descParts.join(": ");
                  return (
                    <div
                      key={idx}
                      className="bg-blue-50 border border-blue-100 rounded-lg p-3"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {productName}
                      </p>
                      {productDescription && (
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {productDescription}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                {order.description || "Тайлбар байхгүй"}
              </p>
            )}
          </div>

          {/* Order ID */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Захиалгын ID
            </p>
            <p className="text-xs font-mono text-gray-600 mt-1">
              #{order.id.slice(-4).toUpperCase()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentReportSection({
  order,
  agentReport,
  adminSettings,
  showPaymentSection,
  setShowPaymentSection,
  onPaymentPaid,
  onCancelOrder,
  paymentLoading,
  cancelLoading,
}: {
  order: Order;
  agentReport: AgentReport;
  adminSettings: {
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    exchangeRate?: number;
  } | null;
  showPaymentSection: boolean;
  setShowPaymentSection: (show: boolean) => void;
  onPaymentPaid: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  paymentLoading: boolean;
  cancelLoading: boolean;
}) {
  const exchangeRate = adminSettings?.exchangeRate || 1;
  const yuanAmount = agentReport.userAmount || 0;
  const totalMNT = Math.round(yuanAmount * exchangeRate * 1.05);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setShowPaymentSection(!showPaymentSection)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
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
          <span className="font-semibold text-gray-900">Тайлан</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showPaymentSection ? "rotate-180" : ""}`}
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

      {/* Content */}
      {showPaymentSection && (
        <div className="border-t border-gray-200 bg-white">
          {/* Agent Images */}
          {agentReport.additionalImages &&
            agentReport.additionalImages.length > 0 && (
              <div className="p-3 border-b border-gray-100">
                <div className="flex gap-2">
                  {agentReport.additionalImages.map((img, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Quantity & Description */}
          {(agentReport.quantity || agentReport.additionalDescription) && (
            <div className="p-3 space-y-2 text-sm border-b border-gray-100">
              {agentReport.quantity && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Тоо ширхэг</span>
                  <span className="font-medium">{agentReport.quantity}</span>
                </div>
              )}
              {agentReport.additionalDescription && (
                <div>
                  <span className="text-gray-500 text-xs">Тайлбар:</span>
                  <p className="text-gray-700 mt-1">
                    {agentReport.additionalDescription}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Total Amount */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Нийт дүн</span>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {totalMNT.toLocaleString()} ₮
                </p>
                <p className="text-xs text-gray-400">
                  {yuanAmount.toLocaleString()}¥ × {exchangeRate.toLocaleString()}
                  ₮ + 5%
                </p>
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div className="p-3 space-y-1.5 text-sm border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 font-medium mb-2">
              Шилжүүлэх данс
            </p>
            <div className="flex justify-between">
              <span className="text-gray-500">Банк</span>
              <span className="font-medium">{adminSettings?.bank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Нэр</span>
              <span className="font-medium">{adminSettings?.accountName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Данс</span>
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono">
                  {adminSettings?.accountNumber}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(
                      adminSettings?.accountNumber || ""
                    );
                    alert("Хуулагдлаа!");
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Хуулах
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3">
            {order.userPaymentVerified ? (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-2.5 text-sm">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Баталгаажуулахыг хүлээж байна</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onPaymentPaid(order.id)}
                  disabled={paymentLoading}
                  className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {paymentLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  Төлбөр төлсөн
                </button>
                <button
                  onClick={() => onCancelOrder(order.id)}
                  disabled={cancelLoading}
                  className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                >
                  Цуцлах
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CompletedReportSection({
  agentReport,
  exchangeRate,
}: {
  agentReport: AgentReport;
  exchangeRate: number;
}) {
  const yuanAmount = agentReport.userAmount || 0;
  const totalMNT = Math.round(yuanAmount * exchangeRate * 1.05);

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-700">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm font-medium">Тайлан</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white">
        {/* Images */}
        {agentReport.additionalImages &&
          agentReport.additionalImages.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex gap-2">
                {agentReport.additionalImages.map((img, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Quantity & Description */}
        {(agentReport.quantity || agentReport.additionalDescription) && (
          <div className="p-3 space-y-2 text-sm border-b border-gray-100">
            {agentReport.quantity && (
              <div className="flex justify-between">
                <span className="text-gray-500">Тоо ширхэг</span>
                <span className="font-medium">{agentReport.quantity}</span>
              </div>
            )}
            {agentReport.additionalDescription && (
              <div>
                <span className="text-gray-500 text-xs">Тайлбар:</span>
                <p className="text-gray-700 mt-1">
                  {agentReport.additionalDescription}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Total Amount */}
        <div className="p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Төлсөн дүн</span>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                {totalMNT.toLocaleString()} ₮
              </p>
              <p className="text-xs text-gray-400">
                {yuanAmount.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮
                + 5%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatesSection({ order }: { order: Order }) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-1.5">
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>
          {new Date(order.createdAt).toLocaleDateString("mn-MN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>
          {new Date(order.updatedAt).toLocaleDateString("mn-MN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
