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

  // Action loading states
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);


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
          apiClient.getPublicAgents(),
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
        if (agentsResult.status === "fulfilled") {
          setAgents(agentsResult.value);
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
    <div className="min-h-screen bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF]">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Order Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Box 1: Шинэ захиалга үүсгэх */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
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
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      Шинэ захиалга үүсгэх
                    </h3>
                    <p className="text-xs text-gray-500">Бараа захиалах</p>
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
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
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
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">
                          Каргонууд
                        </h3>
                        <p className="text-xs text-gray-500">
                          Түншлэгч карго компаниуд ({cargos.length})
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showCargos ? "rotate-180" : ""}`}
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
                          className="relative rounded-xl overflow-hidden border border-orange-100 hover:border-orange-200 hover:shadow-lg transition-all min-h-55"
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
                            <div className="absolute inset-0 bg-linear-to-br from-white to-orange-50/50" />
                          )}

                          {/* Content positioned at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4
                              className={`font-bold text-base sm:text-lg ${cargo.imageUrl ? "text-white drop-shadow-md" : "text-gray-900"}`}
                            >
                              {cargo.name}
                            </h4>
                            {cargo.description && (
                              <p
                                className={`text-xs mt-1 ${cargo.imageUrl ? "text-gray-100" : "text-gray-500"}`}
                              >
                                {cargo.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              {cargo.phone && (
                                <a
                                  href={`tel:${cargo.phone}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-orange-50 hover:bg-orange-100 text-orange-700"}`}
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
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-blue-50 hover:bg-blue-100 text-blue-700"}`}
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
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"}`}
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
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${cargo.imageUrl ? "bg-white/20 hover:bg-white/30 text-white" : "bg-green-50 hover:bg-green-100 text-green-700"}`}
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
              {agents.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowAgents(!showAgents)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
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
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">
                          Агентууд
                        </h3>
                        <p className="text-xs text-gray-500">
                          Манай агентууд ({agents.length})
                        </p>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showAgents ? "rotate-180" : ""}`}
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
                    <div className="mt-4 space-y-3">
                      {agents.slice(0, 10).map((agent, index) => (
                        <div
                          key={agent.id}
                          className="bg-linear-to-br from-white to-purple-50/50 border border-purple-100 rounded-xl p-4 hover:border-purple-200 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                  index < 5
                                    ? "bg-linear-to-br from-purple-500 to-indigo-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                #{index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {agent.name}
                                </h4>
                                {agent.email && (
                                  <p className="text-xs text-gray-500 truncate max-w-37.5">
                                    {agent.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-purple-600">
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
                                <span className="font-bold text-sm">
                                  {agent.orderCount}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">захиалга</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

                  {/* Agent Report Section */}
                  {hasAgentReport && currentReport && (
                    <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-linear-to-r from-indigo-500 to-purple-500">
                        <div className="flex items-center gap-2">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <h3 className="font-semibold text-white">
                            Agent тайлан
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Payment Amount */}
                        <div className="bg-white rounded-xl p-4 border border-indigo-100">
                          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                            Төлөх дүн
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {(() => {
                              const exchangeRate =
                                adminSettings?.exchangeRate ||
                                paymentInfo[selectedOrder.id]?.exchangeRate ||
                                1;
                              const calculatedAmount =
                                calculateUserPaymentAmount(
                                  currentReport,
                                  exchangeRate,
                                );
                              return calculatedAmount.toLocaleString();
                            })()}
                            <span className="text-lg font-semibold text-gray-500 ml-1">
                              ₮
                            </span>
                          </p>
                        </div>

                        {/* Quantity */}
                        {currentReport.quantity && (
                          <div className="flex items-center justify-between py-2 border-b border-indigo-100">
                            <span className="text-sm text-gray-600">
                              Тоо ширхэг
                            </span>
                            <span className="font-semibold text-gray-900">
                              {currentReport.quantity}
                            </span>
                          </div>
                        )}

                        {/* Additional Description */}
                        {currentReport.additionalDescription && (
                          <div>
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
                              Нэмэлт тайлбар
                            </p>
                            <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-indigo-100 whitespace-pre-wrap">
                              {currentReport.additionalDescription}
                            </p>
                          </div>
                        )}

                        {/* Additional Images */}
                        {currentReport.additionalImages &&
                          currentReport.additionalImages.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
                                Нэмэлт зурагнууд
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {currentReport.additionalImages.map(
                                  (imgUrl, idx) => (
                                    <div
                                      key={idx}
                                      className="aspect-square bg-white rounded-lg overflow-hidden border border-indigo-100"
                                    >
                                      <img
                                        src={imgUrl}
                                        alt={`Additional ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Payment Section for tolbor_huleej_bn status */}
                  {selectedOrder.status === "tolbor_huleej_bn" && (
                    <div className="space-y-4">
                      {/* Bank Account Info */}
                      <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
                        <div className="px-4 py-3 bg-linear-to-r from-amber-500 to-orange-500">
                          <div className="flex items-center gap-2">
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
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                            <h3 className="font-semibold text-white">
                              Төлбөр шилжүүлэх данс
                            </h3>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {(() => {
                            const accountInfo =
                              paymentInfo[selectedOrder.id] || adminSettings;
                            if (!accountInfo && !adminSettings) {
                              if (!showPaymentInfo[selectedOrder.id]) {
                                loadPaymentInfo(selectedOrder.id);
                              }
                              return (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                                </div>
                              );
                            }
                            const info = accountInfo || adminSettings;
                            return (
                              <>
                                <div className="bg-white rounded-lg p-3 border border-amber-100">
                                  <p className="text-xs text-gray-500">Банк</p>
                                  <p className="font-semibold text-gray-900">
                                    {info?.bank}
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-amber-100">
                                  <p className="text-xs text-gray-500">
                                    Дансны нэр
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {info?.accountName}
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-amber-100">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        Дансны дугаар
                                      </p>
                                      <p className="font-bold text-gray-900 font-mono text-lg">
                                        {info?.accountNumber}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          info?.accountNumber || "",
                                        );
                                        alert("Дансны дугаар хуулагдлаа!");
                                      }}
                                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                                    >
                                      Хуулах
                                    </button>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Payment Status Message */}
                      {selectedOrder.userPaymentVerified && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                            <svg
                              className="w-5 h-5 text-yellow-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-yellow-800">
                              Төлбөр баталгаажуулахыг хүлээж байна
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Payment Action Buttons */}
                      {!selectedOrder.userPaymentVerified && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handlePaymentPaid(selectedOrder.id)}
                            disabled={paymentLoading}
                            className="flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {paymentLoading ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            {paymentLoading
                              ? "Уншиж байна..."
                              : "Төлбөр төлсөн"}
                          </button>
                          <button
                            onClick={() => handleCancelOrder(selectedOrder.id)}
                            disabled={cancelLoading}
                            className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors border border-red-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancelLoading && (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            )}
                            {cancelLoading ? "..." : "Цуцлах"}
                          </button>
                        </div>
                      )}
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

                    {/* Cancel/Delete Button */}
                    {canCancelOrder(selectedOrder) && (
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
          onOpenChat={(bundleOrder) => {
            setSelectedBundleOrder(null);
            setShowBundleOrderModal(false);
            setChatOrder(bundleOrder);
            setShowChatModal(true);
          }}
        />
      )}
    </div>
  );
}
