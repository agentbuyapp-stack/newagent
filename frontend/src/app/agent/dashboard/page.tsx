"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { io, Socket } from "socket.io-client";
import type { Order, BundleOrder } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import { useAgentData, useAgentOrders, useAgentReports, useOrderActions } from "@/hooks";
import { DashboardLoading } from "@/components/shared";
import {
  RewardsSection,
  PublishedOrdersSection,
  MyOrdersSection,
  CargosSection,
  AgentOrderDetailModal,
} from "@/components/agent";

const ChatModal = dynamic(() => import("@/components/ChatModal"), { ssr: false });
const AgentReportForm = dynamic(() => import("@/components/AgentReportForm"), { ssr: false });
const BundleReportForm = dynamic(() => import("@/components/BundleReportForm"), { ssr: false });
const CancelOrderModal = dynamic(() => import("@/components/agent/CancelOrderModal"), { ssr: false });

const COLORS = { primary: "#6366f1", secondary: "#8b5cf6" };

const AgentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function AgentDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();

  const {
    user, orders, rewardRequests, cargos, adminSettings, isApproved,
    loading, error, agentReports, setAgentReports, loadData,
  } = useAgentData({ apiClient, clerkUser });

  const {
    loadAgentReport, isEditingReport, setIsEditingReport,
    editReportAmount, setEditReportAmount, editReportReason, setEditReportReason,
    editReportLoading, handleUpdateReport, calculateUserPaymentAmount,
  } = useAgentReports({ apiClient, agentReports, setAgentReports });

  const {
    publishedOrders, myOrders, archivedOrders, filteredMyOrders, paginatedMyOrders,
    orderFilter, setOrderFilter, myOrdersPage, setMyOrdersPage, myOrdersTotalPages, ITEMS_PER_PAGE,
    myActiveCount, myCompletedCount, myCancelledCount, myArchivedCount,
    latestVoiceMessages,
  } = useAgentOrders({ orders, user, agentReports, apiClient });

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportOrder, setReportOrder] = useState<Order | null>(null);
  const [showBundleReportForm, setShowBundleReportForm] = useState(false);
  const [bundleReportOrder, setBundleReportOrder] = useState<Order | null>(null);
  const [showRewards, setShowRewards] = useState(true);

  const {
    statusUpdateLoading, handleUpdateOrderStatus, archiveLoading, handleArchiveOrder,
    canArchiveOrder, showCancelModal, setShowCancelModal, cancelReason, setCancelReason,
    cancelLoading, openCancelModal, handleCancelWithReason, clearLoading,
    handleClearCancelledOrder, handleClearAllCancelledOrders, handleClearAllArchivedOrders,
    handleSendVoiceMessage,
  } = useOrderActions({
    apiClient, orders, setOrders: () => {}, selectedOrder, setSelectedOrder,
    setShowOrderModal, setOrderFilter, loadData, user,
  });

  // Initial data load
  useEffect(() => {
    if (isLoaded && !clerkUser) router.push("/");
    else if (isLoaded && clerkUser) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, clerkUser, router]);

  // Socket connection
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"], autoConnect: true });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join", user.id));
    socket.on("new-voice-message", () => loadData());
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id, loadData]);

  // Load agent report when modal opens
  useEffect(() => {
    if (showOrderModal && selectedOrder && user?.id) {
      const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
      if (!isBundleOrder && selectedOrder.agentId === user.id && agentReports[selectedOrder.id] === undefined) {
        loadAgentReport(selectedOrder.id);
      }
    }
  }, [showOrderModal, selectedOrder, user?.id, agentReports, loadAgentReport]);

  if (!isLoaded || loading) {
    return <DashboardLoading title="Agent" gradientId="agentGradient"
      primaryColor={COLORS.primary} secondaryColor={COLORS.secondary}
      icon={<AgentIcon className="w-14 h-14 text-white" />} />;
  }
  if (!clerkUser) return null;
  if (error && !user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-red-500 text-base">{error}</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Approval Warning */}
          {user?.role === "agent" && !isApproved && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          )}

          {(user?.role === "admin" || isApproved) && (
            <PublishedOrdersSection
              orders={publishedOrders}
              onViewOrder={(order) => { setSelectedOrder(order); setShowOrderModal(true); }}
              onTakeOrder={(orderId) => handleUpdateOrderStatus(orderId, "agent_sudlaj_bn")}
            />
          )}

          <MyOrdersSection
            totalOrders={myOrders.length} filteredOrders={filteredMyOrders} paginatedOrders={paginatedMyOrders}
            agentReports={agentReports} exchangeRate={adminSettings?.exchangeRate || 1}
            orderFilter={orderFilter} setOrderFilter={setOrderFilter}
            activeCount={myActiveCount} completedCount={myCompletedCount}
            cancelledCount={myCancelledCount} archivedCount={myArchivedCount}
            currentPage={myOrdersPage} totalPages={myOrdersTotalPages} itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setMyOrdersPage}
            onViewOrder={(order) => { setSelectedOrder(order); setShowOrderModal(true); }}
            onOpenChat={(order) => { setChatOrder(order); setShowChatModal(true); }}
            onOpenReportForm={(order, isBundleOrder) => {
              if (isBundleOrder) { setBundleReportOrder(order); setShowBundleReportForm(true); }
              else { setReportOrder(order); setShowReportForm(true); }
            }}
            onClearOrder={handleClearCancelledOrder} onArchiveOrder={handleArchiveOrder}
            onClearAllCancelled={() => handleClearAllCancelledOrders(filteredMyOrders)}
            onClearAllArchived={() => handleClearAllArchivedOrders(archivedOrders)}
            canArchiveOrder={canArchiveOrder} calculateUserPaymentAmount={calculateUserPaymentAmount}
            onSendVoiceMessage={handleSendVoiceMessage} latestVoiceMessages={latestVoiceMessages}
            currentUserId={user?.id} archiveLoading={archiveLoading} clearLoading={clearLoading}
          />

          {user?.role === "agent" && (
            <RewardsSection rewardRequests={rewardRequests} showRewards={showRewards}
              onToggle={() => setShowRewards(!showRewards)} />
          )}

          <CargosSection cargos={cargos} />
        </div>
      </main>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <AgentOrderDetailModal
          order={selectedOrder} user={user} myOrders={myOrders} agentReports={agentReports}
          adminSettings={adminSettings} isEditingReport={isEditingReport} setIsEditingReport={setIsEditingReport}
          editReportAmount={editReportAmount} setEditReportAmount={setEditReportAmount}
          editReportReason={editReportReason} setEditReportReason={setEditReportReason}
          editReportLoading={editReportLoading} handleUpdateReport={handleUpdateReport}
          calculateUserPaymentAmount={calculateUserPaymentAmount} loadAgentReport={loadAgentReport}
          apiClient={apiClient} loadData={loadData} statusUpdateLoading={statusUpdateLoading}
          handleUpdateOrderStatus={handleUpdateOrderStatus} archiveLoading={archiveLoading}
          handleArchiveOrder={handleArchiveOrder} canArchiveOrder={canArchiveOrder}
          openCancelModal={openCancelModal}
          onOpenChat={() => { setChatOrder(selectedOrder); setShowChatModal(true); }}
          onOpenReportForm={(isBundleOrder) => {
            if (isBundleOrder) { setBundleReportOrder(selectedOrder); setShowBundleReportForm(true); }
            else { setReportOrder(selectedOrder); setShowReportForm(true); }
          }}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {showChatModal && chatOrder && (
        <ChatModal order={chatOrder} isOpen={showChatModal}
          onClose={() => { setChatOrder(null); setShowChatModal(false); }} />
      )}

      {/* Agent Report Form Modal */}
      {showReportForm && reportOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-xl border border-gray-200 dark:border-slate-700 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Тайлан илгээх</h2>
              <button onClick={() => { setReportOrder(null); setShowReportForm(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors min-h-10 min-w-10">
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
      {showBundleReportForm && bundleReportOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-none sm:rounded-xl border border-gray-200 dark:border-slate-700 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Багц захиалгын тайлан</h2>
              <button onClick={() => { setBundleReportOrder(null); setShowBundleReportForm(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors min-h-10 min-w-10">
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

      <CancelOrderModal isOpen={showCancelModal} cancelReason={cancelReason} cancelLoading={cancelLoading}
        onReasonChange={setCancelReason} onCancel={() => { setShowCancelModal(false); setCancelReason(""); }}
        onConfirm={handleCancelWithReason} />
    </div>
  );
}
