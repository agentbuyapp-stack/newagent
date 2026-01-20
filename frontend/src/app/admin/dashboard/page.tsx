"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { type User, type Order, type Cargo, type AdminSettings, type AdminSettingsData, type AgentReport, type RewardRequest } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"agents" | "orders" | "cargos" | "settings" | "rewards">("agents");
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [orderFilter, setOrderFilter] = useState<"active" | "completed">("active");
  const [showCargoForm, setShowCargoForm] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [cargoFormData, setCargoFormData] = useState({ name: "", description: "" });
  const [agentReports, setAgentReports] = useState<Record<string, AgentReport | null>>({});
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [settingsFormData, setSettingsFormData] = useState<AdminSettingsData>({
    accountNumber: "",
    accountName: "",
    bank: "",
    exchangeRate: 1,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [addingAgent, setAddingAgent] = useState(false);

  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/");
      return;
    }
    if (isLoaded && clerkUser) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, clerkUser, router]);

  const loadData = async (includeRewards = true) => {
    if (!clerkUser) return;

    try {
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      if (!email) {
        setError("Имэйл олдсонгүй");
        setLoading(false);
        return;
      }

      try {
        const userData = await apiClient.getMe();
        setUser(userData);

        if (userData.role !== "admin") {
          setError("Та admin эрхгүй байна");
          setLoading(false);
          return;
        }

        // Load agents, orders, cargos, admin settings, and reward requests
        try {
          const promises: Promise<unknown>[] = [
            apiClient.getAgents(),
            apiClient.getAdminOrders(),
            apiClient.getCargos(),
            apiClient.getAdminSettings(),
          ];

          if (includeRewards) {
            promises.push(apiClient.getRewardRequests());
          }

          const results = await Promise.all(promises);
          const [agentsData, ordersData, cargosData, settingsData, rewardRequestsData] = results as [User[], Order[], Cargo[], AdminSettings, RewardRequest[] | undefined];

          // Debug: Log agents for production debugging
          console.log("[DEBUG] Admin Dashboard: Loaded agents:", agentsData.length);
          console.log("[DEBUG] Agents data:", agentsData.map((a: User) => ({
            id: a.id,
            email: a.email,
            role: a.role,
            isApproved: a.isApproved,
            hasProfile: !!a.profile,
          })));

          setAgents(agentsData);
          setOrders(ordersData);
          setCargos(cargosData);
          setAdminSettings(settingsData);
          if (includeRewards && rewardRequestsData) {
            setRewardRequests(rewardRequestsData);
          }
          setSettingsFormData({
            accountNumber: settingsData.accountNumber || "",
            accountName: settingsData.accountName || "",
            bank: settingsData.bank || "",
            exchangeRate: settingsData.exchangeRate || 1,
          });

          // Load agent reports for orders
          const reports: Record<string, AgentReport | null> = {};
          for (const order of ordersData) {
            if (order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn" || order.status === "amjilttai_zahialga") {
              try {
                const report = await apiClient.getAgentReport(order.id);
                reports[order.id] = report;
              } catch {
                reports[order.id] = null;
              }
            }
          }
          setAgentReports(reports);
        } catch (fetchErr: unknown) {
          console.error("Error fetching data:", fetchErr);
          const errorMessage = fetchErr instanceof Error ? fetchErr.message : "Мэдээлэл татахад алдаа гарлаа";
          setError(errorMessage);
          // Set empty arrays on error
          setAgents([]);
          setOrders([]);
          setCargos([]);
        }
      } catch (e: unknown) {
        console.error("Error in loadData:", e);
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        setError(errorMessage);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProfileSuccess = async () => {
    await loadData();
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentEmail.trim()) {
      alert("Email оруулах шаардлагатай");
      return;
    }

    setAddingAgent(true);
    try {
      await apiClient.addAgent(newAgentEmail.trim());
      setNewAgentEmail("");
      await loadData();
      alert("Agent амжилттай нэмэгдлээ!");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Agent нэмэхэд алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setAddingAgent(false);
    }
  };

  const handleApproveAgent = async (agentId: string, approved: boolean) => {
    try {
      console.log(`[DEBUG] Admin Dashboard: Approving agent ${agentId} with approved=${approved}`);
      const updatedAgent = await apiClient.approveAgent(agentId, approved);
      console.log(`[DEBUG] Admin Dashboard: Agent updated:`, updatedAgent);
      await loadData();
      alert(`Agent ${approved ? "батлагдлаа" : "цуцлагдлаа"}`);
    } catch (e: unknown) {
      console.error(`[DEBUG] Admin Dashboard: Error approving agent:`, e);
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    try {
      await apiClient.verifyUserPayment(orderId);
      await loadData(); // Reload data to get updated order status
      alert("User төлбөр батлагдлаа");
      // Don't change orderFilter - keep it on current tab so user can see the update
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handleAgentPayment = async (orderId: string) => {
    try {
      await apiClient.markAgentPaymentPaid(orderId);
      await loadData();
      setOrderFilter("completed"); // Switch to completed tab after payment
      alert("Agent төлбөр төлөгдсөн гэж тэмдэглэгдлээ. Agent-ийн оноо нэмэгдлээ.");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      if (errorMessage.includes("no assigned agent")) {
        alert("Энэ захиалгад agent томилогдоогүй байна. Эхлээд agent захиалгыг авсан эсэхийг шалгана уу.");
      } else {
        alert(errorMessage);
      }
    }
  };

  const handleCreateCargo = async () => {
    try {
      if (!cargoFormData.name.trim()) {
        alert("Cargo нэр оруулах шаардлагатай");
        return;
      }
      await apiClient.createCargo(cargoFormData);
      setCargoFormData({ name: "", description: "" });
      setShowCargoForm(false);
      await loadData();
      alert("Cargo амжилттай үүслээ");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handleUpdateCargo = async () => {
    if (!editingCargo) return;
    try {
      await apiClient.updateCargo(editingCargo.id, cargoFormData);
      setEditingCargo(null);
      setCargoFormData({ name: "", description: "" });
      await loadData();
      alert("Cargo амжилттай шинэчлэгдлээ");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handleDeleteCargo = async (cargoId: string) => {
    if (!confirm("Та энэ cargo-г устгахдаа итгэлтэй байна уу?")) {
      return;
    }
    try {
      await apiClient.deleteCargo(cargoId);
      await loadData();
      alert("Cargo амжилттай устгагдлаа");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updatedSettings = await apiClient.updateAdminSettings(settingsFormData);
      setAdminSettings(updatedSettings);
      setSettingsSaved(true);
      setIsEditingSettings(false);
      setTimeout(() => {
        setSettingsSaved(false);
      }, 3000);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEditSettings = () => {
    setIsEditingSettings(true);
    setSettingsSaved(false);
  };

  // All agents are approved since admin adds them directly
  const approvedAgents = agents;

  // Debug: Log agents for production debugging
  console.log("[DEBUG] Admin Dashboard: Agents:", {
    total: agents.length,
    agents: approvedAgents.map((a: User) => ({ id: a.id, email: a.email, isApproved: a.isApproved })),
  });

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-base text-gray-600">Ачааллаж байна...</div>
      </div>
    );
  }

  if (!clerkUser) {
    return null;
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-base">{error}</div>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-base">Та admin эрхгүй байна</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">


      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">



          {/* Tabs */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex gap-1 sm:gap-2 border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("agents")}
                className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${activeTab === "agents"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Agents ({agents.length})
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${activeTab === "orders"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Захиалгууд ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab("cargos")}
                className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${activeTab === "cargos"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Cargos ({cargos.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${activeTab === "settings"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Тохиргоо
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${activeTab === "rewards"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Урамшуулал ({rewardRequests.length})
              </button>
            </div>

            {/* Agents Tab */}
            {activeTab === "agents" && (
              <div className="space-y-4">
                {/* Add New Agent Form */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Шинэ Agent нэмэх</h3>
                  <form onSubmit={handleAddAgent} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={newAgentEmail}
                      onChange={(e) => setNewAgentEmail(e.target.value)}
                      placeholder="Agent email оруулах (жишээ: agent@example.com)"
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-11"
                      disabled={addingAgent}
                    />
                    <button
                      type="submit"
                      disabled={addingAgent || !newAgentEmail.trim()}
                      className="px-6 py-2.5 text-sm sm:text-base text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-11 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {addingAgent ? "Нэмж байна..." : "Agent нэмэх"}
                    </button>
                  </form>
                  <p className="text-xs text-gray-600 mt-2">
                    Email оруулахад тухайн email-д agent эрх өгөгдөнө. Хэрэв user байхгүй бол шинээр үүсгэнэ.
                  </p>
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-4 sm:mt-6">Батлагдсан Agents</h3>
                {approvedAgents.length > 0 ? (
                  <div className="space-y-3">
                    {approvedAgents.map((agent) => (
                      <div key={agent.id} className="border border-gray-200 rounded-xl p-4 bg-green-50">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{agent.profile?.name || agent.email}</p>
                            <p className="text-sm text-gray-600">{agent.email}</p>
                            <p className="text-sm text-gray-600 capitalize">
                              Эрх: {agent.role === "agent" && agent.isApproved
                                ? `${agent.role}`
                                : agent.role === "user" && agent.isApproved
                                  ? `${agent.role}`
                                  : agent.role}
                            </p>
                            {agent.profile?.phone && (
                              <p className="text-sm text-gray-600">Утас: {agent.profile.phone}</p>
                            )}
                            <p className="text-xs text-green-800 mt-2">Батлагдсан</p>
                          </div>
                          <button
                            onClick={() => handleApproveAgent(agent.id, false)}
                            className="px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-10"
                          >
                            Цуцлах
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                    Батлагдсан agent байхгүй байна.
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Захиалгууд</h3>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-10 ${orderFilter === "active"
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    Идэвхтэй
                  </button>
                  <button
                    onClick={() => setOrderFilter("completed")}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-10 ${orderFilter === "completed"
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    Идэвхгүй
                  </button>
                </div>

                {(() => {
                  const filteredOrders = orders.filter((order) => {
                    if (orderFilter === "active") {
                      // Идэвхтэй: niitlegdsen, agent_sudlaj_bn, tolbor_huleej_bn
                      return order.status === "niitlegdsen" || order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn";
                    }
                    if (orderFilter === "completed") {
                      // Идэвхгүй: amjilttai_zahialga, tsutsalsan_zahialga
                      return order.status === "amjilttai_zahialga" || order.status === "tsutsalsan_zahialga";
                    }
                    return true;
                  }).sort((a, b) => {
                    // Sort: userPaymentVerified: true захиалгуудыг эхэнд харуулах
                    if (a.userPaymentVerified && !b.userPaymentVerified) return -1;
                    if (!a.userPaymentVerified && b.userPaymentVerified) return 1;
                    return 0;
                  });

                  return filteredOrders.length > 0 ? (
                    <div className="space-y-2">
                      {filteredOrders.map((order) => {
                        const report = agentReports[order.id];
                        const userProfile = order.user?.profile;
                        const agentProfile = order.agent?.profile;

                        // Calculate user payment amount
                        const calculateUserAmount = () => {
                          if (!report) return null;
                          const exchangeRate = adminSettings?.exchangeRate || 1;
                          return report.userAmount * exchangeRate * 1.05;
                        };

                        return (
                          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                              {/* Барааны нэр */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{order.productName}</h4>
                              </div>

                              {/* Дүн */}
                              {report && (
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Дүн</p>
                                  <p className="text-base font-semibold text-green-600">
                                    {calculateUserAmount()?.toLocaleString()} ₮
                                  </p>
                                </div>
                              )}

                              {/* Төлбөрийн холбоос */}
                              {report?.paymentLink && (
                                <div className="text-right min-w-0">
                                  <p className="text-sm text-gray-500">Төлбөрийн холбоос</p>
                                  <a
                                    href={report.paymentLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline truncate block max-w-50"
                                  >
                                    {report.paymentLink}
                                  </a>
                                </div>
                              )}

                              {/* User утас */}
                              {userProfile?.phone && (
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">User утас</p>
                                  <p className="text-sm font-medium text-gray-900">{userProfile.phone}</p>
                                </div>
                              )}

                              {/* Agent утас */}
                              {agentProfile?.phone && (
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Agent утас</p>
                                  <p className="text-sm font-medium text-gray-900">{agentProfile.phone}</p>
                                </div>
                              )}

                              {/* Статус */}
                              <div className="text-right">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "niitlegdsen" ? "bg-gray-100 text-gray-800" :
                                  order.status === "agent_sudlaj_bn" ? "bg-yellow-100 text-yellow-800" :
                                    order.status === "tolbor_huleej_bn" ? "bg-blue-100 text-blue-800" :
                                      order.status === "amjilttai_zahialga" ? "bg-green-100 text-green-800" :
                                        "bg-red-100 text-red-800"
                                  }`}>
                                  {order.status === "niitlegdsen" ? "Нийтэлсэн" :
                                    order.status === "agent_sudlaj_bn" ? "Agent шалгаж байна" :
                                      order.status === "tolbor_huleej_bn" ? "Төлбөр хүлээж байна" :
                                        order.status === "amjilttai_zahialga" ? "Амжилттай" :
                                          "Цуцлагдсан"}
                                </span>
                              </div>

                              {/* User Payment Status - Only show for tolbor_huleej_bn status (not for amjilttai_zahialga) */}
                              {order.status === "tolbor_huleej_bn" && (
                                <div className="text-right">
                                  {order.userPaymentVerified ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Төлбөр төлсөн
                                      </span>
                                      <button
                                        onClick={() => handleVerifyPayment(order.id)}
                                        className="px-3 py-1.5 text-xs text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium whitespace-nowrap min-h-8"
                                      >
                                        Батлах
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Төлбөр хүлээж байна
                                      </span>
                                      <button
                                        onClick={() => handleVerifyPayment(order.id)}
                                        className="px-3 py-1.5 text-xs text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium whitespace-nowrap min-h-8"
                                      >
                                        Батлах
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {order.userPaymentVerified && !order.agentPaymentPaid && (
                                  <button
                                    onClick={() => handleAgentPayment(order.id)}
                                    className="px-3 py-1.5 text-xs text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium whitespace-nowrap min-h-8"
                                  >
                                    Agent төлбөр
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                      {orderFilter === "active" ? "Идэвхтэй захиалга байхгүй байна." : "Идэвхгүй захиалга байхгүй байна."}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Cargos Tab */}
            {activeTab === "cargos" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cargos</h3>
                  <button
                    onClick={() => {
                      setEditingCargo(null);
                      setCargoFormData({ name: "", description: "" });
                      setShowCargoForm(!showCargoForm);
                    }}
                    className="px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-10"
                  >
                    {showCargoForm ? "Хаах" : "Cargo нэмэх"}
                  </button>
                </div>

                {showCargoForm && (
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Cargo нэр</label>
                        <input
                          type="text"
                          value={cargoFormData.name}
                          onChange={(e) => setCargoFormData({ ...cargoFormData, name: e.target.value })}
                          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Cargo нэр оруулах"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">Тайлбар</label>
                        <textarea
                          value={cargoFormData.description}
                          onChange={(e) => setCargoFormData({ ...cargoFormData, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Тайлбар оруулах"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={editingCargo ? handleUpdateCargo : handleCreateCargo}
                          className="px-4 py-2.5 text-sm text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium min-h-11"
                        >
                          {editingCargo ? "Шинэчлэх" : "Үүсгэх"}
                        </button>
                        {editingCargo && (
                          <button
                            onClick={() => {
                              setEditingCargo(null);
                              setCargoFormData({ name: "", description: "" });
                            }}
                            className="px-4 py-2.5 text-sm text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium min-h-11"
                          >
                            Цуцлах
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {cargos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cargos.map((cargo) => (
                      <div key={cargo.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <h4 className="font-medium text-gray-900">{cargo.name}</h4>
                        {cargo.description && (
                          <p className="text-sm text-gray-600 mt-1">{cargo.description}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              setEditingCargo(cargo);
                              setCargoFormData({ name: cargo.name, description: cargo.description || "" });
                              setShowCargoForm(true);
                            }}
                            className="px-3 py-1.5 text-xs text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-8"
                          >
                            Засах
                          </button>
                          <button
                            onClick={() => handleDeleteCargo(cargo.id)}
                            className="px-3 py-1.5 text-xs text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-8"
                          >
                            Устгах
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                    Cargo байхгүй байна.
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Тохиргоо</h3>
                  {!isEditingSettings && (
                    <button
                      onClick={handleEditSettings}
                      className="px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-10"
                    >
                      Засах
                    </button>
                  )}
                </div>

                <div className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Төлбөрийн дансны мэдээлэл</h4>

                  {settingsSaved && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
                      ✓ Тохиргоо амжилттай хадгалагдлаа
                    </div>
                  )}

                  {isEditingSettings ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Дансны дугаар
                        </label>
                        <input
                          type="text"
                          value={settingsFormData.accountNumber || ""}
                          onChange={(e) => setSettingsFormData({ ...settingsFormData, accountNumber: e.target.value })}
                          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Жишээ: 1234567890"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Дансны нэр
                        </label>
                        <input
                          type="text"
                          value={settingsFormData.accountName || ""}
                          onChange={(e) => setSettingsFormData({ ...settingsFormData, accountName: e.target.value })}
                          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Жишээ: Agentbuy.mn"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Банк
                        </label>
                        <input
                          type="text"
                          value={settingsFormData.bank || ""}
                          onChange={(e) => setSettingsFormData({ ...settingsFormData, bank: e.target.value })}
                          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Жишээ: Хаан банк"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Ханш (Exchange Rate)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={settingsFormData.exchangeRate || 1}
                          onChange={(e) => setSettingsFormData({ ...settingsFormData, exchangeRate: parseFloat(e.target.value) || 1 })}
                          className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Жишээ: 1.0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          User-д харагдах дүн = Agent report дүн × Ханш × 1.05
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveSettings}
                          disabled={savingSettings}
                          className="flex-1 px-4 py-2.5 text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
                        >
                          {savingSettings ? "Хадгалж байна..." : "Хадгалах"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingSettings(false);
                            setSettingsFormData({
                              accountNumber: adminSettings?.accountNumber || "",
                              accountName: adminSettings?.accountName || "",
                              bank: adminSettings?.bank || "",
                              exchangeRate: adminSettings?.exchangeRate || 1,
                            });
                          }}
                          className="px-4 py-2.5 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium min-h-11"
                        >
                          Цуцлах
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Дансны дугаар
                        </label>
                        <p className="text-gray-900 font-mono">{adminSettings?.accountNumber || "Тохируулаагүй"}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Дансны нэр
                        </label>
                        <p className="text-gray-900">{adminSettings?.accountName || "Тохируулаагүй"}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Банк
                        </label>
                        <p className="text-gray-900">{adminSettings?.bank || "Тохируулаагүй"}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Ханш (Exchange Rate)
                        </label>
                        <p className="text-gray-900">{adminSettings?.exchangeRate || 1}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Урамшуулал хүсэлтүүд</h3>
                {(() => {
                  const pendingRequests = rewardRequests.filter(r => r.status === "pending");
                  const approvedRequests = rewardRequests.filter(r => r.status === "approved");
                  const rejectedRequests = rewardRequests.filter(r => r.status === "rejected");

                  return (
                    <div className="space-y-6">
                      {/* Pending Requests */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Хүлээж байгаа хүсэлтүүд ({pendingRequests.length})</h4>
                        {pendingRequests.length > 0 ? (
                          <div className="space-y-3">
                            {pendingRequests.map((request) => (
                              <div key={request.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                                <div className="flex justify-between items-start mb-3 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Agent: {request.agent?.profile?.name || request.agent?.email || "Unknown"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Утас: {request.agent?.profile?.phone || "Байхгүй"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Имэйл: {request.agent?.email}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-base font-semibold text-green-600">
                                      {request.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {new Date(request.createdAt).toLocaleDateString("mn-MN", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Та ${request.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮ урамшууллыг батлахдаа итгэлтэй байна уу?`)) {
                                        return;
                                      }

                                      try {
                                        await apiClient.approveRewardRequest(request.id);
                                        alert("Урамшуулал амжилттай батлагдлаа.");
                                        await loadData();
                                      } catch (e: unknown) {
                                        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
                                        alert(errorMessage);
                                      }
                                    }}
                                    className="px-4 py-2.5 text-sm text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium min-h-10"
                                  >
                                    Батлах
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Та ${request.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮ урамшууллын хүсэлтийг татгалзахдаа итгэлтэй байна уу? Оноо agent-д буцаагдана.`)) {
                                        return;
                                      }

                                      try {
                                        await apiClient.rejectRewardRequest(request.id);
                                        alert("Хүсэлт татгалзсан. Оноо agent-д буцаагдлаа.");
                                        await loadData();
                                      } catch (e: unknown) {
                                        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
                                        alert(errorMessage);
                                      }
                                    }}
                                    className="px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-10"
                                  >
                                    Татгалзах
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                            Хүлээж байгаа урамшуулал хүсэлт байхгүй байна.
                          </div>
                        )}
                      </div>

                      {/* Approved Requests */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Батлагдсан урамшууллууд ({approvedRequests.length})</h4>
                        {approvedRequests.length > 0 ? (
                          <div className="space-y-3">
                            {approvedRequests.map((request) => (
                              <div key={request.id} className="border border-green-200 rounded-xl p-4 bg-green-50">
                                <div className="flex justify-between items-start mb-3 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Agent: {request.agent?.profile?.name || request.agent?.email || "Unknown"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Утас: {request.agent?.profile?.phone || "Байхгүй"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Имэйл: {request.agent?.email}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-base font-semibold text-green-600">
                                      {request.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮
                                    </p>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1 inline-block">
                                      Батлагдсан
                                    </span>
                                    {request.approvedAt && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(request.approvedAt).toLocaleDateString("mn-MN", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                            Батлагдсан урамшуулал байхгүй байна.
                          </div>
                        )}
                      </div>

                      {/* Rejected Requests */}
                      {rejectedRequests.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Татгалзсан хүсэлтүүд ({rejectedRequests.length})</h4>
                          <div className="space-y-3">
                            {rejectedRequests.map((request) => (
                              <div key={request.id} className="border border-red-200 rounded-xl p-4 bg-red-50">
                                <div className="flex justify-between items-start mb-3 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      Agent: {request.agent?.profile?.name || request.agent?.email || "Unknown"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Утас: {request.agent?.profile?.phone || "Байхгүй"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Имэйл: {request.agent?.email}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-base font-semibold text-red-600">
                                      {request.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮
                                    </p>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1 inline-block">
                                      Татгалзсан
                                    </span>
                                    {request.rejectedAt && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(request.rejectedAt).toLocaleDateString("mn-MN", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

