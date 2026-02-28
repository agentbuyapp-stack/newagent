/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import type { Order, AgentReport, OrderStatus, BundleOrder, PublicAgent } from "@/lib/api";
import { apiClient } from "@/lib/api";
import { useUserData, useUserActions, useAgentOrders, useAgentReports, useOrderActions } from "@/hooks";
import { LandingNavbar } from "./landingNavbar";
import { BackgroundGradientSection } from "./backgroundGradientHome";
import { HomePageHeroText } from "./pageHeroTextHome";
import { HowItWorksSection } from "./howItWorksSection";
import { PlatformsSection } from "./platformsSection";
import { WhyChooseSection } from "./whyChooseSection";
import { StatsSection } from "./statsSection";
import { TestimonialsSection } from "./testimonialsSection";
import { CTASection } from "./ctaSection";
import ProfileForm from "@/components/ProfileForm";
import OrderListSection from "@/components/shared/OrderListSection";
import { CargosSection } from "@/components/user/CargosSection";
import { TopAgentsSection } from "@/components/user/TopAgentsSection";
import { AgentDetailModal } from "@/components/user/AgentDetailModal";

const ChatModal = dynamic(() => import("@/components/ChatModal"), { ssr: false });
const AgentReportForm = dynamic(() => import("@/components/AgentReportForm"), { ssr: false });
const BundleReportForm = dynamic(() => import("@/components/BundleReportForm"), { ssr: false });
const CancelOrderModal = dynamic(() => import("@/components/agent/CancelOrderModal"), { ssr: false });

// ── Status config ──
const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  niitlegdsen:         { label: "Шинэ",            color: "bg-gray-100 text-gray-600",   dot: "bg-gray-400" },
  agent_sudlaj_bn:     { label: "Судалж байна",    color: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-400" },
  tolbor_huleej_bn:    { label: "Төлбөр хүлээж",   color: "bg-blue-50 text-blue-700",     dot: "bg-blue-400" },
  amjilttai_zahialga:  { label: "Амжилттай",       color: "bg-green-50 text-green-700",   dot: "bg-green-500" },
  tsutsalsan_zahialga: { label: "Цуцлагдсан",      color: "bg-red-50 text-red-600",       dot: "bg-red-400" },
};

