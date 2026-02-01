"use client";

import { memo, useState, useCallback } from "react";
import Image from "next/image";
import type { Order, AgentReport, LatestVoiceMessage } from "@/lib/api";
import { getStatusText } from "@/lib/orderHelpers";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { OrderCardVoice } from "@/components/OrderCardVoice";

interface MyOrderCardProps {
  order: Order;
  agentReport?: AgentReport | null;
  exchangeRate: number;
  canArchive: boolean;
  archiveLoading: boolean;
  onViewOrder: (order: Order) => void;
  onOpenChat: (order: Order) => void;
  onOpenReportForm: (order: Order, isBundleOrder: boolean) => void;
  onClearOrder: (orderId: string) => void;
  onArchiveOrder: (orderId: string) => void;
  calculateUserPaymentAmount: (report: AgentReport, exchangeRate: number) => number;
  // Voice recording props
  onSendVoiceMessage?: (orderId: string, audioBase64: string, duration: number) => Promise<void>;
  latestVoiceMessage?: LatestVoiceMessage | null;
}

function getStatusBadgeClass(status: Order["status"]): string {
  switch (status) {
    case "agent_sudlaj_bn":
      return "bg-amber-100 text-amber-700";
    case "tolbor_huleej_bn":
      return "bg-blue-100 text-blue-700";
    case "amjilttai_zahialga":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

function getCardBorderClass(status: Order["status"], needsReport: boolean, waitingPayment: boolean): string {
  if (needsReport) {
    return "border-amber-300 hover:border-amber-400 shadow-amber-100/50";
  }
  if (waitingPayment) {
    return "border-blue-300 hover:border-blue-400";
  }
  if (status === "amjilttai_zahialga") {
    return "border-emerald-300 hover:border-emerald-400";
  }
  return "border-gray-200 hover:border-gray-300";
}

function MyOrderCard({
  order,
  agentReport,
  exchangeRate,
  canArchive,
  archiveLoading,
  onViewOrder,
  onOpenChat,
  onOpenReportForm,
  onClearOrder,
  onArchiveOrder,
  calculateUserPaymentAmount,
  onSendVoiceMessage,
  latestVoiceMessage,
}: MyOrderCardProps) {
  const [isRecordingMode, setIsRecordingMode] = useState(false);

  const mainImage = order.imageUrls && order.imageUrls.length > 0
    ? order.imageUrls[0]
    : order.imageUrl || null;

  const needsReport = order.status === "agent_sudlaj_bn" && !agentReport;
  const waitingPayment = order.status === "tolbor_huleej_bn";
  const isBundleOrder = (order as Order & { isBundleOrder?: boolean }).isBundleOrder;
  const userSnapshot = (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot;

  // Check if order is active (voice recording enabled)
  const isActiveOrder = ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga"].includes(order.status);
  const canUseVoice = isActiveOrder && !!onSendVoiceMessage;

  // Voice recording hook
  const {
    recordingState,
    recordingDuration,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
    formatTime,
    setRecordingState,
  } = useVoiceRecording({
    maxDuration: 60,
    onError: (error) => {
      alert(error.message);
      setIsRecordingMode(false);
    },
  });

  // Handle start recording - triggered by button
  const handleStartRecording = useCallback(async () => {
    if (!canUseVoice || recordingState !== "idle") return;
    setIsRecordingMode(true);
    try {
      await startRecording();
    } catch {
      setIsRecordingMode(false);
    }
  }, [canUseVoice, recordingState, startRecording]);

  // Handle stop recording
  const handleStopRecording = useCallback(async () => {
    const result = await stopRecording();
    if (result && onSendVoiceMessage) {
      setRecordingState("uploading");
      try {
        await onSendVoiceMessage(order.id, result.base64, result.duration);
      } catch (error) {
        console.error("Failed to send voice message:", error);
        alert("Дуут мессеж илгээхэд алдаа гарлаа");
      }
    }
    setIsRecordingMode(false);
  }, [stopRecording, onSendVoiceMessage, order.id, setRecordingState]);

  // Handle cancel recording
  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setIsRecordingMode(false);
  }, [cancelRecording]);

  return (
    <div
      className={`relative bg-linear-to-br from-white to-gray-50 rounded-xl border transition-all duration-300 p-3 hover:scale-[1.01] ${getCardBorderClass(order.status, needsReport, waitingPayment)}`}
    >
      {/* Voice recording overlay */}
      {isRecordingMode && (
        <OrderCardVoice
          isRecording={isRecordingMode}
          recordingState={recordingState}
          recordingDuration={recordingDuration}
          waveformData={waveformData}
          maxDuration={60}
          onStopRecording={handleStopRecording}
          onCancelRecording={handleCancelRecording}
          formatTime={formatTime}
          latestVoiceMessage={latestVoiceMessage}
          theme="light"
        />
      )}

      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={order.productName}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
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
          {/* Action needed indicator */}
          {needsReport && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top: Status & Date */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStatusBadgeClass(order.status)}`}>
              {getStatusText(order.status)}
            </span>
            <div className="flex items-center gap-1">
              {/* Voice record button */}
              {canUseVoice && !isRecordingMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRecording();
                  }}
                  className="w-5 h-5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-all inline-flex items-center justify-center"
                  title="Дуу бичих"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <span className="text-[10px] text-gray-400 shrink-0">
                {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Product name */}
          <h4 className="font-bold text-gray-900 text-sm truncate">
            {order.productName}
          </h4>

          {/* User Info */}
          {(order.user?.profile || userSnapshot) && (
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              <span className="font-medium text-blue-600">
                {order.user?.profile?.name || userSnapshot?.name || "Нэргүй"}
              </span>
              {(order.user?.profile?.cargo || userSnapshot?.cargo) && (
                <span> • {order.user?.profile?.cargo || userSnapshot?.cargo}</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Price and Track Code - Always visible */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {agentReport && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            {calculateUserPaymentAmount(agentReport, exchangeRate).toLocaleString()} ₮
          </span>
        )}
        {order.trackCode && (
          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
            🚚 {order.trackCode}
          </span>
        )}
      </div>

      {/* Buttons - Bottom */}
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
        <button
          onClick={() => onViewOrder(order)}
          className="h-7 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Харах
        </button>
        {/* Voice playback for latest message */}
        {latestVoiceMessage && !isRecordingMode && (
          <OrderCardVoice
            isRecording={false}
            recordingState="idle"
            recordingDuration={0}
            waveformData={[]}
            onStopRecording={() => {}}
            onCancelRecording={() => {}}
            formatTime={formatTime}
            latestVoiceMessage={latestVoiceMessage}
            theme="light"
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenChat(order);
          }}
          className="h-7 px-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Чат
        </button>
        {needsReport && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenReportForm(order, !!isBundleOrder);
            }}
            className="flex-1 h-7 px-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center justify-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Тайлан
          </button>
        )}
        {(order.status === "tsutsalsan_zahialga" || order.archivedByAgent) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearOrder(order.id);
            }}
            className="h-7 px-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Устгах
          </button>
        )}
        {canArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchiveOrder(order.id);
            }}
            disabled={archiveLoading}
            className="h-7 px-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {archiveLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
            {archiveLoading ? "..." : "Архив"}
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(MyOrderCard);
