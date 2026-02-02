/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import type { Order, BundleOrder, PublicAgent } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import { useUserData, useUserActions } from "@/hooks";
import { DashboardLoading } from "@/components/shared";
import NewOrderForm from "@/components/dashboard/NewOrderForm";
import OrderHistorySection from "@/components/dashboard/OrderHistorySection";
import ProfileForm from "@/components/ProfileForm";
import { CargosSection, TopAgentsSection, OrderDetailModal, AgentDetailModal } from "@/components/user";
import BannerDisplay from "@/components/BannerDisplay";
import ProductShowcaseDisplay from "@/components/ProductShowcaseDisplay";

const ChatModal = dynamic(() => import("@/components/ChatModal"), { ssr: false });
const BundleOrderDetailModal = dynamic(() => import("@/components/dashboard/BundleOrderDetailModal"), { ssr: false });

const COLORS = { primary: "#0b4ce5", secondary: "#4a90e2" };

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function UserDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();

  const { user, profile, orders, bundleOrders, cargos, agents, agentReports, adminSettings,
    loading, error, loadData, loadAgentReport } = useUserData({ apiClient, clerkUser });

  const actions = useUserActions({ apiClient, onReloadData: loadData });

  // UI state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNewOrderSection, setShowNewOrderSection] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedBundleOrder, setSelectedBundleOrder] = useState<BundleOrder | null>(null);
  const [showBundleOrderModal, setShowBundleOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | BundleOrder | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<PublicAgent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  useEffect(() => {
    if (isLoaded && !clerkUser) router.push("/");
    else if (isLoaded && clerkUser) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, clerkUser, router]);

  useEffect(() => {
    if (showOrderModal && selectedOrder &&
      ["agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga"].includes(selectedOrder.status)) {
      loadAgentReport(selectedOrder.id);
    }
  }, [showOrderModal, selectedOrder, loadAgentReport]);

  const isProfileComplete = useMemo(() => profile?.name && profile?.phone && profile?.cargo, [profile]);

  if (!isLoaded || loading) {
    return <DashboardLoading title="Хэрэглэгч" gradientId="userGradient"
      primaryColor={COLORS.primary} secondaryColor={COLORS.secondary}
      icon={<UserIcon className="w-14 h-14 text-white" />} />;
  }
  if (!clerkUser) return null;
  if (error && !user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-red-500 text-base">{error}</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* New Order Box */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-100 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm relative z-10">
            <div className="flex items-center justify-between cursor-pointer"
              onClick={() => isProfileComplete ? setShowNewOrderSection(!showNewOrderSection) : setShowProfileModal(true)}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Шинэ захиалга үүсгэх</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Бараа захиалах</p>
                </div>
              </div>
              {isProfileComplete && (
                <svg className={`w-5 h-5 text-gray-500 dark:text-slate-400 transition-transform ${showNewOrderSection ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
            {isProfileComplete && <div className={`mt-4 ${showNewOrderSection ? "" : "hidden"}`}>
              <NewOrderForm onSuccess={loadData} />
            </div>}
          </div>

          <OrderHistorySection
            orders={orders.filter((o) => !o.archivedByUser)} bundleOrders={bundleOrders}
            archivedOrders={orders.filter((o) => o.archivedByUser)}
            onSelectOrder={(o) => { setSelectedOrder(o); setShowOrderModal(true); }}
            onSelectBundleOrder={(o) => { setSelectedBundleOrder(o); setShowBundleOrderModal(true); }}
            onOpenChat={(o) => { setChatOrder(o); setShowChatModal(true); }}
            onOpenBundleChat={(o) => { setChatOrder(o); setShowChatModal(true); }}
            onViewReport={(o) => { setSelectedOrder(o); setShowOrderModal(true); }}
            onViewBundleReport={(o) => { setSelectedBundleOrder(o); setShowBundleOrderModal(true); }}
            onDeleteOrder={actions.handleDeleteOrder} onDeleteBundleOrder={actions.handleDeleteBundleOrder}
            onArchiveOrder={(o) => actions.handleArchiveOrder(o.id)} onReload={loadData}
            deleteLoading={actions.deleteLoading} archiveLoading={actions.archiveLoading}
            onSendVoiceMessage={actions.handleSendVoiceMessage} currentUserId={user?.id} />

          <CargosSection cargos={cargos} />
          <TopAgentsSection agents={agents} onAgentClick={(a) => { setSelectedAgent(a); setShowAgentModal(true); }} />
          <ProductShowcaseDisplay />
          <BannerDisplay className="mt-4" />
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Профайл бөглөх</h2>
              <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                <svg className="w-5 h-5 text-gray-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Захиалга үүсгэхийн тулд эхлээд профайлаа бүрэн бөглөнө үү.</p>
            <ProfileForm profile={profile} onSuccess={async () => { await loadData(); setShowProfileModal(false); }} />
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <OrderDetailModal order={selectedOrder} agentReport={agentReports[selectedOrder.id]} adminSettings={adminSettings}
          onClose={() => setShowOrderModal(false)}
          onOpenChat={(o) => { setChatOrder(o); setShowChatModal(true); }}
          onCancelOrder={async (id) => { await actions.handleCancelOrder(id); setShowOrderModal(false); }}
          onPaymentPaid={async (id) => actions.handlePaymentPaid(id, (i) => {
            if (selectedOrder?.id === i) setSelectedOrder({ ...selectedOrder, userPaymentVerified: true });
          })}
          onArchiveOrder={async (id) => actions.handleArchiveOrder(id, () => setShowOrderModal(false))}
          cancelLoading={actions.cancelLoading} paymentLoading={actions.paymentLoading}
          archiveLoading={actions.archiveLoading} canCancelOrder={actions.canCancelOrder} canArchiveOrder={actions.canArchiveOrder} />
      )}

      {showChatModal && chatOrder && (
        <ChatModal order={chatOrder} isOpen={showChatModal} onClose={() => { setChatOrder(null); setShowChatModal(false); }} />
      )}

      {showBundleOrderModal && selectedBundleOrder && (
        <BundleOrderDetailModal bundleOrder={selectedBundleOrder}
          onClose={() => { setSelectedBundleOrder(null); setShowBundleOrderModal(false); }}
          exchangeRate={adminSettings?.exchangeRate || 1} adminSettings={adminSettings || undefined}
          onConfirmPayment={(id) => actions.handleConfirmBundlePayment(id, selectedBundleOrder, setSelectedBundleOrder)}
          paymentLoading={actions.paymentLoading}
          onCancelOrder={(id) => actions.handleCancelBundleOrder(id, selectedBundleOrder, setSelectedBundleOrder,
            () => { setSelectedBundleOrder(null); setShowBundleOrderModal(false); })}
          cancelLoading={actions.cancelLoading}
          onRemoveItem={(bid, iid) => actions.handleRemoveItemFromBundle(bid, iid, setSelectedBundleOrder)}
          removeItemLoading={actions.removeItemLoading}
          onOpenChat={(o) => { setSelectedBundleOrder(null); setShowBundleOrderModal(false); setChatOrder(o); setShowChatModal(true); }} />
      )}

      {showAgentModal && selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => { setSelectedAgent(null); setShowAgentModal(false); }} />
      )}
    </div>
  );
}
