/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { BundleOrder, LatestVoiceMessage } from "@/lib/api";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { OrderCardVoice, NewVoiceGlow, useIsNewVoiceMessage } from "./OrderCardVoice";

interface BundleOrderCardProps {
  bundleOrder: BundleOrder;
  viewMode: "list" | "card" | "compact";
  onViewDetails: (bundleOrder: BundleOrder) => void;
  onOpenChat: (bundleOrder: BundleOrder) => void;
  onViewReport?: (bundleOrder: BundleOrder) => void;
  onDelete?: (bundleOrder: BundleOrder) => void;
  onArchive?: (bundleOrder: BundleOrder) => void;
  deleteLoading?: boolean;
  archiveLoading?: boolean;
  // Voice recording props
  onSendVoiceMessage?: (
    orderId: string,
    audioBase64: string,
    duration: number,
  ) => Promise<void>;
  latestVoiceMessage?: LatestVoiceMessage | null;
  currentUserId?: string;
}

// Helper functions
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

const getProgressPercent = (status: string) => {
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
};

export const BundleOrderCard: React.FC<BundleOrderCardProps> = ({
  bundleOrder,
  viewMode,
  onViewDetails,
  onOpenChat,
  onViewReport,
  onDelete,
  onArchive,
  deleteLoading = false,
  archiveLoading = false,
  onSendVoiceMessage,
  latestVoiceMessage,
  currentUserId,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);

  // Check if there's a new unheard voice message
  const hasNewVoice = useIsNewVoiceMessage(latestVoiceMessage, currentUserId);

  // Check if order is active (voice recording enabled)
  const isActiveOrder = ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga"].includes(bundleOrder.status);
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
        await onSendVoiceMessage(bundleOrder.id, result.base64, result.duration);
      } catch (error) {
        console.error("Failed to send voice message:", error);
        alert("Дуут мессеж илгээхэд алдаа гарлаа");
      }
    }
    setIsRecordingMode(false);
  }, [stopRecording, onSendVoiceMessage, bundleOrder.id, setRecordingState]);

  // Handle cancel recording
  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setIsRecordingMode(false);
  }, [cancelRecording]);

  const handleCopyTrackCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bundleOrder.trackCode) {
      await navigator.clipboard.writeText(bundleOrder.trackCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Can delete only if status is "niitlegdsen" (before agent review) or archived
  const canDelete =
    bundleOrder.status === "niitlegdsen" || bundleOrder.archivedByUser;
  // Can archive only if order is completed or cancelled and not already archived
  const canArchive =
    (bundleOrder.status === "amjilttai_zahialga" ||
      bundleOrder.status === "tsutsalsan_zahialga") &&
    !bundleOrder.archivedByUser;

  // Check if bundle has report (agent has submitted report)
  const hasReport =
    bundleOrder.status === "tolbor_huleej_bn" ||
    bundleOrder.status === "amjilttai_zahialga";

  // Get product names as single display name
  const productNames = bundleOrder.items
    .map((item) => item.productName)
    .join(", ");
  // Truncate if too long
  const displayName =
    productNames.length > 25
      ? productNames.substring(0, 25) + "..."
      : productNames;

  // Get first image from items: 1) user images, 2) agent report images, 3) bundle report images
  const getUserImage = () => {
    const itemWithUserImage = bundleOrder.items.find(
      (item) => item.imageUrls && item.imageUrls.length > 0,
    );
    return itemWithUserImage?.imageUrls?.[0] || null;
  };

  const getAgentReportImage = () => {
    // Check per-item reports first
    const itemWithReportImage = bundleOrder.items.find(
      (item) =>
        item.agentReport?.additionalImages &&
        item.agentReport.additionalImages.length > 0,
    );
    if (itemWithReportImage?.agentReport?.additionalImages?.[0]) {
      return itemWithReportImage.agentReport.additionalImages[0];
    }
    // Check bundle-level report
    if (
      bundleOrder.bundleReport?.additionalImages &&
      bundleOrder.bundleReport.additionalImages.length > 0
    ) {
      return bundleOrder.bundleReport.additionalImages[0];
    }
    return null;
  };

  const mainImage = getUserImage() || getAgentReportImage();

  // Get first item's description
  const firstDescription = bundleOrder.items[0]?.description || "";

  // Compact View - Simple list with just name and expand button
  if (viewMode === "compact") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              bundleOrder.status === "amjilttai_zahialga"
                ? "bg-green-500"
                : bundleOrder.status === "tsutsalsan_zahialga"
                  ? "bg-red-500"
                  : bundleOrder.status === "tolbor_huleej_bn"
                    ? "bg-blue-500"
                    : bundleOrder.status === "agent_sudlaj_bn"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
            }`}
          />
          <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
              {bundleOrder.items.length}
            </span>
          </div>
          <span className="text-sm text-gray-900 dark:text-white truncate">
            {displayName}
          </span>
        </div>
        <button
          onClick={() =>
            hasReport && onViewReport
              ? onViewReport(bundleOrder)
              : onViewDetails(bundleOrder)
          }
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
        >
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
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
        </button>
      </div>
    );
  }

  // List View
  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all p-3 flex items-center gap-3">
        {/* Product info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-center gap-1">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {displayName}
            </h4>
            <span className="text-xs text-purple-600 font-medium">
              ({bundleOrder.items.length})
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bundleOrder.status)} whitespace-nowrap`}
            >
              {getStatusText(bundleOrder.status)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date(bundleOrder.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            })}
          </p>
          {/* Track Code */}
          {bundleOrder.trackCode && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Трак код:
              </span>
              <code className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">
                {bundleOrder.trackCode}
              </code>
              <button
                onClick={handleCopyTrackCode}
                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Хуулах"
              >
                {copied ? (
                  <svg
                    className="w-3.5 h-3.5 text-green-500"
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
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"
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
                )}
              </button>
            </div>
          )}
          {/* Cancel Reason */}
          {bundleOrder.status === "tsutsalsan_zahialga" && bundleOrder.cancelReason && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1 italic line-clamp-2">
              Шалтгаан: {bundleOrder.cancelReason}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {hasReport && onViewReport ? (
            <button
              onClick={() => onViewReport(bundleOrder)}
              className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Тайлан
            </button>
          ) : (
            <button
              onClick={() => onViewDetails(bundleOrder)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
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
              Дэлгэрэнгүй
            </button>
          )}
          {bundleOrder.status !== "tsutsalsan_zahialga" && (
            <button
              onClick={() => onOpenChat(bundleOrder)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Чат
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Захиалгыг устгахдаа итгэлтэй байна уу?")) {
                  onDelete(bundleOrder);
                }
              }}
              disabled={deleteLoading}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
              {deleteLoading ? "..." : "Устгах"}
            </button>
          )}
          {canArchive && onArchive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(bundleOrder);
              }}
              disabled={archiveLoading}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {archiveLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
              ) : (
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
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              )}
              {archiveLoading ? "..." : "Архив"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card View - Dark theme matching OrderCard
  return (
    <div
      className="relative rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 overflow-hidden p-4 bg-linear-to-br from-slate-800 via-slate-700 to-slate-900"
    >
      {/* New voice message glow effect */}
      <NewVoiceGlow hasNewVoice={hasNewVoice} theme="dark" />

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
          currentUserId={currentUserId}
          latestVoiceMessage={latestVoiceMessage}
          theme="dark"
        />
      )}

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex gap-4">
        {/* Thumbnail - only show if there's an image */}
        {mainImage && (
          <div className="w-20 h-20 shrink-0 bg-white/10 rounded-xl overflow-hidden relative ring-2 ring-white/20">
            <Image
              src={mainImage}
              alt={displayName}
              fill
              sizes="80px"
              className="object-cover"
            />
            {/* Bundle badge */}
            <div className="absolute bottom-1 right-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {bundleOrder.items.length}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          {/* Top: Status */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${getStatusColor(bundleOrder.status)}`}
            >
              {getStatusText(bundleOrder.status)}
            </span>
            <div className="flex items-center gap-1.5">
              {/* Voice record button */}
              {canUseVoice && !isRecordingMode && (
                <button
                  onClick={handleStartRecording}
                  className="w-6 h-6 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all inline-flex items-center justify-center"
                  title="Дуу бичих"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <p className="text-xs text-slate-400">
                {new Date(bundleOrder.createdAt).toLocaleDateString("mn-MN", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Product names */}
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-base truncate">
              {displayName}
            </h4>
            {/* Bundle badge - show when no thumbnail */}
            {!mainImage && (
              <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                {bundleOrder.items.length}
              </span>
            )}
          </div>

          {/* Description snippet */}
          {firstDescription && (
            <p className="text-xs text-slate-300 line-clamp-1 mt-1">
              {firstDescription}
            </p>
          )}
          {/* Cancel Reason */}
          {bundleOrder.status === "tsutsalsan_zahialga" && bundleOrder.cancelReason && (
            <p className="text-xs text-red-300 line-clamp-2 mt-1 italic">
              Шалтгаан: {bundleOrder.cancelReason}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {bundleOrder.status !== "tsutsalsan_zahialga" && (
        <div className="relative z-10 mt-3 flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500 relative"
              style={{ width: `${getProgressPercent(bundleOrder.status)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-300 rounded-full border-2 border-white shadow-lg" />
            </div>
          </div>
          <span className="text-xs font-semibold text-yellow-300 w-8 text-right">
            {getProgressPercent(bundleOrder.status)}%
          </span>
        </div>
      )}

      {/* Buttons - Bottom */}
      <div className="relative z-10 grid grid-cols-4 gap-1.5 mt-3">
        {/* Track Code Button */}
        {bundleOrder.trackCode ? (
          <button
            onClick={handleCopyTrackCode}
            className="h-8 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1"
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {copied ? "Хуулсан" : "Трак"}
          </button>
        ) : (
          <div />
        )}

        {hasReport && onViewReport ? (
          <button
            onClick={() => onViewReport(bundleOrder)}
            className="h-8 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Тайлан
          </button>
        ) : (
          <button
            onClick={() => onViewDetails(bundleOrder)}
            className="h-8 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1"
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
        )}

        {bundleOrder.status !== "tsutsalsan_zahialga" ? (
          <div className="flex items-center justify-center gap-1">
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
                currentUserId={currentUserId}
                theme="dark"
              />
            )}
            <button
              onClick={() => onOpenChat(bundleOrder)}
              className="h-8 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1 px-2"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Чат
            </button>
          </div>
        ) : (
          <div />
        )}

        {canDelete && onDelete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Захиалгыг устгахдаа итгэлтэй байна уу?")) {
                onDelete(bundleOrder);
              }
            }}
            disabled={deleteLoading}
            className="h-8 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteLoading ? (
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
            {deleteLoading ? "..." : "Устгах"}
          </button>
        ) : canArchive && onArchive ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(bundleOrder);
            }}
            disabled={archiveLoading}
            className="h-8 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {archiveLoading ? (
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
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
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
};

export default BundleOrderCard;
