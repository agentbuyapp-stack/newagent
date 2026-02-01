/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
  type User,
  type Profile,
  type Order,
  type AgentReport,
  type BundleOrder,
  type Cargo,
  type PublicAgent,
} from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

import NewOrderForm from "@/components/dashboard/NewOrderForm";
import OrderHistorySection from "@/components/dashboard/OrderHistorySection";
import ProfileForm from "@/components/ProfileForm";

// Lazy load modals - only loaded when needed
const ChatModal = dynamic(() => import("@/components/ChatModal"), { ssr: false });
const BundleOrderDetailModal = dynamic(() => import("@/components/dashboard/BundleOrderDetailModal"), { ssr: false });

export default function UserDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bundleOrders, setBundleOrders] = useState<BundleOrder[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [showNewOrderSection, setShowNewOrderSection] = useState(true);
  const [showCargos, setShowCargos] = useState(false);
  const [showAgents, setShowAgents] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedBundleOrder, setSelectedBundleOrder] =
    useState<BundleOrder | null>(null);
  const [showBundleOrderModal, setShowBundleOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | BundleOrder | null>(null);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<PublicAgent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentReports, setAgentReports] = useState<
    Record<string, AgentReport | null>
  >({});
  const [showPaymentInfo] = useState<Record<string, boolean>>({});
  const [paymentInfo, setPaymentInfo] = useState<
    Record<
      string,
      {
        accountNumber?: string;
        accountName?: string;
        bank?: string;
        exchangeRate?: number;
      }
    >
  >({});
  const [adminSettings, setAdminSettings] = useState<{
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    exchangeRate?: number;
  } | null>(null);
  const [showUserInfoInModal, setShowUserInfoInModal] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(true);

  // Action loading states
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [removeItemLoading, setRemoveItemLoading] = useState<string | null>(null);


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

  const loadAgentReport = async (orderId: string) => {
    try {
      const report = await apiClient.getAgentReport(orderId);
      setAgentReports((prev) => ({ ...prev, [orderId]: report }));
    } catch {
      // Silently fail - report might not exist yet
      setAgentReports((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  const loadData = async () => {
    if (!clerkUser) return;

    try {
      // Get or create user in our database
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      if (!email) {
        setError("Имэйл олдсонгүй");
        setLoading(false);
        return;
      }

      // Get user from database (Clerk middleware will create if doesn't exist)
      try {
        const userData = await apiClient.getMe();
        setUser(userData);
        if (userData.profile) {
          setProfile(userData.profile);
        }

        // Load all data in parallel for better performance
        const [settingsResult, cargosResult, agentsResult, ordersResult, bundleOrdersResult] = await Promise.allSettled([
          apiClient.getAdminSettings(),
          apiClient.getCargos(),
          apiClient.getTopAgents(),
          apiClient.getOrders(),
          apiClient.getBundleOrders(),
        ]);

        // Process results
        if (settingsResult.status === "fulfilled") {
          setAdminSettings(settingsResult.value);
        }
        if (cargosResult.status === "fulfilled") {
          setCargos(cargosResult.value);
        }
        // Load agents - try top agents first, then fall back to public agents
        if (agentsResult.status === "fulfilled" && agentsResult.value.length > 0) {
          setAgents(agentsResult.value);
        } else {
          // Fall back to public agents if no top agents or error
          try {
            const publicAgents = await apiClient.getPublicAgents();
            setAgents(publicAgents.slice(0, 10));
          } catch {
            setAgents([]);
          }
        }
        if (bundleOrdersResult.status === "fulfilled") {
          setBundleOrders(bundleOrdersResult.value);
        }

        if (ordersResult.status === "fulfilled") {
          const ordersData = ordersResult.value;
          setOrders(ordersData);

          // If modal is open and we have a selectedOrder, update it from fresh data
          if (showOrderModal && selectedOrder) {
            const refreshedOrder = ordersData.find(
              (o) => o.id === selectedOrder.id,
            );
            if (refreshedOrder) {
              const preservedUserPaymentVerified =
                selectedOrder.userPaymentVerified ||
                refreshedOrder.userPaymentVerified;
              setSelectedOrder({
                ...refreshedOrder,
                userPaymentVerified: preservedUserPaymentVerified,
              });
            }
          }

          // Load agent reports in parallel (not one by one)
          const ordersNeedingReports = ordersData.filter(
            (order) =>
              order.agentId &&
              (order.status === "agent_sudlaj_bn" ||
                order.status === "tolbor_huleej_bn" ||
                order.status === "amjilttai_zahialga")
          );

          if (ordersNeedingReports.length > 0) {
            const reportPromises = ordersNeedingReports.map((order) =>
              apiClient.getAgentReport(order.id).then(
                (report) => ({ orderId: order.id, report }),
                () => ({ orderId: order.id, report: null })
              )
            );
            const reportResults = await Promise.all(reportPromises);
            const reportsMap: Record<string, typeof reportResults[0]["report"]> = {};
            reportResults.forEach(({ orderId, report }) => {
              reportsMap[orderId] = report;
            });
            setAgentReports((prev) => ({ ...prev, ...reportsMap }));
          }
        }
      } catch {
        // If user doesn't exist, the backend will create it automatically via Clerk middleware
        // Just retry after a moment
        setTimeout(async () => {
          try {
            const userData = await apiClient.getMe();
            setUser(userData);
            if (userData.profile) {
              setProfile(userData.profile);
            }
          } catch (retryErr: unknown) {
            const errorMessage =
              retryErr instanceof Error ? retryErr.message : "Алдаа гарлаа";
            setError(errorMessage);
          }
        }, 1000);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSuccess = async () => {
    await loadData();
    setShowProfileModal(false);
  };

  const handleOrderSuccess = async () => {
    await loadData();
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelLoading(true);
    try {
      await apiClient.cancelOrder(orderId);
      await loadData();
      setShowOrderModal(false);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  const canCancelOrder = (order: Order) => {
    // "нийтэлсэн", "цуцлагдсан", эсвэл "төлбөр хүлээж байна" статустай захиалгыг цуцлах боломжтой
    // "agent шалгаж байна" эсвэл "амжилттай захиалга" статустай захиалгыг цуцлах боломжгүй
    return (
      order.status === "niitlegdsen" ||
      order.status === "tsutsalsan_zahialga" ||
      order.status === "tolbor_huleej_bn"
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRepublishOrder = async (orderId: string) => {
    if (
      !confirm(
        "Та энэ захиалгыг дахин нийтлэхдээ итгэлтэй байна уу? Захиалга цуцлагдаж шинээр үүсгэгдэнэ.",
      )
    ) {
      return;
    }

    try {
      // First cancel the order
      await apiClient.cancelOrder(orderId);

      // Get the order details
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        throw new Error("Захиалга олдсонгүй");
      }

      // Create new order with same data
      await apiClient.createOrder({
        productName: order.productName,
        description: order.description,
        imageUrls: order.imageUrls || [],
      });

      await loadData();
      setShowOrderModal(false);
      alert("Захиалга амжилттай дахин нийтлэгдлээ");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handlePaymentPaid = async (orderId: string) => {
    setPaymentLoading(true);
    try {
      // Call API to confirm user payment
      await apiClient.request<Order>(
        `/orders/${orderId}/user-payment-confirmed`,
        {
          method: "PUT",
        },
      );

      // Update selectedOrder state immediately with the updated order from API response
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          userPaymentVerified: true,
        });
      }

      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    setDeleteLoading(true);
    try {
      await apiClient.cancelOrder(order.id);
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteBundleOrder = async (bundleOrder: BundleOrder) => {
    setDeleteLoading(true);
    try {
      await apiClient.deleteBundleOrder(bundleOrder.id);
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    setArchiveLoading(true);
    try {
      await apiClient.archiveOrder(orderId);
      await loadData();
      setShowOrderModal(false);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setArchiveLoading(false);
    }
  };

  const canArchiveOrder = (order: Order) => {
    // Only completed or cancelled orders can be archived
    return (
      (order.status === "amjilttai_zahialga" ||
        order.status === "tsutsalsan_zahialga") &&
      !order.archivedByUser
    );
  };

  const loadPaymentInfo = async (orderId: string) => {
    try {
      // Load admin settings if not loaded
      if (!adminSettings) {
        const settings = await apiClient.getAdminSettings();
        setAdminSettings(settings);
        setPaymentInfo((prev) => ({
          ...prev,
          [orderId]: {
            accountNumber: settings.accountNumber || "",
            accountName: settings.accountName || "",
            bank: settings.bank || "",
            exchangeRate: settings.exchangeRate || 1,
          },
        }));
      } else {
        setPaymentInfo((prev) => ({
          ...prev,
          [orderId]: {
            accountNumber: adminSettings.accountNumber || "",
            accountName: adminSettings.accountName || "",
            bank: adminSettings.bank || "",
            exchangeRate: adminSettings.exchangeRate || 1,
          },
        }));
      }
    } catch (e: unknown) {
      console.error("Failed to load payment info:", e);
      // Fallback to placeholder
      setPaymentInfo((prev) => ({
        ...prev,
        [orderId]: {
          accountNumber: "1234567890",
          accountName: "Agentbuy.mn",
          bank: "Хаан банк",
          exchangeRate: 1,
        },
      }));
    }
  };

  // Calculate user payment amount: agent report userAmount * exchangeRate * 1.05
  // Memoize this function to avoid recreating it on every render
  const calculateUserPaymentAmount = useCallback(
    (agentReport: AgentReport | null, exchangeRate: number = 1): number => {
      if (!agentReport) return 0;
      return Math.round(agentReport.userAmount * exchangeRate * 1.05);
    },
    [],
  );

  // Load agent report when order modal opens
  useEffect(() => {
    if (
      showOrderModal &&
      selectedOrder &&
      (selectedOrder.status === "agent_sudlaj_bn" ||
        selectedOrder.status === "tolbor_huleej_bn" ||
        selectedOrder.status === "amjilttai_zahialga")
    ) {
      if (agentReports[selectedOrder.id] === undefined) {
        loadAgentReport(selectedOrder.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOrderModal, selectedOrder?.id]);

  // Memoize profile completion check
  const isProfileComplete = useMemo(
    () => profile && profile.name && profile.phone && profile.cargo,
    [profile],
  );

  if (!isLoaded || loading) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] flex items-center justify-center z-50 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-400/25 rounded-full blur-3xl animate-blob" />
        <div className="absolute -top-20 right-10 w-72 h-72 bg-indigo-400/25 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />

        <div className="flex flex-col items-center gap-8 z-10">
          {/* User icon with animated rings */}
          <div className="relative animate-fade-in">
            <div
              className="absolute inset-0 w-28 h-28 rounded-full border-4 border-[#0b4ce5]/20 animate-ping"
              style={{ animationDuration: "2s" }}
            />
            <svg
              className="absolute -inset-2 w-32 h-32 animate-spin-slow"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient
                  id="userGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#0b4ce5" />
                  <stop offset="100%" stopColor="#4a90e2" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#userGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60 200"
              />
            </svg>
            <div className="relative w-28 h-28 rounded-full bg-linear-to-br from-[#0b4ce5] to-[#4a90e2] flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <svg
                className="w-14 h-14 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#0b4ce5] to-[#4a90e2]">
              Хэрэглэгч
            </h2>
            <div className="flex items-center gap-3 text-gray-600 font-medium">
              <span>Ачааллаж байна</span>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#0b4ce5] rounded-full animate-bounce-dot" />
                <span className="w-2.5 h-2.5 bg-[#4a90e2] rounded-full animate-bounce-dot animation-delay-150" />
                <span className="w-2.5 h-2.5 bg-[#00d4ff] rounded-full animate-bounce-dot animation-delay-300" />
              </div>
            </div>
          </div>

          <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden animate-fade-in-up animation-delay-500">
            <div className="h-full bg-linear-to-r from-[#0b4ce5] to-[#4a90e2] rounded-full animate-progress-bar" />
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Order Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Box 1: Шинэ захиалга үүсгэх */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  if (isProfileComplete) {
                    setShowNewOrderSection(!showNewOrderSection);
                  } else {
                    setShowProfileModal(true);
                  }
                }}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      Шинэ захиалга үүсгэх
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Бараа захиалах</p>
                  </div>
                </div>
                {isProfileComplete && (
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showNewOrderSection ? "rotate-180" : ""}`}
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
                )}
              </div>

              {/* Show order form only if profile is complete */}
              {isProfileComplete && (
                <div className={`mt-4 ${showNewOrderSection ? "" : "hidden"}`}>
                  <NewOrderForm onSuccess={handleOrderSuccess} />
                </div>
              )}
            </div>
            <OrderHistorySection
                orders={orders.filter((o) => !o.archivedByUser)}
                bundleOrders={bundleOrders}
                archivedOrders={orders.filter((o) => o.archivedByUser)}
                onSelectOrder={(order) => {
                  setSelectedOrder(order);
                  setShowOrderModal(true);
                }}
                onSelectBundleOrder={(bundleOrder) => {
                  setSelectedBundleOrder(bundleOrder);
                  setShowBundleOrderModal(true);
                }}
                onOpenChat={(order) => {
                  setChatOrder(order);
                  setShowChatModal(true);
                }}
                onOpenBundleChat={(bundleOrder) => {
                  setChatOrder(bundleOrder);
                  setShowChatModal(true);
                }}
                onViewReport={(order) => {
                  setSelectedOrder(order);
                  setShowOrderModal(true);
                }}
                onViewBundleReport={(bundleOrder) => {
                  setSelectedBundleOrder(bundleOrder);
                  setShowBundleOrderModal(true);
                }}
                onDeleteOrder={handleDeleteOrder}
                onDeleteBundleOrder={handleDeleteBundleOrder}
                onArchiveOrder={(order) => handleArchiveOrder(order.id)}
                onReload={loadData}
                deleteLoading={deleteLoading}
                archiveLoading={archiveLoading}
              />

              {/* Box 3: Cargonууд - Dropdown */}
              {cargos.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowCargos(!showCargos)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                          Каргонууд
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Түншлэгч карго компаниуд ({cargos.length})
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showCargos ? "rotate-180" : ""}`}
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
                  </div>

                  {showCargos && (
                    <div className="mt-4 space-y-3">
                      {cargos.map((cargo) => (
                        <div
                          key={cargo.id}
                          className="relative rounded-xl overflow-hidden border border-orange-100 dark:border-orange-900/50 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-lg transition-all min-h-55"
                          style={{
                            backgroundImage: cargo.imageUrl
                              ? `url(${cargo.imageUrl})`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          {/* Gradient overlay - only at bottom */}
                          <div
                            className={`absolute inset-x-0 bottom-0 h-1/2 ${cargo.imageUrl ? "bg-linear-to-t from-black/90 to-transparent" : ""}`}
                          />
                          {!cargo.imageUrl && (
                            <div className="absolute inset-0 bg-linear-to-br from-white dark:from-gray-800 to-orange-50/50 dark:to-orange-900/20" />
                          )}

                          {/* Content positioned at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4
                              className={`font-bold text-base sm:text-lg ${cargo.imageUrl ? "text-white drop-shadow-md" : "text-gray-900 dark:text-white"}`}
                            >
                              {cargo.name}
                            </h4>
                            {cargo.description && (
                              <p
                                className={`text-xs mt-1 ${cargo.imageUrl ? "text-gray-100" : "text-gray-500 dark:text-gray-400"}`}
                              >
                                {cargo.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {cargo.phone && (
                                <a
                                  href={`tel:${cargo.phone}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400"}`}
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
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                  </svg>
                                  {cargo.phone}
                                </a>
                              )}

                              {cargo.website && (
                                <a
                                  href={
                                    cargo.website.startsWith("http")
                                      ? cargo.website
                                      : `https://${cargo.website}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400"}`}
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
                                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                                    />
                                  </svg>
                                  Вэбсайт
                                </a>
                              )}

                              {cargo.facebook && (
                                <a
                                  href={
                                    cargo.facebook.startsWith("http")
                                      ? cargo.facebook
                                      : `https://${cargo.facebook}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400"}`}
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                  </svg>
                                  Facebook
                                </a>
                              )}

                              {cargo.location && (
                                <a
                                  href={cargo.location}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400"}`}
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
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  Байршил
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Box 4: Агентууд - Dropdown */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowAgents(!showAgents)}
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-md shadow-yellow-500/20">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                          Топ 10 Агентууд
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Шилдэг агентуудын жагсаалт
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showAgents ? "rotate-180" : ""}`}
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
                  </div>

                  {showAgents && (
                    <div className="mt-4 space-y-4">
                      {agents.map((agent, index) => {
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case "online": return "bg-green-500";
                            case "busy": return "bg-yellow-500";
                            default: return "bg-gray-400";
                          }
                        };
                        const getStatusText = (status: string) => {
                          switch (status) {
                            case "online": return "Онлайн";
                            case "busy": return "Завгүй";
                            default: return "Офлайн";
                          }
                        };
                        const renderStars = (rating: number) => {
                          const fullStars = Math.floor(rating);
                          const hasHalf = rating - fullStars >= 0.5;
                          return (
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < fullStars
                                      ? "text-yellow-400"
                                      : i === fullStars && hasHalf
                                        ? "text-yellow-400"
                                        : "text-gray-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          );
                        };

                        return (
                          <div
                            key={agent.id}
                            onClick={() => {
                              setSelectedAgent(agent);
                              setShowAgentModal(true);
                            }}
                            className={`relative overflow-hidden rounded-2xl border transition-all hover:shadow-lg cursor-pointer ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-orange-900/30 border-yellow-200 dark:border-yellow-700 shadow-md"
                                : index === 1
                                  ? "bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-700 dark:via-slate-800 dark:to-gray-700 border-gray-200 dark:border-gray-600"
                                  : index === 2
                                    ? "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-900/30 dark:via-amber-900/20 dark:to-yellow-900/30 border-orange-200 dark:border-orange-700"
                                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                            }`}
                          >
                            {/* Top Badge for top 3 */}
                            {index < 3 && (
                              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold ${
                                index === 0
                                  ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white"
                                  : index === 1
                                    ? "bg-gradient-to-r from-gray-400 to-slate-500 text-white"
                                    : "bg-gradient-to-r from-orange-400 to-amber-500 text-white"
                              }`}>
                                {index === 0 ? "🥇 #1" : index === 1 ? "🥈 #2" : "🥉 #3"}
                              </div>
                            )}

                            <div className="p-4">
                              <div className="flex gap-4">
                                {/* Avatar with Online Status */}
                                <div className="relative flex-shrink-0">
                                  {agent.avatarUrl ? (
                                    <img
                                      src={agent.avatarUrl}
                                      alt={agent.name}
                                      className={`w-16 h-16 rounded-full object-cover border-2 ${
                                        index < 3 ? "border-yellow-300 dark:border-yellow-600" : "border-gray-200 dark:border-gray-600"
                                      }`}
                                    />
                                  ) : (
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                                      index === 0
                                        ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                                        : index === 1
                                          ? "bg-gradient-to-br from-gray-400 to-slate-500"
                                          : index === 2
                                            ? "bg-gradient-to-br from-orange-400 to-amber-500"
                                            : "bg-gradient-to-br from-purple-400 to-indigo-500"
                                    }`}>
                                      {agent.name[0]?.toUpperCase()}
                                    </div>
                                  )}
                                  {/* Online Status Indicator */}
                                  <div
                                    className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(agent.availabilityStatus)}`}
                                    title={getStatusText(agent.availabilityStatus)}
                                  />
                                  {/* Rank Badge for non-top-3 */}
                                  {index >= 3 && (
                                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                                      {index + 1}
                                    </div>
                                  )}
                                </div>

                                {/* Info Section */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                        {agent.name}
                                        {agent.featured && (
                                          <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-xs rounded font-medium">
                                            Онцлох
                                          </span>
                                        )}
                                      </h4>
                                      {/* Rating */}
                                      <div className="flex items-center gap-2 mt-1">
                                        {renderStars(agent.avgRating)}
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          ({agent.reviewCount} үнэлгээ)
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Bio */}
                                  {agent.bio && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                      {agent.bio}
                                    </p>
                                  )}

                                  {/* Specialties */}
                                  {agent.specialties && agent.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {agent.specialties.slice(0, 3).map((specialty, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-xs rounded-full font-medium"
                                        >
                                          {specialty}
                                        </span>
                                      ))}
                                      {agent.specialties.length > 3 && (
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                          +{agent.specialties.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Stats Row */}
                                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-gray-700 dark:text-gray-300 font-semibold">{agent.successRate}%</span>
                                      <span className="text-gray-500 dark:text-gray-400 text-xs">амжилт</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm">
                                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                      </svg>
                                      <span className="text-gray-700 dark:text-gray-300 font-semibold">{agent.totalTransactions}</span>
                                      <span className="text-gray-500 dark:text-gray-400 text-xs">гүйлгээ</span>
                                    </div>
                                    {agent.experienceYears && agent.experienceYears > 0 && (
                                      <div className="flex items-center gap-1.5 text-sm">
                                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-700 dark:text-gray-300 font-semibold">{agent.experienceYears}</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs">жил</span>
                                      </div>
                                    )}
                                    {agent.responseTime && (
                                      <div className="hidden sm:flex items-center gap-1.5 text-sm">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs">{agent.responseTime}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {agents.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p>Одоогоор топ агент байхгүй байна</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>
          </div>
      </main>

      {/* Profile Modal - Opens when user clicks "Захиалга үүсгэх" without complete profile */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Профайл бөглөх
                </h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Захиалга үүсгэхийн тулд эхлээд профайлаа бүрэн бөглөнө үү.
              </p>
              <ProfileForm profile={profile} onSuccess={handleProfileSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderModal &&
        selectedOrder &&
        (() => {
          const currentReport = agentReports[selectedOrder.id];
          const hasAgentReport =
            currentReport !== null && currentReport !== undefined;
          const mainImage =
            selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0
              ? selectedOrder.imageUrls[0]
              : null;

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
                          alt={selectedOrder.productName}
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
                        {selectedOrder.productName}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {getStatusIcon(selectedOrder.status)}
                          </svg>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1.5">
                        {new Date(selectedOrder.createdAt).toLocaleDateString(
                          "mn-MN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setShowOrderModal(false)}
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
                  {selectedOrder.status === "amjilttai_zahialga" &&
                    selectedOrder.trackCode && (
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
                              {selectedOrder.trackCode}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                selectedOrder.trackCode || "",
                              );
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
                    )}

                  {/* Product Details Card */}
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() =>
                        setShowUserInfoInModal(!showUserInfoInModal)
                      }
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
                        <span className="font-semibold text-gray-900">
                          Барааны мэдээлэл
                        </span>
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
                        {selectedOrder.imageUrls &&
                          selectedOrder.imageUrls.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Зурагнууд
                              </p>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {selectedOrder.imageUrls.map(
                                  (imgUrl, index) => (
                                    <div
                                      key={index}
                                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-blue-300"
                                      onClick={() =>
                                        setZoomedImageIndex(
                                          zoomedImageIndex === index
                                            ? null
                                            : index,
                                        )
                                      }
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`${selectedOrder.productName} - ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                              {/* Zoomed Image Modal */}
                              {zoomedImageIndex !== null && (
                                <div
                                  className="fixed inset-0 bg-black/90 flex items-center justify-center z-70 p-4"
                                  onClick={() => setZoomedImageIndex(null)}
                                >
                                  <img
                                    src={
                                      selectedOrder.imageUrls[zoomedImageIndex]
                                    }
                                    alt={`${selectedOrder.productName} - ${zoomedImageIndex + 1}`}
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
                            {selectedOrder.productName}
                          </p>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Тайлбар
                          </p>
                          {selectedOrder.description &&
                          selectedOrder.description.includes(":") &&
                          selectedOrder.description.split("\n\n").length > 1 ? (
                            <div className="space-y-2">
                              {selectedOrder.description
                                .split("\n\n")
                                .map((productDesc, idx) => {
                                  const [productName, ...descParts] =
                                    productDesc.split(": ");
                                  const productDescription =
                                    descParts.join(": ");
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
                              {selectedOrder.description || "Тайлбар байхгүй"}
                            </p>
                          )}
                        </div>

                        {/* Order ID */}
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Захиалгын ID
                          </p>
                          <p className="text-xs font-mono text-gray-600 mt-1">
                            #{selectedOrder.id.slice(-4).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Report Section - Collapsible */}
                  {selectedOrder.status === "tolbor_huleej_bn" && hasAgentReport && currentReport && (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <button
                        onClick={() => setShowPaymentSection(!showPaymentSection)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <span className="font-semibold text-gray-900">Тайлан</span>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showPaymentSection ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Content */}
                      {showPaymentSection && (
                        <div className="border-t border-gray-200 bg-white">
                          {(() => {
                            const exchangeRate = adminSettings?.exchangeRate || paymentInfo[selectedOrder.id]?.exchangeRate || 1;
                            const yuanAmount = currentReport.userAmount || 0;
                            const totalMNT = Math.round(yuanAmount * exchangeRate * 1.05);
                            const accountInfo = paymentInfo[selectedOrder.id] || adminSettings;

                            return (
                              <>
                                {/* 1. Agent Images */}
                                {currentReport.additionalImages && currentReport.additionalImages.length > 0 && (
                                  <div className="p-3 border-b border-gray-100">
                                    <div className="flex gap-2">
                                      {currentReport.additionalImages.map((img, i) => (
                                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                          <img src={img} alt="" className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 2. Quantity & Description */}
                                {(currentReport.quantity || currentReport.additionalDescription) && (
                                  <div className="p-3 space-y-2 text-sm border-b border-gray-100">
                                    {currentReport.quantity && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">Тоо ширхэг</span>
                                        <span className="font-medium">{currentReport.quantity}</span>
                                      </div>
                                    )}
                                    {currentReport.additionalDescription && (
                                      <div>
                                        <span className="text-gray-500 text-xs">Тайлбар:</span>
                                        <p className="text-gray-700 mt-1">{currentReport.additionalDescription}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* 3. Total Amount */}
                                <div className="p-3 border-b border-gray-100">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Нийт дүн</span>
                                    <div className="text-right">
                                      <p className="text-xl font-bold text-gray-900">{totalMNT.toLocaleString()} ₮</p>
                                      <p className="text-xs text-gray-400">{yuanAmount.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮ + 5%</p>
                                    </div>
                                  </div>
                                </div>

                                {/* 4. Bank Info */}
                                <div className="p-3 space-y-1.5 text-sm border-b border-gray-100 bg-gray-50">
                                  <p className="text-xs text-gray-400 font-medium mb-2">Шилжүүлэх данс</p>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Банк</span>
                                    <span className="font-medium">{accountInfo?.bank}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Нэр</span>
                                    <span className="font-medium">{accountInfo?.accountName}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Данс</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold font-mono">{accountInfo?.accountNumber}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(accountInfo?.accountNumber || "");
                                          alert("Хуулагдлаа!");
                                        }}
                                        className="text-xs text-indigo-600 hover:text-indigo-700"
                                      >
                                        Хуулах
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* 5. Actions */}
                                <div className="p-3">
                                  {selectedOrder.userPaymentVerified ? (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-2.5 text-sm">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="font-medium">Баталгаажуулахыг хүлээж байна</span>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handlePaymentPaid(selectedOrder.id)}
                                        disabled={paymentLoading}
                                        className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                                      >
                                        {paymentLoading ? (
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                        Төлбөр төлсөн
                                      </button>
                                      <button
                                        onClick={() => handleCancelOrder(selectedOrder.id)}
                                        disabled={cancelLoading}
                                        className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                                      >
                                        Цуцлах
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Agent Report for non-payment statuses (amjilttai, etc.) */}
                  {hasAgentReport && currentReport && selectedOrder.status !== "tolbor_huleej_bn" && (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-medium">Тайлан</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="bg-white">
                        {(() => {
                          const exchangeRate = adminSettings?.exchangeRate || 1;
                          const yuanAmount = currentReport.userAmount || 0;
                          const totalMNT = Math.round(yuanAmount * exchangeRate * 1.05);
                          return (
                            <>
                              {/* Images */}
                              {currentReport.additionalImages && currentReport.additionalImages.length > 0 && (
                                <div className="p-3 border-b border-gray-100">
                                  <div className="flex gap-2">
                                    {currentReport.additionalImages.map((img, i) => (
                                      <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Quantity & Description */}
                              {(currentReport.quantity || currentReport.additionalDescription) && (
                                <div className="p-3 space-y-2 text-sm border-b border-gray-100">
                                  {currentReport.quantity && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Тоо ширхэг</span>
                                      <span className="font-medium">{currentReport.quantity}</span>
                                    </div>
                                  )}
                                  {currentReport.additionalDescription && (
                                    <div>
                                      <span className="text-gray-500 text-xs">Тайлбар:</span>
                                      <p className="text-gray-700 mt-1">{currentReport.additionalDescription}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Total Amount */}
                              <div className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Төлсөн дүн</span>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">{totalMNT.toLocaleString()} ₮</p>
                                    <p className="text-xs text-gray-400">{yuanAmount.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮ + 5%</p>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Dates Section */}
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
                        {new Date(selectedOrder.createdAt).toLocaleDateString(
                          "mn-MN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
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
                        {new Date(selectedOrder.updatedAt).toLocaleDateString(
                          "mn-MN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    {/* Chat Button */}
                    {selectedOrder.status !== "tsutsalsan_zahialga" && (
                      <button
                        onClick={() => {
                          setChatOrder(selectedOrder);
                          setShowChatModal(true);
                        }}
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
                    {canArchiveOrder(selectedOrder) && (
                      <button
                        onClick={() => handleArchiveOrder(selectedOrder.id)}
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
                    {canCancelOrder(selectedOrder) && selectedOrder.status !== "tolbor_huleej_bn" && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
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
        })()}

      {/* Chat Modal */}
      {showChatModal && chatOrder && (
        <ChatModal
          order={chatOrder}
          isOpen={showChatModal}
          onClose={() => {
            setChatOrder(null);
            setShowChatModal(false);
          }}
        />
      )}

      {/* Bundle Order Detail Modal */}
      {showBundleOrderModal && selectedBundleOrder && (
        <BundleOrderDetailModal
          bundleOrder={selectedBundleOrder}
          onClose={() => {
            setSelectedBundleOrder(null);
            setShowBundleOrderModal(false);
          }}
          exchangeRate={adminSettings?.exchangeRate || 1}
          adminSettings={adminSettings || undefined}
          onConfirmPayment={async (bundleOrderId: string) => {
            setPaymentLoading(true);
            try {
              await apiClient.confirmBundleUserPayment(bundleOrderId);
              // Update local state
              setSelectedBundleOrder({
                ...selectedBundleOrder,
                userPaymentVerified: true,
              });
              await loadData();
            } catch (e: unknown) {
              const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
              alert(errorMessage);
            } finally {
              setPaymentLoading(false);
            }
          }}
          paymentLoading={paymentLoading}
          onCancelOrder={async (bundleOrderId: string) => {
            setCancelLoading(true);
            try {
              await apiClient.cancelBundleOrder(bundleOrderId);
              // Update local state
              setSelectedBundleOrder({
                ...selectedBundleOrder,
                status: "tsutsalsan_zahialga",
              });
              await loadData();
              // Close modal after cancellation
              setSelectedBundleOrder(null);
              setShowBundleOrderModal(false);
            } catch (e: unknown) {
              const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
              alert(errorMessage);
            } finally {
              setCancelLoading(false);
            }
          }}
          cancelLoading={cancelLoading}
          onRemoveItem={async (bundleOrderId: string, itemId: string) => {
            setRemoveItemLoading(itemId);
            try {
              const updatedOrder = await apiClient.removeItemFromBundle(bundleOrderId, itemId);
              // Update local state with updated bundle order
              setSelectedBundleOrder(updatedOrder);
              await loadData();
            } catch (e: unknown) {
              const errorMessage = e instanceof Error ? e.message : "Бараа хасахад алдаа гарлаа";
              alert(errorMessage);
            } finally {
              setRemoveItemLoading(null);
            }
          }}
          removeItemLoading={removeItemLoading}
          onOpenChat={(bundleOrder) => {
            setSelectedBundleOrder(null);
            setShowBundleOrderModal(false);
            setChatOrder(bundleOrder);
            setShowChatModal(true);
          }}
        />
      )}

      {/* Agent Detail Modal */}
      {showAgentModal && selectedAgent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedAgent(null);
            setShowAgentModal(false);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className={`relative p-6 pb-16 rounded-t-2xl ${
              selectedAgent.rank === 1
                ? "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400"
                : selectedAgent.rank === 2
                  ? "bg-gradient-to-br from-gray-300 via-slate-400 to-gray-400"
                  : selectedAgent.rank === 3
                    ? "bg-gradient-to-br from-orange-300 via-amber-400 to-yellow-400"
                    : "bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500"
            }`}>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  setShowAgentModal(false);
                }}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Rank badge */}
              {selectedAgent.rank && selectedAgent.rank <= 10 && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold">
                  {selectedAgent.rank === 1 ? "🥇 #1" : selectedAgent.rank === 2 ? "🥈 #2" : selectedAgent.rank === 3 ? "🥉 #3" : `#${selectedAgent.rank}`}
                </div>
              )}
            </div>

            {/* Avatar - overlapping header */}
            <div className="relative -mt-12 flex justify-center">
              {selectedAgent.avatarUrl ? (
                <img
                  src={selectedAgent.avatarUrl}
                  alt={selectedAgent.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg ${
                  selectedAgent.rank === 1
                    ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                    : selectedAgent.rank === 2
                      ? "bg-gradient-to-br from-gray-400 to-slate-500"
                      : selectedAgent.rank === 3
                        ? "bg-gradient-to-br from-orange-400 to-amber-500"
                        : "bg-gradient-to-br from-purple-400 to-indigo-500"
                }`}>
                  {selectedAgent.name[0]?.toUpperCase()}
                </div>
              )}
              {/* Online status */}
              <div className={`absolute bottom-0 right-1/2 translate-x-10 w-5 h-5 rounded-full border-3 border-white ${
                selectedAgent.availabilityStatus === "online" ? "bg-green-500" : selectedAgent.availabilityStatus === "busy" ? "bg-yellow-500" : "bg-gray-400"
              }`} />
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
              {/* Name and status */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  {selectedAgent.name}
                  {selectedAgent.featured && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                      Онцлох
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAgent.availabilityStatus === "online" ? "🟢 Онлайн" : selectedAgent.availabilityStatus === "busy" ? "🟡 Завгүй" : "⚫ Офлайн"}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(selectedAgent.avgRating) ? "text-yellow-400" : "text-gray-300"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-700 font-semibold">{selectedAgent.avgRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({selectedAgent.reviewCount} үнэлгээ)</span>
              </div>

              {/* Bio */}
              {selectedAgent.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Танилцуулга</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedAgent.bio}
                  </p>
                </div>
              )}

              {/* Specialties */}
              {selectedAgent.specialties && selectedAgent.specialties.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Мэргэшил</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{selectedAgent.successRate}%</p>
                  <p className="text-xs text-gray-500">Амжилтын хувь</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{selectedAgent.totalTransactions}</p>
                  <p className="text-xs text-gray-500">Нийт гүйлгээ</p>
                </div>
                {selectedAgent.experienceYears && selectedAgent.experienceYears > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{selectedAgent.experienceYears}</p>
                    <p className="text-xs text-gray-500">Жилийн туршлага</p>
                  </div>
                )}
                {selectedAgent.responseTime && (
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{selectedAgent.responseTime}</p>
                    <p className="text-xs text-gray-500">Хариу өгөх хугацаа</p>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                {selectedAgent.languages && selectedAgent.languages.length > 0 && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Хэл</p>
                      <p className="text-sm text-gray-700">{selectedAgent.languages.join(", ")}</p>
                    </div>
                  </div>
                )}
                {selectedAgent.workingHours && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Ажлын цаг</p>
                      <p className="text-sm text-gray-700">{selectedAgent.workingHours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
