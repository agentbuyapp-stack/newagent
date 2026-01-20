/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  type User,
  type Profile,
  type Order,
  type AgentReport,
  type BundleOrder,
} from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import ChatModal from "@/components/ChatModal";

import NewOrderForm from "@/components/dashboard/NewOrderForm";
import OrderHistorySection from "@/components/dashboard/OrderHistorySection";
import BundleOrderDetailModal from "@/components/dashboard/BundleOrderDetailModal";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bundleOrders, setBundleOrders] = useState<BundleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setShowProfileForm] = useState(false);
  const [, setShowProfileSection] = useState(false);

  const [showNewOrderSection, setShowNewOrderSection] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedBundleOrder, setSelectedBundleOrder] = useState<BundleOrder | null>(null);
  const [showBundleOrderModal, setShowBundleOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [agentReports, setAgentReports] = useState<
    Record<string, AgentReport | null>
  >({});
  const [showPaymentInfo] = useState<
    Record<string, boolean>
  >({});
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

  // Notification states
  const [hasOrderUpdates, setHasOrderUpdates] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: "order_update" | "message" | "track_code";
      title: string;
      message: string;
      orderId?: string;
      createdAt: Date;
    }>
  >([]);


  // Demo: Check for notifications (can be replaced with real API calls)
  useEffect(() => {
    if (orders.length > 0) {
      // Check for new messages/track codes (demo - replace with real check)
      setHasNewMessages(true); // Demo: always show for testing
    }
  }, [orders]);

  // Auto-open profile section and form if profile is incomplete or doesn't exist
  useEffect(() => {
    if (!loading && user) {
      const isComplete =
        profile && profile.name && profile.phone && profile.cargo;
      if (!profile || !isComplete) {
        setShowProfileSection(true);
        setShowProfileForm(true);
      }
    }
  }, [profile, loading, user]);

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

        // Load admin settings for payment info and exchange rate
        try {
          const settings = await apiClient.getAdminSettings();
          setAdminSettings(settings);
        } catch (err) {
          console.error("Failed to load admin settings:", err);
        }

        // Load orders
        try {
          const ordersData = await apiClient.getOrders();
          setOrders(ordersData);

          // Load bundle orders
          try {
            const bundleOrdersData = await apiClient.getBundleOrders();
            setBundleOrders(bundleOrdersData);
          } catch (err) {
            console.error("Failed to load bundle orders:", err);
          }

          // If modal is open and we have a selectedOrder, update it from fresh data
          // Preserve userPaymentVerified state if it was set locally
          if (showOrderModal && selectedOrder) {
            const refreshedOrder = ordersData.find(
              (o) => o.id === selectedOrder.id,
            );
            if (refreshedOrder) {
              // Preserve userPaymentVerified if it was set locally (from handlePaymentPaid)
              const preservedUserPaymentVerified =
                selectedOrder.userPaymentVerified ||
                refreshedOrder.userPaymentVerified;
              setSelectedOrder({
                ...refreshedOrder,
                userPaymentVerified: preservedUserPaymentVerified,
              });
            }
          }

          // Load agent reports for orders that have agent assigned (including completed orders)
          ordersData.forEach((order) => {
            if (
              order.agentId &&
              (order.status === "agent_sudlaj_bn" ||
                order.status === "tolbor_huleej_bn" ||
                order.status === "amjilttai_zahialga")
            ) {
              loadAgentReport(order.id);
            }
          });

          // Check for order updates (status changed, new track code, etc.)
          const hasUpdates = ordersData.some((order) => {
            // Check if order status changed or has recent updates
            const orderDate = new Date(order.updatedAt);
            const now = new Date();
            const hoursSinceUpdate =
              (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
            // Show notification if updated in last 24 hours and status is not agent_sudlaj_bn
            return hoursSinceUpdate < 24 && order.status !== "agent_sudlaj_bn";
          });
          setHasOrderUpdates(hasUpdates);

          // Generate notifications from orders
          const generatedNotifications: Array<{
            id: string;
            type: "order_update" | "message" | "track_code";
            title: string;
            message: string;
            orderId?: string;
            createdAt: Date;
          }> = [];

          ordersData.forEach((order) => {
            const orderDate = new Date(order.updatedAt);
            const now = new Date();
            const hoursSinceUpdate =
              (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

            // Order status update notifications
            if (hoursSinceUpdate < 24 && order.status !== "agent_sudlaj_bn") {
              const statusText =
                order.status === "tolbor_huleej_bn"
                  ? "Төлбөр хүлээж байна"
                  : order.status === "amjilttai_zahialga"
                    ? "Амжилттай захиалга"
                    : order.status === "tsutsalsan_zahialga"
                      ? "Цуцлагдсан захиалга"
                      : "";

              generatedNotifications.push({
                id: `order-${order.id}-${order.status}`,
                type: "order_update",
                title: "Захиалга өөрчлөгдсөн",
                message: `${order.productName} захиалгын статус: ${statusText}`,
                orderId: order.id,
                createdAt: new Date(order.updatedAt),
              });
            }
          });

          // Demo: Add message notifications
          if (hasNewMessages) {
            generatedNotifications.push({
              id: "message-1",
              type: "message",
              title: "Шинэ мессеж",
              message: "Таны захиалгатай холбоотой шинэ мессеж ирсэн байна.",
              createdAt: new Date(),
            });
            generatedNotifications.push({
              id: "track-1",
              type: "track_code",
              title: "Трак код",
              message: "Таны захиалганд шинэ трак код нэмэгдлээ.",
              createdAt: new Date(),
            });
          }

          setNotifications(generatedNotifications);
          setNotificationCount(generatedNotifications.length);
        } catch {
          // Orders might not exist yet, that's okay
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
            const errorMessage = retryErr instanceof Error ? retryErr.message : "Алдаа гарлаа";
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProfileSuccess = async () => {
    await loadData();
    setShowProfileForm(false);
  };

  const handleOrderSuccess = async () => {
    await loadData();
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Та энэ захиалгыг цуцлахдаа итгэлтэй байна уу?")) {
      return;
    }

    try {
      await apiClient.cancelOrder(orderId);
      await loadData();
      setShowOrderModal(false);
      alert("Захиалга амжилттай цуцлагдлаа");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
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
    if (
      !confirm(
        "Та төлбөр төлсөн эсэхийг баталгаажуулахдаа итгэлтэй байна уу? Admin-д хүсэлт илгээгдэнэ.",
      )
    ) {
      return;
    }

    try {
      // Call API to confirm user payment
      await apiClient.request<Order>(
        `/orders/${orderId}/user-payment-confirmed`,
        {
          method: "PUT",
        },
      );

      alert(
        "Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ. Admin баталгаажуулахад хүлээнэ үү.",
      );

      // Update selectedOrder state immediately with the updated order from API response
      // Ensure userPaymentVerified is set to true
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          userPaymentVerified: true,
        });
      }

      // Reload data to get updated orders list
      // Note: loadData will preserve userPaymentVerified if it was set
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm(`"${order.productName}" захиалгыг устгахдаа итгэлтэй байна уу?`)) {
      return;
    }

    try {
      await apiClient.cancelOrder(order.id);
      await loadData();
      alert("Захиалга амжилттай устгагдлаа");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  };

  const handleDeleteBundleOrder = async (bundleOrder: BundleOrder) => {
    if (!confirm(`Багц захиалга (${bundleOrder.items.length} бараа)-г устгахдаа итгэлтэй байна уу?`)) {
      return;
    }

    try {
      await apiClient.deleteBundleOrder(bundleOrder.id);
      await loadData();
      alert("Багц захиалга амжилттай устгагдлаа");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
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
          {/* Order Section - Only show if profile is complete */}
          {isProfileComplete ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {/* Box 1: Омнох захиалгууд */}

              {/* Box 2: Шинэ захиалга үүсгэх */}
              <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div
                  className="flex justify-between items-center mb-5 cursor-pointer hover:bg-gray-50 -mx-5 -mt-5 px-5 pt-5 pb-3 rounded-t-2xl transition-colors"
                  onClick={() => setShowNewOrderSection(!showNewOrderSection)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Шинэ захиалга үүсгэх
                    </h2>
                  </div>
                  <div className="p-2 text-gray-600">
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${showNewOrderSection ? "rotate-90" : ""}`}
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
                  </div>
                </div>

                {showNewOrderSection && (
                  <NewOrderForm onSuccess={handleOrderSuccess} />
                )}
              </div>
              <OrderHistorySection
                orders={orders}
                bundleOrders={bundleOrders}
                notifications={notifications}
                hasOrderUpdates={hasOrderUpdates}
                hasNewMessages={hasNewMessages}
                notificationCount={notificationCount}
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
                  // TODO: Open chat for bundle order
                  console.log("Open chat for bundle:", bundleOrder);
                }}
                onViewReport={(order) => {
                  setSelectedOrder(order);
                  setShowOrderModal(true);
                }}
                onDeleteOrder={handleDeleteOrder}
                onDeleteBundleOrder={handleDeleteBundleOrder}
                onReload={loadData}
              />
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                Захиалга үүсгэхийн тулд эхлээд профайлаа бүрэн бөглөнө үү (Нэр,
                Утас, Ачаа).
              </p>
            </div>
          )}
        </div>
      </main>

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
              case "niitlegdsen": return "bg-gray-100 text-gray-700";
              case "agent_sudlaj_bn": return "bg-amber-100 text-amber-700";
              case "tolbor_huleej_bn": return "bg-blue-100 text-blue-700";
              case "amjilttai_zahialga": return "bg-emerald-100 text-emerald-700";
              case "tsutsalsan_zahialga": return "bg-red-100 text-red-700";
              default: return "bg-gray-100 text-gray-700";
            }
          };

          const getStatusText = (status: string) => {
            switch (status) {
              case "niitlegdsen": return "Шинэ захиалга";
              case "agent_sudlaj_bn": return "Судлагдаж байна";
              case "tolbor_huleej_bn": return "Төлбөр хүлээж байна";
              case "amjilttai_zahialga": return "Амжилттай";
              case "tsutsalsan_zahialga": return "Цуцлагдсан";
              default: return status;
            }
          };

          const getStatusIcon = (status: string) => {
            switch (status) {
              case "niitlegdsen":
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />;
              case "agent_sudlaj_bn":
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
              case "tolbor_huleej_bn":
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
              case "amjilttai_zahialga":
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />;
              case "tsutsalsan_zahialga":
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />;
              default:
                return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
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
                        <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Title and Status */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                        {selectedOrder.productName}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {getStatusIcon(selectedOrder.status)}
                          </svg>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1.5">
                        {new Date(selectedOrder.createdAt).toLocaleDateString("mn-MN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all min-h-10 min-w-10"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5">
                  {/* Track Code - Priority display for successful orders */}
                  {selectedOrder.status === "amjilttai_zahialga" && selectedOrder.trackCode && (
                    <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Трак код</p>
                          <p className="text-lg font-bold text-emerald-800 font-mono truncate">{selectedOrder.trackCode}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrder.trackCode || "");
                            alert("Track code хуулагдлаа!");
                          }}
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Хуулах
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Product Details Card */}
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setShowUserInfoInModal(!showUserInfoInModal)}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900">Барааны мэдээлэл</span>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showUserInfoInModal ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showUserInfoInModal && (
                      <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
                        {/* Images Gallery */}
                        {selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Зурагнууд</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {selectedOrder.imageUrls.map((imgUrl, index) => (
                                <div
                                  key={index}
                                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-blue-300"
                                  onClick={() => setZoomedImageIndex(zoomedImageIndex === index ? null : index)}
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`${selectedOrder.productName} - ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                            {/* Zoomed Image Modal */}
                            {zoomedImageIndex !== null && (
                              <div
                                className="fixed inset-0 bg-black/90 flex items-center justify-center z-70 p-4"
                                onClick={() => setZoomedImageIndex(null)}
                              >
                                <img
                                  src={selectedOrder.imageUrls[zoomedImageIndex]}
                                  alt={`${selectedOrder.productName} - ${zoomedImageIndex + 1}`}
                                  className="max-w-full max-h-full object-contain rounded-xl"
                                />
                                <button
                                  onClick={() => setZoomedImageIndex(null)}
                                  className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Product Name */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Барааны нэр</p>
                          <p className="text-base font-semibold text-gray-900 mt-1">{selectedOrder.productName}</p>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Тайлбар</p>
                          {selectedOrder.description &&
                          selectedOrder.description.includes(":") &&
                          selectedOrder.description.split("\n\n").length > 1 ? (
                            <div className="space-y-2">
                              {selectedOrder.description.split("\n\n").map((productDesc, idx) => {
                                const [productName, ...descParts] = productDesc.split(": ");
                                const productDescription = descParts.join(": ");
                                return (
                                  <div key={idx} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-900">{productName}</p>
                                    {productDescription && (
                                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{productDescription}</p>
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
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Захиалгын ID</p>
                          <p className="text-xs font-mono text-gray-600 mt-1 break-all">{selectedOrder.id}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Agent Report Section */}
                  {hasAgentReport && currentReport && (
                    <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-linear-to-r from-indigo-500 to-purple-500">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="font-semibold text-white">Agent тайлан</h3>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Payment Amount */}
                        <div className="bg-white rounded-xl p-4 border border-indigo-100">
                          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Төлөх дүн</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {(() => {
                              const exchangeRate = adminSettings?.exchangeRate || paymentInfo[selectedOrder.id]?.exchangeRate || 1;
                              const calculatedAmount = calculateUserPaymentAmount(currentReport, exchangeRate);
                              return calculatedAmount.toLocaleString();
                            })()}
                            <span className="text-lg font-semibold text-gray-500 ml-1">₮</span>
                          </p>
                        </div>

                        {/* Quantity */}
                        {currentReport.quantity && (
                          <div className="flex items-center justify-between py-2 border-b border-indigo-100">
                            <span className="text-sm text-gray-600">Тоо ширхэг</span>
                            <span className="font-semibold text-gray-900">{currentReport.quantity}</span>
                          </div>
                        )}

                        {/* Additional Description */}
                        {currentReport.additionalDescription && (
                          <div>
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Нэмэлт тайлбар</p>
                            <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-indigo-100 whitespace-pre-wrap">
                              {currentReport.additionalDescription}
                            </p>
                          </div>
                        )}

                        {/* Additional Images */}
                        {currentReport.additionalImages && currentReport.additionalImages.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">Нэмэлт зурагнууд</p>
                            <div className="grid grid-cols-3 gap-2">
                              {currentReport.additionalImages.map((imgUrl, idx) => (
                                <div key={idx} className="aspect-square bg-white rounded-lg overflow-hidden border border-indigo-100">
                                  <img src={imgUrl} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
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
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <h3 className="font-semibold text-white">Төлбөр шилжүүлэх данс</h3>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {(() => {
                            const accountInfo = paymentInfo[selectedOrder.id] || adminSettings;
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
                                  <p className="font-semibold text-gray-900">{info?.bank}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-amber-100">
                                  <p className="text-xs text-gray-500">Дансны нэр</p>
                                  <p className="font-semibold text-gray-900">{info?.accountName}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-amber-100">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500">Дансны дугаар</p>
                                      <p className="font-bold text-gray-900 font-mono text-lg">{info?.accountNumber}</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(info?.accountNumber || "");
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
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-yellow-800">Төлбөр баталгаажуулахыг хүлээж байна</p>
                            <p className="text-sm text-yellow-700 mt-1">Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ.</p>
                          </div>
                        </div>
                      )}

                      {/* Payment Action Buttons */}
                      {!selectedOrder.userPaymentVerified && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handlePaymentPaid(selectedOrder.id)}
                            className="flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Төлбөр төлсөн
                          </button>
                          <button
                            onClick={() => handleCancelOrder(selectedOrder.id)}
                            className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors border border-red-200"
                          >
                            Цуцлах
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates Section */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(selectedOrder.createdAt).toLocaleDateString("mn-MN", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>
                        {new Date(selectedOrder.updatedAt).toLocaleDateString("mn-MN", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Чат нээх
                      </button>
                    )}

                    {/* Cancel/Delete Button */}
                    {canCancelOrder(selectedOrder) && (
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Захиалга устгах
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
        />
      )}
    </div>
  );
}