// ── Status steps ──
const STATUS_STEPS = [
  { key: "niitlegdsen", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { key: "agent_sudlaj_bn", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { key: "tolbor_huleej_bn", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" },
  { key: "amjilttai_zahialga", icon: "M5 13l4 4L19 7" },
];

// ═══════════════════════════════════════
// Voice Audio Player
// ═══════════════════════════════════════
function VoicePlayer({ src, onPlay }: { src: string; onPlay?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => { setCurrentTime(a.currentTime); setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0); };
    const onMeta = () => { if (a.duration && isFinite(a.duration)) setDuration(a.duration); };
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onMeta); a.removeEventListener("ended", onEnd); };
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); onPlay?.(); }
    setPlaying(p => !p);
  }, [playing, onPlay]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * a.duration;
  }, []);

  const fmt = (s: number) => { const m = Math.floor(s / 60); return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`; };

  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-md shadow-blue-500/20">
        {playing ? (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
        ) : (
          <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {/* Waveform bars */}
          {[0.4, 0.7, 0.5, 0.9, 0.3, 0.8, 0.6, 1, 0.4, 0.7, 0.5, 0.8, 0.3, 0.9, 0.6, 0.4, 0.7, 0.5, 0.8, 0.3].map((h, i) => (
            <div key={i} className={`w-[3px] rounded-full transition-colors ${i / 20 * 100 < progress ? "bg-blue-500" : "bg-blue-200"}`}
              style={{ height: `${h * 20 + 4}px` }} />
          ))}
        </div>
        <div className="cursor-pointer h-1.5 bg-blue-100 rounded-full mt-2 overflow-hidden" onClick={seek}>
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">{fmt(currentTime)}</span>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Order Detail — Full Screen View
// ═══════════════════════════════════════
function OrderDetailFullScreen({
  order, report, adminSettings, onClose, onChat, onCancel, onPaymentPaid, onArchive,
  cancelLoading, paymentLoading, archiveLoading, canCancel, canArchive,
  isAgent, onTakeOrder, takeOrderLoading,
  onDeleteReport, deleteReportLoading,
  onReport,
  onTrackCodeUpdate,
}: {
  order: Order;
  report: AgentReport | null | undefined;
  adminSettings: { accountNumber?: string; accountName?: string; bank?: string; exchangeRate?: number } | null;
  onClose: () => void;
  onChat: () => void;
  onCancel: () => void;
  onPaymentPaid: () => void;
  onArchive: () => void;
  cancelLoading: boolean;
  paymentLoading: boolean;
  archiveLoading: boolean;
  canCancel: boolean;
  canArchive: boolean;
  isAgent?: boolean;
  onTakeOrder?: (orderId: string) => void;
  takeOrderLoading?: boolean;
  onDeleteReport?: (orderId: string) => void;
  deleteReportLoading?: boolean;
  onReport?: () => void;
  onTrackCodeUpdate?: (orderId: string, trackCode: string) => Promise<void>;
}) {
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [trackCodeInput, setTrackCodeInput] = useState(order.trackCode || "");
  const [isEditingTrackCode, setIsEditingTrackCode] = useState(false);
  const [trackCodeLoading, setTrackCodeLoading] = useState(false);
  const hasReport = report !== null && report !== undefined;
  const rate = adminSettings?.exchangeRate || 1;
  const isCancelled = order.status === "tsutsalsan_zahialga";
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
  const mainImg = order.imageUrls?.[0];
  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.niitlegdsen;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const userImages = order.imageUrls || [];
  const agentImages = (hasReport && report?.additionalImages) || [];
  const isBundleOrder = !!(order as Order & { isBundleOrder?: boolean }).isBundleOrder;
  const bundleItems = (order as Order & { bundleItems?: { id: string; productName: string; description: string; imageUrls: string[]; status: string; agentReport?: { userAmount: number; paymentLink?: string; additionalImages?: string[]; additionalDescription?: string; quantity?: number } }[] }).bundleItems || [];

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-[fadeScale_0.2s_ease-out]">

      {/* ─── Top Bar ─── */}
      <div className="bg-white border-b border-gray-100 px-3 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2 shrink-0">
        <button onClick={onClose}
          className="p-1 sm:p-1.5 -ml-1 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors">
          <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[13px] sm:text-[14px] font-bold text-gray-900 truncate">{order.productName}</h1>
          <p className="text-[9px] sm:text-[10px] text-gray-400">
            #{order.id.slice(-4).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("mn-MN", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        {!isCancelled && (
          <span className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        )}
        {isCancelled && (
          <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 bg-red-50 text-red-600">
            Цуцлагдсан
          </span>
        )}
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full">

          {/* ─── Progress Stepper ─── */}
          {!isCancelled && (
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 mx-4 sm:mx-6 mt-4 sm:mt-5 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 relative overflow-hidden">
              <div className="relative flex items-center">
                {STATUS_STEPS.map((step, i) => {
                  const done = i < currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all shrink-0
                          ${active ? "bg-white text-blue-600 shadow-md" : done ? "bg-white/30 text-white" : "bg-white/10 text-white/30"}`}>
                          {done ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                            </svg>
                          )}
                        </div>
                        <span className={`text-[8px] sm:text-[9px] font-medium text-center leading-tight
                          ${active ? "text-white" : done ? "text-white/60" : "text-white/25"}`}>
                          {(STATUS_MAP[step.key] || STATUS_MAP.niitlegdsen).label}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-[1.5px] mx-1.5 sm:mx-2 rounded-full mb-4 ${i < currentStepIdx ? "bg-white/40" : "bg-white/10"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Cancel reason ─── */}
          {isCancelled && order.cancelReason && (
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <p className="text-[9px] text-red-400 font-semibold uppercase tracking-wide mb-0.5">Цуцалсан шалтгаан</p>
              <p className="text-[12px] sm:text-[13px] text-red-700">{order.cancelReason}</p>
            </div>
          )}

          {/* ─── User Info (Agent view) — compact inline ─── */}
          {isAgent && (() => {
            const snap = (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot;
            const uName = order.user?.profile?.name || snap?.name;
            const uPhone = order.user?.profile?.phone || snap?.phone;
            const uCargo = order.user?.profile?.cargo || snap?.cargo;
            if (!uName && !uPhone && !uCargo) return null;
            return (
              <div className="mx-4 sm:mx-6 mt-3 flex items-center justify-center gap-2 text-[11px] sm:text-[12px] text-gray-500 flex-wrap">
                {uName && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium text-gray-700">{uName}</span>
                  </span>
                )}
                {uName && uPhone && <span className="text-gray-300">·</span>}
                {uPhone && (
                  <a href={`tel:${uPhone}`} className="flex items-center gap-1 text-blue-500 hover:underline">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {uPhone}
                  </a>
                )}
                {(uName || uPhone) && uCargo && <span className="text-gray-300">·</span>}
                {uCargo && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                    </svg>
                    {uCargo}
                  </span>
                )}
              </div>
            );
          })()}

          {/* ─── Track Code ─── */}
          {isAgent && onTrackCodeUpdate ? (
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4">
              {isEditingTrackCode ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5">
                  <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mb-2">Трак код</p>
                  <input
                    type="text"
                    value={trackCodeInput}
                    onChange={(e) => setTrackCodeInput(e.target.value)}
                    placeholder="Track code оруулах..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] font-mono text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    style={{ fontSize: "16px" }}
                    disabled={trackCodeLoading}
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button
                      onClick={async () => {
                        if (!trackCodeInput.trim()) {
                          alert("Track code оруулах шаардлагатай");
                          return;
                        }
                        setTrackCodeLoading(true);
                        try {
                          await onTrackCodeUpdate(order.id, trackCodeInput.trim());
                          setIsEditingTrackCode(false);
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : "Алдаа гарлаа");
                        } finally {
                          setTrackCodeLoading(false);
                        }
                      }}
                      disabled={trackCodeLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-[12px] sm:text-[13px] font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {trackCodeLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "Хадгалах"}
                    </button>
                    <button
                      onClick={() => { setIsEditingTrackCode(false); setTrackCodeInput(order.trackCode || ""); }}
                      disabled={trackCodeLoading}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[12px] sm:text-[13px] font-medium transition-colors disabled:opacity-50"
                    >
                      Цуцлах
                    </button>
                  </div>
                </div>
              ) : order.trackCode ? (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] text-emerald-100 font-medium uppercase tracking-wider">Трак код</p>
                    <p className="text-base sm:text-lg font-mono font-bold text-white truncate">{order.trackCode}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => copyText(order.trackCode!)}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors">
                      {copied ? "✓" : "Хуулах"}
                    </button>
                    <button onClick={() => { setIsEditingTrackCode(true); setTrackCodeInput(order.trackCode || ""); }}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors">
                      Засах
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setIsEditingTrackCode(true); setTrackCodeInput(""); }}
                  className="w-full bg-white rounded-xl border border-dashed border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50 p-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[12px] sm:text-[13px] font-semibold text-emerald-600">Track code нэмэх</span>
                </button>
              )}
            </div>
          ) : order.trackCode ? (
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] text-emerald-100 font-medium uppercase tracking-wider">Трак код</p>
                  <p className="text-base sm:text-lg font-mono font-bold text-white truncate">{order.trackCode}</p>
                </div>
                <button onClick={() => copyText(order.trackCode!)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors shrink-0">
                  {copied ? "✓" : "Хуулах"}
                </button>
              </div>
            </div>
          ) : null}

          {/* ─── Product Info ─── */}
          {isBundleOrder && bundleItems.length > 0 ? (
            /* ── Bundle: show each item ── */
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 space-y-2">
              <span className="text-[9px] sm:text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Багц · {bundleItems.length} бараа
              </span>
              {bundleItems.map((item, idx) => {
                const itemImg = item.imageUrls?.[0];
                return (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-3.5">
                    <div className="flex gap-2.5 sm:gap-3">
                      {itemImg ? (
                        <button onClick={() => setZoomedImg(itemImg)}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                          <img src={itemImg} alt="" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 font-medium">#{idx + 1}</span>
                          <h3 className="text-[13px] sm:text-[14px] font-bold text-gray-900 truncate">{item.productName}</h3>
                        </div>
                        {item.description && (
                          <p className="text-[11px] sm:text-[12px] text-gray-500 mt-0.5 leading-relaxed whitespace-pre-wrap line-clamp-3">{item.description}</p>
                        )}
                      </div>
                    </div>
                    {item.imageUrls && item.imageUrls.length > 1 && (
                      <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
                        {item.imageUrls.map((url, i) => (
                          <button key={i} onClick={() => setZoomedImg(url)}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden border border-gray-100 hover:border-blue-400 shrink-0 transition-all">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {order.audioUrl && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2.5 sm:p-3">
                  <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Дуут мессеж
                  </p>
                  <VoicePlayer src={order.audioUrl} />
                </div>
              )}
            </div>
          ) : (
            /* ── Single order ── */
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-3 sm:p-3.5">
                <div className="flex gap-2.5 sm:gap-3">
                  {mainImg ? (
                    <button onClick={() => setZoomedImg(mainImg)}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                      <img src={mainImg} alt="" className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[14px] sm:text-[15px] font-bold text-gray-900 leading-snug">{order.productName}</h2>
                    {order.description && (
                      <p className="text-[11px] sm:text-[12px] text-gray-500 mt-1 leading-relaxed whitespace-pre-wrap">{order.description}</p>
                    )}
                  </div>
                </div>

                {userImages.length > 1 && (
                  <div className="flex gap-1.5 mt-2.5 overflow-x-auto scrollbar-hide">
                    {userImages.map((url, i) => (
                      <button key={i} onClick={() => setZoomedImg(url)}
                        className="w-11 h-11 sm:w-13 sm:h-13 rounded-md overflow-hidden border border-gray-100 hover:border-blue-400 shrink-0 transition-all">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {order.audioUrl && (
                <div className="px-3 sm:px-3.5 pb-2.5 sm:pb-3">
                  <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Дуут мессеж
                  </p>
                  <VoicePlayer src={order.audioUrl} />
                </div>
              )}
            </div>
          )}

          {/* ─── Agent Report ─── */}
          {hasReport && report && (
            <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-3.5 sm:px-4 py-2.5 flex items-center gap-2 border-b border-gray-50">
                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-[11px] sm:text-[12px] font-semibold text-gray-600">Тайлан</span>
                {isAgent && onDeleteReport && !order.userPaymentVerified && (
                  <button
                    onClick={() => {
                      if (confirm("Тайлан устгахдаа итгэлтэй байна уу? Захиалга \"Судалж байна\" төлөвт буцна.")) {
                        onDeleteReport(order.id);
                      }
                    }}
                    disabled={deleteReportLoading}
                    className="ml-auto p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    title="Тайлан устгах"
                  >
                    {deleteReportLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <div className="px-3.5 sm:px-4 py-3 space-y-2.5">
                {report.additionalDescription && (
                  <p className="text-[12px] sm:text-[13px] text-gray-600 leading-relaxed">{report.additionalDescription}</p>
                )}

                {agentImages.length > 0 && (
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-0.5 px-0.5 pb-0.5">
                    {agentImages.map((url, i) => (
                      <button key={i} onClick={() => setZoomedImg(url)}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-gray-100 hover:border-blue-400 shrink-0 transition-all">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {report.quantity && (
                  <div className="flex justify-between items-center text-[12px] sm:text-[13px]">
                    <span className="text-gray-500">Тоо ширхэг</span>
                    <span className="font-semibold text-gray-900">{report.quantity}</span>
                  </div>
                )}

                {/* Total amount */}
                <div className="bg-blue-50/60 rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Нийт дүн</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400">
                        {report.userAmount.toLocaleString()}¥ × {rate.toLocaleString()}₮ + 5%
                      </p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {Math.round(report.userAmount * rate * 1.05).toLocaleString()}<span className="text-sm text-gray-400">₮</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank info */}
              {order.status === "tolbor_huleej_bn" && adminSettings?.accountNumber && (
                <div className="border-t border-gray-50 px-3.5 sm:px-4 py-2.5">
                  <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider mb-1.5">Шилжүүлэх данс</p>
                  <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-500 truncate">{adminSettings.bank} · {adminSettings.accountName}</p>
                      <p className="font-mono font-bold text-gray-900 text-[14px] sm:text-[15px] tracking-wide">{adminSettings.accountNumber}</p>
                    </div>
                    <button onClick={() => copyText(adminSettings.accountNumber || "")}
                      className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded-md font-semibold transition-colors shrink-0">
                      {copied ? "✓" : "Хуулах"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-20 sm:h-24" />
        </div>
      </div>

      {/* ─── Fixed Bottom Actions ─── */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {/* Agent: Take order button */}
            {isAgent && order.status === "niitlegdsen" && !order.agentId && onTakeOrder && (
              <button onClick={() => onTakeOrder(order.id)} disabled={takeOrderLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-[12px] sm:text-[13px] font-bold disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-1.5">
                {takeOrderLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Судалж эхлэх
                  </>
                )}
              </button>
            )}

            {/* Agent: Submit report button */}
            {isAgent && order.status === "agent_sudlaj_bn" && !hasReport && onReport && (
              <button onClick={onReport}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[12px] sm:text-[13px] font-bold transition-all shadow-md flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Тайлан оруулах
              </button>
            )}

            {/* Payment button */}
            {!isAgent && order.status === "tolbor_huleej_bn" && hasReport && !order.userPaymentVerified && (
              <button onClick={onPaymentPaid} disabled={paymentLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[12px] sm:text-[13px] font-bold disabled:opacity-50 transition-all shadow-md">
                {paymentLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : "Төлбөр төлсөн"}
              </button>
            )}
            {!isAgent && order.status === "tolbor_huleej_bn" && order.userPaymentVerified && (
              <div className="flex-1 py-2.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg text-[11px] sm:text-[12px] text-center font-medium flex items-center justify-center gap-1.5">
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                Баталгаажуулж байна
              </div>
            )}

            {/* Chat button */}
            {!isCancelled && (
              <button onClick={onChat}
                className={`${!isAgent && order.status === "tolbor_huleej_bn" ? "" : "flex-1"} py-2.5 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[12px] sm:text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Чат
              </button>
            )}

            {/* Cancel / Archive */}
            {!isAgent && canCancel && (
              <button onClick={onCancel} disabled={cancelLoading}
                className="py-2.5 px-3 bg-white border border-red-200 hover:border-red-300 hover:bg-red-50 text-red-500 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all disabled:opacity-50">
                {cancelLoading ? "..." : "Устгах"}
              </button>
            )}
            {!isAgent && canArchive && (
              <button onClick={onArchive} disabled={archiveLoading}
                className="py-2.5 px-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all disabled:opacity-50">
                {archiveLoading ? "..." : "Архив"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Image Zoom ─── */}
      {zoomedImg && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4" onClick={() => setZoomedImg(null)}>
          <img src={zoomedImg} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
          <button onClick={() => setZoomedImg(null)}
            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// HomeSection
// ═══════════════════════════════════════
export const HomeSection = () => {
  const { isAuthenticated, isLoading, user: authUser } = useAuthContext();

  const { user, profile, orders: rawOrders, bundleOrders, cargos, agents, agentReports, adminSettings,
    loading, loadData, loadAgentReport, setAgentReports, setOrders } = useUserData({ apiClient, authUser });
  const actions = useUserActions({ apiClient, onReloadData: loadData });

  // Convert bundle orders to regular Order format and merge
  const orders = useMemo(() => {
    const converted: Order[] = bundleOrders.map((bundle: BundleOrder) => {
      const itemNames = bundle.items.slice(0, 2).map((i) => i.productName);
      const remaining = bundle.items.length - 2;
      const productName = remaining > 0
        ? `${itemNames.join(", ")} +${remaining}`
        : itemNames.join(", ") || "Багц захиалга";
      const itemWithImage = bundle.items.find((i) => i.imageUrls && i.imageUrls.length > 0);
      return {
        id: bundle.id,
        userId: bundle.userId,
        agentId: bundle.agentId,
        productName,
        description: bundle.items.map((i) => i.productName).join(", "),
        imageUrls: itemWithImage?.imageUrls || [],
        status: bundle.status,
        userPaymentVerified: bundle.userPaymentVerified || false,
        agentPaymentPaid: bundle.agentPaymentPaid || false,
        trackCode: bundle.trackCode,
        cancelReason: bundle.cancelReason,
        archivedByUser: bundle.archivedByUser || false,
        archivedByAgent: bundle.archivedByAgent || false,
        createdAt: bundle.createdAt,
        updatedAt: bundle.updatedAt,
        user: bundle.user,
        isBundleOrder: true,
        bundleItems: bundle.items,
        reportMode: bundle.reportMode,
        bundleReport: bundle.bundleReport,
        userSnapshot: bundle.userSnapshot,
      } as Order;
    });
    return [...rawOrders, ...converted];
  }, [rawOrders, bundleOrders]);

  // UI state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [dailyLimit, setDailyLimit] = useState<{ todayCount: number; maxPerDay: number; remaining: number } | null>(null);

  // Archive state (lazy-loaded)
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  // Filter state
  const [userFilter, setUserFilter] = useState("all");

  // Agent detail modal (for user viewing agent profiles)
  const [selectedAgent, setSelectedAgent] = useState<PublicAgent | null>(null);

  // Hero images (public, for landing page background)
  const [heroImages, setHeroImages] = useState<string[]>([]);
  useEffect(() => {
    apiClient.getHeroImages().then(setHeroImages).catch(() => {});
  }, []);

  const loadArchive = useCallback(async () => {
    setArchiveLoading(true);
    try {
      const archived = await apiClient.getArchivedOrders();
      setArchivedOrders(archived);
      setArchiveLoaded(true);
    } catch { /* ignore */ }
    finally { setArchiveLoading(false); }
  }, []);

  const fetchDailyLimit = async () => {
    try {
      const result = await apiClient.getDailyLimit();
      setDailyLimit(result);
    } catch { setDailyLimit(null); }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && authUser) {
      loadData();
      fetchDailyLimit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, authUser]);

  // Load agent report when an order is selected
  useEffect(() => {
    if (selectedOrder && ["agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga"].includes(selectedOrder.status)) {
      loadAgentReport(selectedOrder.id);
    }
  }, [selectedOrder, loadAgentReport]);

  const isAgent = user?.role === "agent" || user?.role === "admin";
  const isProfileComplete = useMemo(() => profile?.name && profile?.phone && profile?.cargo, [profile]);
  const hasOrdersLeft = isAgent ? true : (dailyLimit ? dailyLimit.remaining > 0 : true);
  const activeOrders = orders.filter((o) => !o.archivedByUser);

  // Agent: published orders (open, not taken by any agent)
  const publishedOrders = useMemo(() => {
    if (!isAgent) return [];
    return orders.filter((o) => o.status === "niitlegdsen" && !o.agentId);
  }, [orders, isAgent]);

  const [publishedPage, setPublishedPage] = useState(1);
  const publishedTotalPages = Math.ceil(publishedOrders.length / 10);
  const paginatedPublished = useMemo(
    () => publishedOrders.slice((publishedPage - 1) * 10, publishedPage * 10),
    [publishedOrders, publishedPage]
  );

  // Agent: take order (uses orderActionsHook which handles both regular and bundle orders)

  // Agent: delete report
  const [deleteReportLoading, setDeleteReportLoading] = useState(false);
  const handleDeleteReport = async (orderId: string) => {
    setDeleteReportLoading(true);
    try {
      await apiClient.deleteAgentReport(orderId);
      // Update selectedOrder status to agent_sudlaj_bn immediately
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: "agent_sudlaj_bn" as OrderStatus });
      }
      await loadData();
      await loadAgentReport(orderId);
      alert("Тайлан амжилттай устгагдлаа");
    } catch (e) {
      console.error("Failed to delete report:", e);
      alert("Тайлан устгахад алдаа гарлаа");
    } finally {
      setDeleteReportLoading(false);
    }
  };

  // Agent hooks
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportOrder, setReportOrder] = useState<Order | null>(null);
  const [showBundleReportForm, setShowBundleReportForm] = useState(false);
  const [bundleReportOrder, setBundleReportOrder] = useState<Order | null>(null);

  const agentOrdersHook = useAgentOrders({
    orders, user, agentReports, apiClient,
  });

  const agentReportsHook = useAgentReports({
    apiClient, agentReports, setAgentReports,
  });

  const orderActionsHook = useOrderActions({
    apiClient, orders, setOrders, selectedOrder, setSelectedOrder,
    setShowOrderModal: (v: boolean) => { if (!v) setSelectedOrder(null); },
    setOrderFilter: agentOrdersHook.setOrderFilter,
    loadData, user,
  });

  // User filtered orders by status
  const userFilteredOrders = useMemo(() => {
    if (userFilter === "all") return activeOrders;
    if (userFilter === "active") return activeOrders.filter(o => ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn"].includes(o.status));
    if (userFilter === "completed") return activeOrders.filter(o => o.status === "amjilttai_zahialga");
    if (userFilter === "cancelled") return activeOrders.filter(o => o.status === "tsutsalsan_zahialga");
    return activeOrders;
  }, [activeOrders, userFilter]);

  const userActiveCount = activeOrders.filter(o => ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn"].includes(o.status)).length;
  const userCompletedCount = activeOrders.filter(o => o.status === "amjilttai_zahialga").length;
  const userCancelledCount = activeOrders.filter(o => o.status === "tsutsalsan_zahialga").length;

  const handleOrderSuccess = async () => {
    await loadData();
    await fetchDailyLimit();
  };

  const handleCargoChange = async (cargoName: string) => {
    if (!profile) return;
    if (!confirm(`Каргогоо "${cargoName}" болгож солихдоо итгэлтэй байна уу?`)) return;
    try {
      await apiClient.updateProfile({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        cargo: cargoName,
      });
      await loadData();
    } catch {
      alert("Карго сонгоход алдаа гарлаа");
    }
  };

  const handleToggleNotifications = async () => {
    if (!profile) return;
    try {
      await apiClient.updateProfile({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        emailNotificationsEnabled: !(profile.emailNotificationsEnabled ?? true),
      });
      await loadData();
    } catch {
      alert("Мэдэгдэл тохируулахад алдаа гарлаа");
    }
  };

  const handleRequestReward = async () => {
    try {
      await apiClient.createRewardRequest();
      alert("Бонус авах хүсэлт амжилттай илгээгдлээ! Admin баталгаажуулсны дараа таны дансанд шилжинэ.");
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(msg);
    }
  };

  // Get report for selected order (supports bundle orders with embedded report data)
  const selectedOrderReport = useMemo(() => {
    if (!selectedOrder) return null;
    // Try agentReports first (works for regular orders)
    const existingReport = agentReports[selectedOrder.id];
    if (existingReport) return existingReport;
    // For bundle orders, construct report from embedded data
    const isBundleOrder = !!(selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
    if (!isBundleOrder) return existingReport ?? null;
    const bundleReport = (selectedOrder as Order & { bundleReport?: { totalUserAmount: number; paymentLink?: string; additionalImages?: string[]; additionalDescription?: string } }).bundleReport;
    const bundleItems = (selectedOrder as Order & { bundleItems?: { id: string; agentReport?: { userAmount: number; paymentLink?: string; additionalImages?: string[]; additionalDescription?: string; quantity?: number; createdAt?: string } }[] }).bundleItems || [];
    const reportMode = (selectedOrder as Order & { reportMode?: string }).reportMode;
    if (reportMode === "single" && bundleReport) {
      return {
        id: selectedOrder.id + "_bundle",
        orderId: selectedOrder.id,
        userAmount: bundleReport.totalUserAmount,
        paymentLink: bundleReport.paymentLink,
        additionalImages: bundleReport.additionalImages || [],
        additionalDescription: bundleReport.additionalDescription,
        createdAt: selectedOrder.updatedAt,
        updatedAt: selectedOrder.updatedAt,
      } as AgentReport;
    }
    if (reportMode === "per_item") {
      const itemsWithReports = bundleItems.filter(i => i.agentReport);
      if (itemsWithReports.length === 0) return null;
      const totalAmount = itemsWithReports.reduce((sum, i) => sum + (i.agentReport?.userAmount || 0), 0);
      const allImages = itemsWithReports.flatMap(i => i.agentReport?.additionalImages || []);
      const allDescs = itemsWithReports.map(i => i.agentReport?.additionalDescription).filter(Boolean).join("\n");
      return {
        id: selectedOrder.id + "_bundle",
        orderId: selectedOrder.id,
        userAmount: totalAmount,
        additionalImages: allImages,
        additionalDescription: allDescs || undefined,
        createdAt: selectedOrder.updatedAt,
        updatedAt: selectedOrder.updatedAt,
      } as AgentReport;
    }
    return null;
  }, [selectedOrder, agentReports]);

  if (isLoading || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar
        dailyLimit={isAgent ? undefined : dailyLimit}
        selectedCargo={!isAgent && isAuthenticated ? profile?.cargo : undefined}
        cargos={!isAgent && isAuthenticated ? cargos : undefined}
        onCargoChange={!isAgent && isAuthenticated ? handleCargoChange : undefined}
        emailNotificationsEnabled={isAuthenticated ? (profile?.emailNotificationsEnabled ?? true) : undefined}
        onToggleNotifications={isAuthenticated ? handleToggleNotifications : undefined}
        isAgent={isAgent}
        agentPoints={user?.agentPoints ?? 0}
        onRequestReward={handleRequestReward}
      />

      {/* Hero Section */}
      <div className="w-full bg-gradient-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] relative overflow-hidden">
        <BackgroundGradientSection />
        <div className="relative z-10 w-full">
          {isAgent ? (
            /* ── Agent Hero: Published Orders ── */
            <div className="flex flex-col justify-center items-center gap-3 sm:gap-5 w-full px-4 pt-16 sm:pt-24">
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 sm:px-4 sm:py-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] sm:text-sm font-medium text-indigo-700">
                  {profile?.name ? `Сайн байна уу, ${profile.name}!` : "Агент хэсэг"}
                </span>
              </div>
              <h1 className="max-w-4xl text-center">
                <span className="block text-[22px] sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                  Нээлттэй захиалгууд
                </span>
                <span className="block text-[14px] sm:text-lg text-gray-500 mt-2">
                  Хэрэглэгчдийн үүсгэсэн захиалгууд — судалж эхлэхэд бэлэн
                </span>
              </h1>

              {/* Published orders list */}
              <div className="w-full max-w-2xl mt-4 sm:mt-6">
                {publishedOrders.length > 0 ? (
                  <>
                  <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                    {paginatedPublished.map((order) => {
                      const mainImg = order.imageUrls?.[0];
                      const userSnapshot = (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot;
                      return (
                        <button key={order.id} type="button" onClick={() => setSelectedOrder(order)}
                          className="w-full flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
                          {mainImg ? (
                            <img src={mainImg} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] sm:text-sm font-semibold text-gray-800 truncate">{order.productName}</p>
                              {order.audioUrl && (
                                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {(order.user?.profile?.name || userSnapshot?.name) && (
                                <span className="text-[10px] sm:text-[11px] text-blue-500 font-medium truncate">
                                  {order.user?.profile?.name || userSnapshot?.name}
                                </span>
                              )}
                              <span className="text-[10px] sm:text-[11px] text-gray-400">
                                {new Date(order.createdAt).toLocaleDateString("mn-MN", { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 shrink-0">
                            Шинэ
                          </span>
                          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                  {publishedTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button onClick={() => setPublishedPage(Math.max(publishedPage - 1, 1))} disabled={publishedPage === 1}
                        className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-xs text-gray-500">{publishedPage} / {publishedTotalPages}</span>
                      <button onClick={() => setPublishedPage(Math.min(publishedPage + 1, publishedTotalPages))} disabled={publishedPage === publishedTotalPages}
                        className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 font-medium">Нээлттэй захиалга байхгүй</p>
                    <p className="text-sm text-gray-400 mt-1">Шинэ захиалга ирэхэд энд харагдана</p>
                  </div>
                )}
              </div>

              <div className="pb-8 sm:pb-12" />
            </div>
          ) : (
            <HomePageHeroText
              profile={profile}
              isProfileComplete={!!isProfileComplete}
              hasOrdersLeft={hasOrdersLeft}
              dailyLimit={dailyLimit}
              onShowProfile={() => setShowProfileModal(true)}
              onOrderSuccess={handleOrderSuccess}
              heroImages={heroImages}
            />
          )}

          {/* ── Миний захиалгууд (user only) ── */}
          {isAuthenticated && !isAgent && (activeOrders.length > 0 || archiveLoaded) && (
            <div className="w-full max-w-2xl mx-auto px-4 pt-8 sm:pt-10 pb-10 sm:pb-16">
              <OrderListSection
                orders={userFilteredOrders}
                archivedOrders={archivedOrders}
                onOrderClick={setSelectedOrder}
                filterTabs={[
                  { key: "all", label: "Бүгд", count: activeOrders.length },
                  { key: "active", label: "Идэвхтэй", count: userActiveCount },
                  { key: "completed", label: "Амжилттай", count: userCompletedCount },
                  { key: "cancelled", label: "Цуцлагдсан", count: userCancelledCount },
                ]}
                activeFilter={userFilter}
                onFilterChange={setUserFilter}
                title="Миний захиалгууд"
                totalCount={activeOrders.length}
                onLoadArchive={loadArchive}
                archiveLoading={archiveLoading}
                archiveCount={archivedOrders.length}
                emptyText="Захиалга байхгүй"
                agentReports={agentReports}
                exchangeRate={adminSettings?.exchangeRate}
              />
            </div>
          )}

          {!isAuthenticated && <div className="pb-12 sm:pb-16" />}

          {/* Agent orders + Cargos + Agents — inside same bg */}
          {isAuthenticated && (
            <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
              {/* Agent: My Orders */}
              {isAgent && (
                <OrderListSection
                  orders={agentOrdersHook.filteredMyOrders}
                  archivedOrders={archivedOrders}
                  onOrderClick={setSelectedOrder}
                  filterTabs={[
                    { key: "all", label: "Бүгд", count: agentOrdersHook.myOrders.length },
                    { key: "active", label: "Идэвхтэй", count: agentOrdersHook.myActiveCount },
                    { key: "completed", label: "Амжилттай", count: agentOrdersHook.myCompletedCount },
                    { key: "cancelled", label: "Цуцлагдсан", count: agentOrdersHook.myCancelledCount },
                  ]}
                  activeFilter={agentOrdersHook.orderFilter}
                  onFilterChange={(key) => agentOrdersHook.setOrderFilter(key as "all" | "active" | "completed" | "cancelled" | "archived")}
                  title="Миний захиалгууд"
                  totalCount={agentOrdersHook.myOrders.length}
                  showUserName
                  onLoadArchive={loadArchive}
                  archiveLoading={archiveLoading}
                  archiveCount={archivedOrders.length}
                  emptyText="Захиалга байхгүй"
                  emptySubtext="Дээрх нээлттэй захиалгуудаас судалж эхлэнэ үү"
                  agentReports={agentReports}
                  exchangeRate={adminSettings?.exchangeRate}
                />
              )}

              {/* Cargos */}
              {cargos.length > 0 && <CargosSection cargos={cargos} />}

              {/* Top Agents (user only) */}
              {!isAgent && agents.length > 0 && (
                <TopAgentsSection agents={agents} onAgentClick={setSelectedAgent} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* How It Works (hide for agents) */}
      {!isAgent && <HowItWorksSection />}

      {/* Landing sections (visitors only) */}
      {!isAuthenticated && (
        <>
          <PlatformsSection />
          <WhyChooseSection />
          <StatsSection />
          <TestimonialsSection />
          <div id="contact"><CTASection /></div>
        </>
      )}

      {/* ═══ Modals ═══ */}

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {/* Order Detail — Full Screen */}
      {selectedOrder && (
        <OrderDetailFullScreen
          order={selectedOrder}
          report={selectedOrderReport}
          adminSettings={adminSettings}
          onClose={() => setSelectedOrder(null)}
          onChat={() => { setChatOrder(selectedOrder); setShowChatModal(true); setSelectedOrder(null); }}
          onCancel={async () => { await actions.handleCancelOrder(selectedOrder.id); setSelectedOrder(null); }}
          onPaymentPaid={async () => actions.handlePaymentPaid(selectedOrder.id, () => {})}
          onArchive={async () => actions.handleArchiveOrder(selectedOrder.id, () => setSelectedOrder(null))}
          cancelLoading={actions.cancelLoading}
          paymentLoading={actions.paymentLoading}
          archiveLoading={actions.archiveLoading}
          canCancel={actions.canCancelOrder(selectedOrder)}
          canArchive={actions.canArchiveOrder(selectedOrder)}
          isAgent={isAgent}
          onTakeOrder={(orderId) => orderActionsHook.handleUpdateOrderStatus(orderId, "agent_sudlaj_bn" as OrderStatus)}
          takeOrderLoading={orderActionsHook.statusUpdateLoading}
          onDeleteReport={handleDeleteReport}
          deleteReportLoading={deleteReportLoading}
          onReport={isAgent ? () => {
            const isBundleOrder = !!(selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
            if (isBundleOrder) { setBundleReportOrder(selectedOrder); setShowBundleReportForm(true); }
            else { setReportOrder(selectedOrder); setShowReportForm(true); }
            setSelectedOrder(null);
          } : undefined}
          onTrackCodeUpdate={isAgent ? async (orderId, trackCode) => {
            await apiClient.updateTrackCode(orderId, trackCode);
            await loadData();
          } : undefined}
        />
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Профайл бөглөх</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ProfileForm profile={profile} onSuccess={async () => { await loadData(); setShowProfileModal(false); }} />
          </div>
        </div>
      )}

      {showChatModal && chatOrder && (
        <ChatModal order={chatOrder} isOpen={showChatModal} onClose={() => { setChatOrder(null); setShowChatModal(false); }} />
      )}

      {/* Agent Report Form Modal */}
      {isAgent && showReportForm && reportOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Тайлан илгээх</h2>
              <button onClick={() => { setReportOrder(null); setShowReportForm(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors min-h-10 min-w-10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <AgentReportForm order={reportOrder}
                onSuccess={async () => { setReportOrder(null); setShowReportForm(false); await loadData(); alert("Тайлан амжилттай илгээгдлээ"); }}
                onCancel={() => { setReportOrder(null); setShowReportForm(false); }} />
            </div>
          </div>
        </div>
      )}

      {/* Bundle Report Form Modal */}
      {isAgent && showBundleReportForm && bundleReportOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Багц захиалгын тайлан</h2>
              <button onClick={() => { setBundleReportOrder(null); setShowBundleReportForm(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors min-h-10 min-w-10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <BundleReportForm
                bundleOrder={{
                  id: bundleReportOrder.id, userId: bundleReportOrder.userId, agentId: bundleReportOrder.agentId,
                  userSnapshot: (bundleReportOrder as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot || { name: "", phone: "", cargo: "" },
                  items: (bundleReportOrder as Order & { bundleItems?: BundleOrder["items"] }).bundleItems || [],
                  status: bundleReportOrder.status, createdAt: bundleReportOrder.createdAt, updatedAt: bundleReportOrder.updatedAt,
                  reportMode: (bundleReportOrder as Order & { reportMode?: "single" | "per_item" }).reportMode,
                  bundleReport: (bundleReportOrder as Order & { bundleReport?: { totalUserAmount: number; paymentLink?: string; additionalDescription?: string; additionalImages?: string[] } }).bundleReport,
                }}
                onSuccess={async () => { setBundleReportOrder(null); setShowBundleReportForm(false); await loadData(); alert("Багц тайлан амжилттай илгээгдлээ"); }}
                onCancel={() => { setBundleReportOrder(null); setShowBundleReportForm(false); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal (Agent) */}
      {isAgent && (
        <CancelOrderModal
          isOpen={orderActionsHook.showCancelModal}
          cancelReason={orderActionsHook.cancelReason}
          cancelLoading={orderActionsHook.cancelLoading}
          onReasonChange={orderActionsHook.setCancelReason}
          onCancel={() => { orderActionsHook.setShowCancelModal(false); orderActionsHook.setCancelReason(""); }}
          onConfirm={orderActionsHook.handleCancelWithReason}
        />
      )}
    </div>
  );
};
