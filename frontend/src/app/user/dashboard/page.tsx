"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  type User,
  type Profile,
  type Order,
  type OrderData,
  type AgentReport,
  type BundleOrder,
} from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import ProfileForm from "@/components/ProfileForm";
import ChatModal from "@/components/ChatModal";

import NewOrderForm from "@/components/dashboard/NewOrderForm";
import OrderHistorySection, { NotificationItem } from "@/components/dashboard/OrderHistorySection";
import OrderModal from "@/components/dashboard/OrderModal";
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
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showProfileSection, setShowProfileSection] = useState(false);

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
  const [expandedReportOrderId, setExpandedReportOrderId] = useState<
    string | null
  >(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState<
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
  }, [isLoaded, clerkUser, router]);

  const loadAgentReport = async (orderId: string) => {
    try {
      const report = await apiClient.getAgentReport(orderId);
      setAgentReports((prev) => ({ ...prev, [orderId]: report }));
    } catch (err) {
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
        } catch (err) {
          // Orders might not exist yet, that's okay
        }
      } catch (err: any) {
        // If user doesn't exist, the backend will create it automatically via Clerk middleware
        // Just retry after a moment
        setTimeout(async () => {
          try {
            const userData = await apiClient.getMe();
            setUser(userData);
            if (userData.profile) {
              setProfile(userData.profile);
            }
          } catch (retryErr: any) {
            setError(retryErr.message || "Алдаа гарлаа");
          }
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
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
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
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
    } catch (err: any) {
      alert(err.message || "Алдаа гарлаа");
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
    } catch (err: any) {
      console.error("Failed to load payment info:", err);
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
      return agentReport.userAmount * exchangeRate * 1.05;
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

          return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
              <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Захиалгын дэлгэрэнгүй
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors min-h-10 min-w-10"
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

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Order ID */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Захиалгын ID
                    </label>
                    <p className="text-lg font-mono text-gray-900 mt-1">
                      {selectedOrder.id}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Статус
                    </label>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOrder.status === "niitlegdsen"
                            ? "bg-gray-100 text-gray-800"
                            : selectedOrder.status === "agent_sudlaj_bn"
                              ? "bg-yellow-100 text-yellow-800"
                              : selectedOrder.status === "tolbor_huleej_bn"
                                ? "bg-blue-100 text-blue-800"
                                : selectedOrder.status === "amjilttai_zahialga"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                        }`}
                      >
                        {selectedOrder.status === "niitlegdsen"
                          ? "Нийтэлсэн"
                          : selectedOrder.status === "agent_sudlaj_bn"
                            ? "Agent шалгаж байна"
                            : selectedOrder.status === "tolbor_huleej_bn"
                              ? "Төлбөр хүлээж байна"
                              : selectedOrder.status === "amjilttai_zahialga"
                                ? "Амжилттай захиалга"
                                : "Цуцлагдсан захиалга"}
                      </span>
                    </div>
                  </div>

                  {/* User Info Section - Collapsible */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <button
                      onClick={() =>
                        setShowUserInfoInModal(!showUserInfoInModal)
                      }
                      className="w-full flex items-center justify-between text-left"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">
                        Хэрэглэгчийн мэдээлэл
                      </h3>
                      <svg
                        className={`w-5 h-5 transition-transform ${showUserInfoInModal ? "rotate-180" : ""}`}
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
                      <div className="mt-4 space-y-4">
                        {/* Images */}
                        {selectedOrder.imageUrls &&
                          selectedOrder.imageUrls.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 mb-2 block">
                                Зургууд
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {selectedOrder.imageUrls.map(
                                  (imgUrl, index) => (
                                    <img
                                      key={index}
                                      src={imgUrl}
                                      alt={`${selectedOrder.productName} - ${index + 1}`}
                                      className="w-full h-32 object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() =>
                                        setZoomedImageIndex(
                                          zoomedImageIndex === index
                                            ? null
                                            : index,
                                        )
                                      }
                                    />
                                  ),
                                )}
                              </div>
                              {zoomedImageIndex !== null && (
                                <div
                                  className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4"
                                  onClick={() => setZoomedImageIndex(null)}
                                >
                                  <img
                                    src={
                                      selectedOrder.imageUrls[zoomedImageIndex]
                                    }
                                    alt={`${selectedOrder.productName} - ${zoomedImageIndex + 1}`}
                                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setZoomedImageIndex(null);
                                    }}
                                  />
                                  <button
                                    onClick={() => setZoomedImageIndex(null)}
                                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition"
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
                          <label className="text-sm font-medium text-gray-500">
                            Барааны нэр
                          </label>
                          <p className="text-base font-semibold text-gray-900 mt-1">
                            {selectedOrder.productName}
                          </p>
                        </div>

                        {/* Description - Parse multiple products */}
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Тайлбар
                          </label>
                          {selectedOrder.description &&
                          selectedOrder.description.includes(":") &&
                          selectedOrder.description.split("\n\n").length > 1 ? (
                            <div className="mt-2 space-y-2">
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
                                      className="bg-blue-50 border border-blue-200 rounded-xl p-3"
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
                            <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                              {selectedOrder.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show Agent Report if exists */}
                  {hasAgentReport && currentReport ? (
                    <>
                      {/* Agent Report Section */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Agent-ийн тайлан
                        </h3>

                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            Хэрэглэгчийн төлөх дүн:
                          </label>
                          <p className="text-lg font-semibold text-green-600 mt-1">
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
                            })()}{" "}
                            ₮
                          </p>
                        </div>

                        {currentReport.quantity && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Тоо ширхэг:
                            </label>
                            <p className="text-gray-900 mt-1">
                              {currentReport.quantity}
                            </p>
                          </div>
                        )}

                        {currentReport.additionalDescription && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">
                              Нэмэлт тайлбар:
                            </label>
                            <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                              {currentReport.additionalDescription}
                            </p>
                          </div>
                        )}

                        {currentReport.additionalImages &&
                          currentReport.additionalImages.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-600 mb-2 block">
                                Нэмэлт зураг:
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {currentReport.additionalImages.map(
                                  (imgUrl, idx) => (
                                    <img
                                      key={idx}
                                      src={imgUrl}
                                      alt={`Additional ${idx + 1}`}
                                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                                    />
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Action Buttons for orders with agent report */}
                      {selectedOrder.status === "tolbor_huleej_bn" && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          {/* Always show admin account info for tolbor_huleej_bn status */}
                          {(() => {
                            // Load payment info if not loaded yet
                            if (
                              !paymentInfo[selectedOrder.id] &&
                              adminSettings
                            ) {
                              // Use adminSettings if available
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Дансны дугаар:
                                    </label>
                                    <p className="text-gray-900 font-mono">
                                      {adminSettings.accountNumber}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Дансны нэр:
                                    </label>
                                    <p className="text-gray-900">
                                      {adminSettings.accountName}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Банк:
                                    </label>
                                    <p className="text-gray-900">
                                      {adminSettings.bank}
                                    </p>
                                  </div>
                                </div>
                              );
                            } else if (paymentInfo[selectedOrder.id]) {
                              // Use paymentInfo if available
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      Дансны дугаар:
                                    </label>
                                    <p className="text-gray-900 font-mono">
                                      {
                                        paymentInfo[selectedOrder.id]
                                          ?.accountNumber
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      Дансны нэр:
                                    </label>
                                    <p className="text-gray-900">
                                      {
                                        paymentInfo[selectedOrder.id]
                                          ?.accountName
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">
                                      Банк:
                                    </label>
                                    <p className="text-gray-900">
                                      {paymentInfo[selectedOrder.id]?.bank}
                                    </p>
                                  </div>
                                </div>
                              );
                            } else {
                              // Load payment info if not available
                              if (!showPaymentInfo[selectedOrder.id]) {
                                loadPaymentInfo(selectedOrder.id);
                              }
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                  <p className="text-sm text-gray-500 text-center">
                                    Ачааллаж байна...
                                  </p>
                                </div>
                              );
                            }
                          })()}

                          {/* If payment is verified, show waiting message */}
                          {selectedOrder.userPaymentVerified && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                              <p className="text-sm text-yellow-800 font-medium">
                                Төлбөр төлсөн мэдээлэл admin-д илгээгдлээ. Admin
                                баталгаажуулахад хүлээнэ үү.
                              </p>
                            </div>
                          )}

                          {/* Payment and Cancel Buttons - Only show if payment not verified */}
                          {!selectedOrder.userPaymentVerified && (
                            <>
                              <button
                                onClick={() =>
                                  handlePaymentPaid(selectedOrder.id)
                                }
                                className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-[11]"
                              >
                                Төлбөр төлсөн
                              </button>

                              <button
                                onClick={() =>
                                  handleCancelOrder(selectedOrder.id)
                                }
                                className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[11]"
                              >
                                Цуцлах
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : null}

                  {/* Track Code - Show for successful orders */}
                  {selectedOrder.status === "amjilttai_zahialga" &&
                    selectedOrder.trackCode && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-600">
                              Track Code
                            </label>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  selectedOrder.trackCode || "",
                                );
                                alert("Track code хуулагдлаа!");
                              }}
                              className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1 min-h-[10]"
                              title="Хуулах"
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
                              <span className="text-xs font-medium">
                                Хуулах
                              </span>
                            </button>
                          </div>
                          <p
                            className="text-base font-mono text-blue-500 font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                selectedOrder.trackCode || "",
                              );
                              alert("Track code хуулагдлаа!");
                            }}
                            title="Хуулах"
                          >
                            {selectedOrder.trackCode}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Таны захиалгын track code. Энэ кодыг ашиглан
                            захиалгаа хянах боломжтой.
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Үүсгэсэн огноо
                      </label>
                      <p className="text-gray-700 mt-1">
                        {new Date(selectedOrder.createdAt).toLocaleDateString(
                          "mn-MN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Шинэчлэгдсэн огноо
                      </label>
                      <p className="text-gray-700 mt-1">
                        {new Date(selectedOrder.updatedAt).toLocaleDateString(
                          "mn-MN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Chat Button - Show for all orders (including niitlegdsen) */}
                  {(selectedOrder.status === "niitlegdsen" ||
                    selectedOrder.status === "agent_sudlaj_bn" ||
                    selectedOrder.status === "tolbor_huleej_bn" ||
                    selectedOrder.status === "amjilttai_zahialga") && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setChatOrder(selectedOrder);
                          setShowChatModal(true);
                        }}
                        className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium mb-2 flex items-center justify-center gap-2 min-h-[11]"
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
                    </div>
                  )}

                  {/* Cancel Button - Only for cancellable orders */}
                  {canCancelOrder(selectedOrder) && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="w-full px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-[11]"
                      >
                        Захиалга цуцлах / Устгах
                      </button>
                    </div>
                  )}
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
