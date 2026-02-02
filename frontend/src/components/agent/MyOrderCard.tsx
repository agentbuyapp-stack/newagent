"use client";

import { memo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { Order, AgentReport, LatestVoiceMessage } from "@/lib/api";
import { getStatusText } from "@/lib/orderHelpers";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { OrderCardVoice, NewVoiceGlow, useIsNewVoiceMessage } from "@/components/OrderCardVoice";

type ViewModeType = "card" | "list" | "compact";

interface MyOrderCardProps {
  order: Order;
  viewMode?: ViewModeType;
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
  currentUserId?: string;
}

function getStatusBadgeClass(status: Order["status"]): string {
  switch (status) {
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
}

function getProgressPercent(status: Order["status"]): number {
  switch (status) {
    case "niitlegdsen":
      return 20;
    case "agent_sudlaj_bn":
      return 45;
    case "tolbor_huleej_bn":
      return 70;
    case "amjilttai_zahialga":
      return 100;
    case "tsutsalsan_zahialga":
      return 0;
    default:
      return 0;
  }
}

function MyOrderCard({
  order,
  viewMode = "card",
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
  currentUserId,
}: MyOrderCardProps) {
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Check if there's a new unheard voice message from user
  const hasNewVoice = useIsNewVoiceMessage(latestVoiceMessage, currentUserId);

  const mainImage = order.imageUrls && order.imageUrls.length > 0
    ? order.imageUrls[0]
    : order.imageUrl || null;

  const needsReport = order.status === "agent_sudlaj_bn" && !agentReport;
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

  const theme = isDark ? "dark" : "light";

  // Compact View - Simple list with just name, status, and expand button
  if (viewMode === "compact") {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              order.status === "amjilttai_zahialga"
                ? "bg-green-500"
                : order.status === "tsutsalsan_zahialga"
                  ? "bg-red-500"
                  : order.status === "tolbor_huleej_bn"
                    ? "bg-blue-500"
                    : order.status === "agent_sudlaj_bn"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
            }`}
          />
          {needsReport && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
          )}
          <span className="text-sm text-gray-900 dark:text-white truncate">
            {order.productName}
          </span>
          {agentReport && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
              {calculateUserPaymentAmount(agentReport, exchangeRate).toLocaleString()}₮
            </span>
          )}
        </div>
        <button
          onClick={() => onViewOrder(order)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
        >
          <svg className="w-4 h-4 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  // Card View (default)
  return (
    <div className="relative rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden p-4 bg-linear-to-br from-white via-gray-50 to-gray-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900">
      {/* New voice message glow effect */}
      <NewVoiceGlow hasNewVoice={hasNewVoice} theme={theme} />

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
          currentUserId={currentUserId}
          theme={theme}
        />
      )}

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 dark:bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Action needed indicator */}
      {needsReport && (
        <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white z-20" />
      )}

      <div className="relative z-10 flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 shrink-0 bg-black/10 dark:bg-white/10 rounded-xl overflow-hidden relative ring-2 ring-black/10 dark:ring-white/20">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={order.productName}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-black/30 dark:text-white/30"
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
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          {/* Top: Status & Date */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${getStatusBadgeClass(order.status)}`}>
              {getStatusText(order.status)}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Voice record button */}
              {canUseVoice && !isRecordingMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartRecording();
                  }}
                  className="w-6 h-6 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white rounded-full transition-all inline-flex items-center justify-center"
                  title="Дуу бичих"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {new Date(order.createdAt).toLocaleDateString("mn-MN", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Product name */}
          <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">
            {order.productName}
          </h4>

          {/* User Info */}
          {(order.user?.profile || userSnapshot) && (
            <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 truncate">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {order.user?.profile?.name || userSnapshot?.name || "Нэргүй"}
              </span>
              {(order.user?.profile?.cargo || userSnapshot?.cargo) && (
                <span className="text-gray-500 dark:text-slate-400"> • {order.user?.profile?.cargo || userSnapshot?.cargo}</span>
              )}
            </p>
          )}

          {/* Cancel Reason */}
          {order.status === "tsutsalsan_zahialga" && order.cancelReason && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 italic truncate">
              Шалтгаан: {order.cancelReason}
            </p>
          )}
        </div>
      </div>

      {/* Price and Track Code */}
      <div className="relative z-10 mt-3 flex items-center gap-2 flex-wrap">
        {agentReport && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
            {calculateUserPaymentAmount(agentReport, exchangeRate).toLocaleString()} ₮
          </span>
        )}
        {order.trackCode && (
          <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
            {order.trackCode}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {order.status !== "tsutsalsan_zahialga" && (
        <div className="relative z-10 mt-2 flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500 relative"
              style={{ width: `${getProgressPercent(order.status)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-300 rounded-full border-2 border-white shadow-lg" />
            </div>
          </div>
          <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-300 w-8 text-right">
            {getProgressPercent(order.status)}%
          </span>
        </div>
      )}

      {/* Buttons - Bottom (4-column grid) */}
      <div className="relative z-10 grid grid-cols-4 gap-1.5 mt-3">
        {/* View Button */}
        <button
          onClick={() => onViewOrder(order)}
          className="h-8 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Харах
        </button>

        {/* Report or Chat Button */}
        {needsReport ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenReportForm(order, !!isBundleOrder);
            }}
            className="h-8 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Тайлан
          </button>
        ) : (
          <div />
        )}

        {/* Chat Button with Voice */}
        <div className="flex items-center justify-center gap-1">
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
              currentUserId={currentUserId}
              theme={theme}
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat(order);
            }}
            className="h-8 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1 px-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Чат
          </button>
        </div>

        {/* Delete or Archive Button */}
        {(order.status === "tsutsalsan_zahialga" || order.archivedByAgent) ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearOrder(order.id);
            }}
            className="h-8 hover:bg-black/10 dark:hover:bg-white/10 text-red-500 dark:text-red-400 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Устгах
          </button>
        ) : canArchive ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchiveOrder(order.id);
            }}
            disabled={archiveLoading}
            className="h-8 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {archiveLoading ? (
              <div className="w-4 h-4 border-2 border-gray-500 dark:border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            )}
            {archiveLoading ? "..." : "Архив"}
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

export default memo(MyOrderCard);
