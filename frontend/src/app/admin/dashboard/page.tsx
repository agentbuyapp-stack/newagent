"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import type { User } from "@/lib/api";
import { apiClient } from "@/lib/api";
import { useAdminData, useAdminActions } from "@/hooks";
import { DashboardLoading } from "@/components/shared";
import {
  AgentsTab,
  OrdersTab,
  CargosTab,
  SettingsTab,
  RewardsTab,
} from "@/components/admin";
import type { OrderFilterType } from "@/components/admin";
import AgentProfileEditor from "@/components/admin/AgentProfileEditor";
import AgentRankingManager from "@/components/admin/AgentRankingManager";
import KnowledgeBaseTab from "@/components/admin/KnowledgeBaseTab";

type ActiveTabType =
  | "agents"
  | "orders"
  | "cargos"
  | "settings"
  | "rewards"
  | "ranking"
  | "knowledge";

const COLORS = { primary: "#6366f1", secondary: "#8b5cf6" };

const AdminIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const SIDEBAR_ICONS: Record<ActiveTabType, React.ReactNode> = {
  agents: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  orders: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  cargos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  rewards: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ranking: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  knowledge: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: authUser, isLoading, logout } = useAuthContext();
  const isLoaded = !isLoading;

  const [activeTab, setActiveTab] = useState<ActiveTabType>("agents");
  const [orderFilter, setOrderFilter] = useState<OrderFilterType>("pending_payment");
  const [editingAgent, setEditingAgent] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    user, agents, orders, cargos, adminSettings, agentReports,
    rewardRequests, specialties,
    setAgents, setAdminSettings,
    settingsFormData, setSettingsFormData,
    loading, error, loadData,
  } = useAdminData({ apiClient, authUser });

  const {
    addingAgent, savingSettings, settingsSaved, uploadingCargoImage,
    handleAddAgent, handleApproveAgent,
    handleVerifyPayment, handleCancelPayment, handleAgentPayment,
    handleCreateCargo, handleUpdateCargo, handleDeleteCargo, handleCargoImageUpload,
    handleSaveSettings, handleApproveReward, handleRejectReward,
  } = useAdminActions({ apiClient, loadData, setAdminSettings });

  useEffect(() => {
    if (isLoaded && !authUser) router.push("/admin");
    else if (isLoaded && authUser) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, authUser, router]);

  const handleSignOut = async () => {
    if (confirm("Та системээс гарахдаа итгэлтэй байна уу?")) {
      await logout();
      router.push("/");
    }
  };

  if (!isLoaded || loading) {
    return (
      <DashboardLoading
        title="Админ"
        gradientId="adminGradient"
        primaryColor={COLORS.primary}
        secondaryColor={COLORS.secondary}
        icon={<AdminIcon className="w-14 h-14 text-white" />}
      />
    );
  }
  if (!authUser) return null;
  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-red-500 text-base">{error}</div>
      </div>
    );
  }
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-red-500 text-base">Та admin эрхгүй байна</div>
      </div>
    );
  }

  const tabs: { key: ActiveTabType; label: string; count?: number }[] = [
    { key: "agents", label: "Agents", count: agents.length },
    { key: "orders", label: "Захиалгууд", count: orders.length },
    { key: "cargos", label: "Cargos", count: cargos.length },
    { key: "settings", label: "Тохиргоо" },
    { key: "rewards", label: "Урамшуулал", count: rewardRequests.length },
    { key: "ranking", label: "Топ 10" },
    { key: "knowledge", label: "Мэдлэгийн сан" },
  ];

  const stats = [
    { label: "Agents", value: agents.length, color: "from-blue-500 to-cyan-400" },
    { label: "Захиалга", value: orders.length, color: "from-violet-500 to-purple-400" },
    { label: "Карго", value: cargos.length, color: "from-amber-500 to-orange-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <AdminIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AgentBuy</h1>
                <p className="text-xs text-indigo-200/70">Админ самбар</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-indigo-50 text-indigo-700 border-l-2 border-indigo-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={activeTab === tab.key ? "text-indigo-600" : "text-gray-400"}>
                  {SIDEBAR_ICONS[tab.key]}
                </span>
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                    activeTab === tab.key
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-200">
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Гарах</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <AdminIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Админ</span>
          </div>
        </header>

        {/* Stats bar */}
        <div className="hidden lg:flex items-center gap-4 px-6 pt-6 pb-2">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 min-w-[140px] shadow-sm">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                <span className="text-sm font-bold text-white">{s.value}</span>
              </div>
              <span className="text-sm text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>

        <main className="flex-1 p-4 lg:px-6 lg:pb-6 lg:pt-4 overflow-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 min-h-full shadow-sm">
            {activeTab === "agents" && (
              <AgentsTab agents={agents} addingAgent={addingAgent}
                onAddAgent={handleAddAgent} onApproveAgent={handleApproveAgent} onEditAgent={setEditingAgent} />
            )}
            {activeTab === "orders" && (
              <OrdersTab orders={orders} adminSettings={adminSettings} agentReports={agentReports}
                orderFilter={orderFilter} onOrderFilterChange={setOrderFilter}
                onVerifyPayment={handleVerifyPayment} onCancelPayment={handleCancelPayment} onAgentPayment={handleAgentPayment} />
            )}
            {activeTab === "cargos" && (
              <CargosTab cargos={cargos} uploadingCargoImage={uploadingCargoImage}
                onCreateCargo={handleCreateCargo} onUpdateCargo={handleUpdateCargo}
                onDeleteCargo={handleDeleteCargo} onCargoImageUpload={handleCargoImageUpload} />
            )}
            {activeTab === "settings" && (
              <SettingsTab adminSettings={adminSettings} settingsFormData={settingsFormData}
                onSettingsFormChange={setSettingsFormData} savingSettings={savingSettings}
                settingsSaved={settingsSaved} onSaveSettings={handleSaveSettings} apiClient={apiClient} />
            )}
            {activeTab === "rewards" && (
              <RewardsTab rewardRequests={rewardRequests}
                onApproveReward={handleApproveReward} onRejectReward={handleRejectReward} />
            )}
            {activeTab === "ranking" && (
              <AgentRankingManager agents={agents.filter((a) => a.isApproved)}
                onUpdate={(upd) => setAgents((prev) => prev.map((a) => upd.find((u) => u.id === a.id) || a))} />
            )}
            {activeTab === "knowledge" && <KnowledgeBaseTab />}
          </div>
        </main>
      </div>

      {editingAgent && (
        <AgentProfileEditor agent={editingAgent} specialties={specialties}
          onUpdate={(upd) => setAgents((prev) => prev.map((a) => (a.id === upd.id ? upd : a)))}
          onClose={() => setEditingAgent(null)} />
      )}
    </div>
  );
}
