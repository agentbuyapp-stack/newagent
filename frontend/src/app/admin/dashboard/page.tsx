"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import type { User } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
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
import SpecialtyManager from "@/components/admin/SpecialtyManager";
import CardManager from "@/components/admin/CardManager";
import BannerManager from "@/components/admin/BannerManager";
import ShowcaseManager from "@/components/admin/ShowcaseManager";

type ActiveTabType =
  | "agents"
  | "orders"
  | "cargos"
  | "settings"
  | "rewards"
  | "ranking"
  | "specialties"
  | "cards"
  | "banners"
  | "showcase";

const COLORS = { primary: "#6366f1", secondary: "#8b5cf6" };

const AdminIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

const SIDEBAR_ICONS: Record<ActiveTabType, React.ReactNode> = {
  agents: (
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    </svg>
  ),
  orders: (
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
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  cargos: (
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
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  settings: (
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  rewards: (
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
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  ranking: (
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  specialties: (
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
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  ),
  cards: (
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
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  ),
  banners: (
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
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  showcase: (
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
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const apiClient = useApiClient();

  const [activeTab, setActiveTab] = useState<ActiveTabType>("agents");
  const [orderFilter, setOrderFilter] =
    useState<OrderFilterType>("pending_payment");
  const [editingAgent, setEditingAgent] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    user,
    agents,
    orders,
    cargos,
    adminSettings,
    agentReports,
    rewardRequests,
    specialties,
    setAgents,
    setAdminSettings,
    setSpecialties,
    settingsFormData,
    setSettingsFormData,
    loading,
    error,
    loadData,
  } = useAdminData({ apiClient, clerkUser });

  const {
    addingAgent,
    savingSettings,
    settingsSaved,
    uploadingCargoImage,
    handleAddAgent,
    handleApproveAgent,
    handleVerifyPayment,
    handleCancelPayment,
    handleAgentPayment,
    handleCreateCargo,
    handleUpdateCargo,
    handleDeleteCargo,
    handleCargoImageUpload,
    handleSaveSettings,
    handleApproveReward,
    handleRejectReward,
    handleRecalculateStats,
  } = useAdminActions({ apiClient, loadData, setAdminSettings });

  useEffect(() => {
    if (isLoaded && !clerkUser) router.push("/");
    else if (isLoaded && clerkUser) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, clerkUser, router]);

  const handleSignOut = async () => {
    if (confirm("Та системээс гарахдаа итгэлтэй байна уу?")) {
      await signOut();
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
  if (!clerkUser) return null;
  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-red-500 text-base">{error}</div>
      </div>
    );
  }
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-red-500 text-base">Та admin эрхгүй байна</div>
      </div>
    );
  }

  const tabs: {
    key: ActiveTabType;
    label: string;
    count?: number;
    amber?: boolean;
  }[] = [
    { key: "agents", label: "Agents", count: agents.length },
    { key: "orders", label: "Захиалгууд", count: orders.length },
    { key: "cargos", label: "Cargos", count: cargos.length },
    { key: "settings", label: "Тохиргоо" },
    { key: "rewards", label: "Урамшуулал", count: rewardRequests.length },
    { key: "ranking", label: "Топ 10" },
    { key: "specialties", label: "Мэргэжил", count: specialties.length },
    { key: "cards", label: "Карт", amber: true },
    { key: "banners", label: "Баннер" },
    { key: "showcase", label: "Бүтээгдэхүүн" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <AdminIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Админ
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Удирдлагын самбар
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? tab.amber
                      ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span
                  className={
                    activeTab === tab.key
                      ? tab.amber
                        ? "text-amber-500"
                        : "text-indigo-500"
                      : "text-gray-400 dark:text-slate-500"
                  }
                >
                  {SIDEBAR_ICONS[tab.key]}
                </span>
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.key
                        ? tab.amber
                          ? "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200"
                          : "bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200"
                        : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <div className="p-3 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Гарах</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <AdminIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Админ
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 sm:p-6 min-h-full">
            {activeTab === "agents" && (
              <AgentsTab
                agents={agents}
                addingAgent={addingAgent}
                onAddAgent={handleAddAgent}
                onApproveAgent={handleApproveAgent}
                onEditAgent={setEditingAgent}
              />
            )}
            {activeTab === "orders" && (
              <OrdersTab
                orders={orders}
                adminSettings={adminSettings}
                agentReports={agentReports}
                orderFilter={orderFilter}
                onOrderFilterChange={setOrderFilter}
                onVerifyPayment={handleVerifyPayment}
                onCancelPayment={handleCancelPayment}
                onAgentPayment={handleAgentPayment}
              />
            )}
            {activeTab === "cargos" && (
              <CargosTab
                cargos={cargos}
                uploadingCargoImage={uploadingCargoImage}
                onCreateCargo={handleCreateCargo}
                onUpdateCargo={handleUpdateCargo}
                onDeleteCargo={handleDeleteCargo}
                onCargoImageUpload={handleCargoImageUpload}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab
                adminSettings={adminSettings}
                settingsFormData={settingsFormData}
                onSettingsFormChange={setSettingsFormData}
                savingSettings={savingSettings}
                settingsSaved={settingsSaved}
                onSaveSettings={handleSaveSettings}
                onRecalculateStats={handleRecalculateStats}
              />
            )}
            {activeTab === "rewards" && (
              <RewardsTab
                rewardRequests={rewardRequests}
                onApproveReward={handleApproveReward}
                onRejectReward={handleRejectReward}
              />
            )}
            {activeTab === "ranking" && (
              <AgentRankingManager
                agents={agents.filter((a) => a.isApproved)}
                onUpdate={(upd) =>
                  setAgents((prev) =>
                    prev.map((a) => upd.find((u) => u.id === a.id) || a),
                  )
                }
              />
            )}
            {activeTab === "specialties" && (
              <SpecialtyManager onSpecialtiesChange={setSpecialties} />
            )}
            {activeTab === "cards" && <CardManager />}
            {activeTab === "banners" && <BannerManager />}
            {activeTab === "showcase" && <ShowcaseManager />}
          </div>
        </main>
      </div>

      {editingAgent && (
        <AgentProfileEditor
          agent={editingAgent}
          specialties={specialties}
          onUpdate={(upd) =>
            setAgents((prev) => prev.map((a) => (a.id === upd.id ? upd : a)))
          }
          onClose={() => setEditingAgent(null)}
        />
      )}
    </div>
  );
}
