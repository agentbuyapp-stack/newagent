"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  type User,
  type Order,
  type OrderStatus,
  type AgentReport,
  type RewardRequest,
  type Cargo,
  type BundleOrder,
} from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";
import {
  RewardsSection,
  OrderDetailHeader,
  UserContactInfo,
  OrderDates,
  MyOrderCard,
} from "@/components/agent";

// Lazy load modals - only loaded when needed
const ChatModal = dynamic(() => import("@/components/ChatModal"), { ssr: false });
const AgentReportForm = dynamic(() => import("@/components/AgentReportForm"), { ssr: false });
const BundleReportForm = dynamic(() => import("@/components/BundleReportForm"), { ssr: false });
const CancelOrderModal = dynamic(() => import("@/components/agent/CancelOrderModal"), { ssr: false });

// Bundle Item Dropdown Component
function BundleItemDropdown({ item, index }: { item: BundleOrder["items"][0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {item.imageUrls && item.imageUrls[0] ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0 relative">
              <Image src={item.imageUrls[0]} alt={item.productName} fill sizes="40px" className="object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-gray-900">{item.productName}</p>
            <p className="text-xs text-gray-500">Бараа #{index + 1}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-3 space-y-3 bg-white">
          {/* Images */}
          {item.imageUrls && item.imageUrls.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Зурагнууд</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {item.imageUrls.map((imgUrl, imgIndex) => (
                  <div key={imgIndex} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                    <Image src={imgUrl} alt={`${item.productName} - ${imgIndex + 1}`} fill sizes="100px" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Description */}
          {item.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Тайлбар</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">{item.description}</p>
            </div>
          )}
          {/* Agent Report if exists */}
          {item.agentReport && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs font-medium text-green-800 mb-2">Agent тайлан</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-green-700">Үнэ: <strong>{item.agentReport.userAmount?.toLocaleString()}₮</strong></span>
                {item.agentReport.quantity && <span className="text-gray-600">Тоо: x{item.agentReport.quantity}</span>}
              </div>
              {item.agentReport.paymentLink && (
                <a href={item.agentReport.paymentLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-2 block">
                  Төлбөрийн линк
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentDashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const apiClient = useApiClient();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportOrder, setReportOrder] = useState<Order | null>(null);
  // Bundle report states
  const [showBundleReportForm, setShowBundleReportForm] = useState(false);
  const [bundleReportOrder, setBundleReportOrder] = useState<Order | null>(null);
  const [showPublishedOrders, setShowPublishedOrders] = useState(true);
  const [showMyOrders, setShowMyOrders] = useState(true);
  const [showRewards, setShowRewards] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [orderFilter, setOrderFilter] = useState<
    "active" | "completed" | "cancelled" | "archived"
  >("active");
  const [agentReports, setAgentReports] = useState<
    Record<string, AgentReport | null>
  >({});
  const [adminSettings, setAdminSettings] = useState<{
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    exchangeRate?: number;
  } | null>(null);
  const [showUserInfoInModal, setShowUserInfoInModal] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [showAgentReportInModal, setShowAgentReportInModal] = useState(false);
  const [trackCodeInput, setTrackCodeInput] = useState("");
  const [isEditingTrackCode, setIsEditingTrackCode] = useState(false);
  const [trackCodeLoading, setTrackCodeLoading] = useState(false);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [showCargos, setShowCargos] = useState(false);

  // Edit report states
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editReportAmount, setEditReportAmount] = useState<number>(0);
  const [editReportReason, setEditReportReason] = useState("");
  const [editReportLoading, setEditReportLoading] = useState(false);

  // Action loading states
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Cancel order modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Load agent report when order modal opens
  useEffect(() => {
    if (showOrderModal && selectedOrder && user?.id) {
      // Check if this order is in "myOrders" (agent's own orders)
      // Calculate myOrders here to avoid dependency issues
      const calculatedMyOrders = orders.filter((order) => {
        if (user?.role === "admin") {
          return order.status !== "niitlegdsen";
        }
        return (
          order.agentId === user?.id &&
          (order.status === "agent_sudlaj_bn" ||
            order.status === "tolbor_huleej_bn" ||
            order.status === "amjilttai_zahialga")
        );
      });
      const isMyOrder = calculatedMyOrders.some(
        (order) => order.id === selectedOrder.id,
      );

      // Load report if current user is the agent for this order (skip for bundle orders - they have per-item reports)
      const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
      if (
        !isBundleOrder &&
        selectedOrder.agentId === user.id &&
        agentReports[selectedOrder.id] === undefined
      ) {
        loadAgentReport(selectedOrder.id);
      }

      // If agent report exists, collapse user info by default and expand agent report
      // Bundle orders have per-item reports, so skip the single agent report dropdown
      if (isBundleOrder) {
        setShowUserInfoInModal(true);
        setShowAgentReportInModal(false); // Bundle orders show reports in item dropdowns
      } else if (agentReports[selectedOrder.id]) {
        setShowUserInfoInModal(false);
        setShowAgentReportInModal(true);
      } else if (isMyOrder || selectedOrder.agentId === user.id) {
        // If order is in "myOrders" or user is the agent, show agent report dropdown
        setShowUserInfoInModal(true);
        setShowAgentReportInModal(true); // Show dropdown even if report not loaded yet
      } else {
        setShowUserInfoInModal(true);
        setShowAgentReportInModal(false);
      }

      // Reset track code input when modal opens (only if not editing)
      if (!isEditingTrackCode) {
        setTrackCodeInput(selectedOrder.trackCode || "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showOrderModal,
    selectedOrder?.id,
    selectedOrder?.agentId,
    selectedOrder?.trackCode,
    user?.id,
    user?.role,
    agentReports,
    orders,
    isEditingTrackCode,
  ]);

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

  const loadData = async () => {
    if (!clerkUser) return;

    try {
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

        // User role cannot access agent dashboard - only admin can assign agent role
        if (userData.role === "user") {
          setError("Та agent эрхгүй байна. Admin-аас agent эрх авах хэрэгтэй.");
          setLoading(false);
          return;
        }
        // Allow both admin and agent roles to access agent dashboard
        // Admin can access all dashboards (user, agent, admin)
        if (userData.role !== "agent" && userData.role !== "admin") {
          setError("Та agent эрхгүй байна");
          setLoading(false);
          return;
        }

        setIsApproved(userData.isApproved || false);

        // Load all orders (Approved agents can see all orders, unapproved only see their own)
        try {
          // Fetch both regular orders and bundle orders in parallel
          const [ordersData, bundleOrdersData] = await Promise.all([
            apiClient.getOrders(),
            apiClient.getBundleOrders().catch(() => [] as BundleOrder[]),
          ]);

          // Convert BundleOrder to Order format for unified display
          const convertedBundleOrders: Order[] = bundleOrdersData.map((bundle) => {
            // Show first 2 item names, with "+N" if more
            const itemNames = bundle.items.slice(0, 2).map((i) => i.productName);
            const remaining = bundle.items.length - 2;
            const productName = remaining > 0
              ? `${itemNames.join(", ")} +${remaining}`
              : itemNames.join(", ") || "Багц захиалга";

            // Find first item with images for thumbnail
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
              archivedByUser: false,
              archivedByAgent: false,
              createdAt: bundle.createdAt,
              updatedAt: bundle.updatedAt,
              user: bundle.user,
              isBundleOrder: true,
              bundleItems: bundle.items, // Store original items for modal display
              reportMode: bundle.reportMode, // Store report mode
              bundleReport: bundle.bundleReport, // Store bundle-level report for single mode
              userSnapshot: bundle.userSnapshot, // Store user info snapshot for display
            } as Order;
          });

          const allOrders = [...ordersData, ...convertedBundleOrders];
          setOrders(allOrders);

          // Load agent reports for orders that have agent assigned (including completed orders)
          const reports: Record<string, AgentReport | null> = {};
          for (const order of allOrders) {
            // Skip bundle orders for agent reports (they have different report structure)
            if ((order as Order & { isBundleOrder?: boolean }).isBundleOrder) {
              continue;
            }

            // Handle both string and object types for agentId
            let orderAgentId = "";
            if (typeof order.agentId === "string") {
              orderAgentId = order.agentId.trim();
            } else if (order.agentId && typeof order.agentId === "object") {
              const agentIdObj = order.agentId as Record<string, unknown>;
              orderAgentId = String(
                agentIdObj.id || agentIdObj._id || "",
              ).trim();
            } else {
              orderAgentId = String(order.agentId || "").trim();
            }

            const userAgentId = String(userData.id || "").trim();

            if (
              orderAgentId === userAgentId &&
              (order.status === "agent_sudlaj_bn" ||
                order.status === "tolbor_huleej_bn" ||
                order.status === "amjilttai_zahialga")
            ) {
              try {
                const report = await apiClient.getAgentReport(order.id);
                reports[order.id] = report;
              } catch {
                reports[order.id] = null;
              }
            }
          }
          setAgentReports(reports);
        } catch {
          console.log("No orders found");
        }

        // Load admin settings for exchange rate calculation
        try {
          const settings = await apiClient.getAdminSettings();
          setAdminSettings(settings);
        } catch {
          // Admin settings might not be set yet, that's okay
        }

        // Load reward requests for this agent
        try {
          const requests = await apiClient.getMyRewardRequests();
          setRewardRequests(requests);
        } catch (e) {
          console.error("Failed to load reward requests:", e);
          setRewardRequests([]);
        }

        // Load cargos
        try {
          const cargosData = await apiClient.getCargos();
          setCargos(cargosData);
        } catch (err) {
          console.error("Failed to load cargos:", err);
        }
      } catch {
        // If user doesn't exist, the backend will create it automatically via Clerk middleware
        // Just retry after a moment
        setTimeout(async () => {
          try {
            const userData = await apiClient.getMe();
            setUser(userData);

            // Check role again on retry
            // User role cannot access agent dashboard - only admin can assign agent role
            if (userData.role === "user") {
              setError(
                "Та agent эрхгүй байна. Admin-аас agent эрх авах хэрэгтэй.",
              );
              return;
            }
            // Allow both admin and agent roles to access agent dashboard
            if (userData.role !== "agent" && userData.role !== "admin") {
              setError("Та agent эрхгүй байна");
              return;
            }

            setIsApproved(userData.isApproved || false);
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

  const loadAgentReport = async (orderId: string) => {
    try {
      const report = await apiClient.getAgentReport(orderId);
      setAgentReports((prev) => ({ ...prev, [orderId]: report }));
    } catch {
      setAgentReports((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  // Calculate user payment amount: agent report userAmount * exchangeRate * 1.05
  const calculateUserPaymentAmount = useCallback(
    (agentReport: AgentReport | null, exchangeRate: number = 1): number => {
      if (!agentReport) return 0;
      return Math.round(agentReport.userAmount * exchangeRate * 1.05);
    },
    []
  );

  // Handle update agent report
  const handleUpdateReport = async (orderId: string) => {
    if (!editReportAmount || editReportAmount <= 0) {
      alert("Юань дүн 0-ээс их байх ёстой");
      return;
    }

    setEditReportLoading(true);
    try {
      const updatedReport = await apiClient.updateAgentReport(orderId, {
        userAmount: Math.round(editReportAmount),
        editReason: editReportReason || undefined,
      });

      // Update local state
      setAgentReports((prev) => ({ ...prev, [orderId]: updatedReport }));
      setIsEditingReport(false);
      setEditReportReason("");
      alert("Тайлан амжилттай шинэчлэгдлээ");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setEditReportLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reasonForCancel?: string,
  ) => {
    setStatusUpdateLoading(true);
    try {
      // Check if this is a bundle order
      const currentOrder = orders.find((o) => o.id === orderId);
      const isBundleOrder = (currentOrder as Order & { isBundleOrder?: boolean })?.isBundleOrder;

      // Use appropriate API based on order type
      const updatedOrder = isBundleOrder
        ? await apiClient.updateBundleOrderStatus(orderId, newStatus)
        : await apiClient.updateOrderStatus(orderId, newStatus, reasonForCancel);

      // Update order filter based on new status BEFORE loading data
      if (
        newStatus === "amjilttai_zahialga" ||
        newStatus === "tsutsalsan_zahialga"
      ) {
        setOrderFilter("completed");
      } else if (
        newStatus === "agent_sudlaj_bn" ||
        newStatus === "tolbor_huleej_bn"
      ) {
        setOrderFilter("active");
      }

      // Update the order in the local state immediately
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                agentId: updatedOrder.agentId || order.agentId || user?.id,
              }
            : order,
        ),
      );

      // Update selected order if it's the same one
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          agentId: updatedOrder.agentId || selectedOrder.agentId || user?.id,
        });
      }

      // Reload data to get fully updated orders (including agentId if it was set)
      await loadData();

      // Close modal after data is loaded
      setShowOrderModal(false);
    } catch (e: unknown) {
      console.error("Error updating order status:", e);
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setStatusUpdateLoading(false);
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

  // Open cancel modal for agent to enter reason
  const openCancelModal = (orderId: string) => {
    setCancelOrderId(orderId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  // Submit cancellation with reason
  const handleCancelWithReason = async () => {
    if (!cancelOrderId) return;
    if (cancelReason.trim().length < 5) {
      alert("Цуцлах шалтгаан хамгийн багадаа 5 тэмдэгт байх ёстой");
      return;
    }

    setCancelLoading(true);
    try {
      await apiClient.updateOrderStatus(
        cancelOrderId,
        "tsutsalsan_zahialga",
        cancelReason.trim(),
      );

      setOrderFilter("completed");
      await loadData();
      setShowCancelModal(false);
      setShowOrderModal(false);
      setCancelOrderId(null);
      setCancelReason("");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setCancelLoading(false);
    }
  };

  const canArchiveOrder = useCallback(
    (order: Order) => {
      // Only completed or cancelled orders can be archived
      // Agent can only archive orders they handled
      return (
        (order.status === "amjilttai_zahialga" ||
          order.status === "tsutsalsan_zahialga") &&
        !order.archivedByAgent &&
        order.agentId === user?.id
      );
    },
    [user?.id]
  );


  // Memoize filtered orders to avoid recalculating on every render
  const publishedOrders = useMemo(() => {
    // For agents, show only open orders (status = "niitlegdsen" and no agentId assigned)
    if (user?.role === "agent") {
      return orders.filter(
        (order) => order.status === "niitlegdsen" && !order.agentId,
      );
    }
    // For admin, show all "niitlegdsen" orders
    return orders.filter((order) => order.status === "niitlegdsen");
  }, [orders, user?.role]);

  // Agent's all orders (excluding published/niitlegdsen and archived)
  const myOrders = useMemo(() => {
    // For admin, show all orders that are not "niitlegdsen" and not archived
    if (user?.role === "admin") {
      return orders.filter(
        (order) => order.status !== "niitlegdsen" && !order.archivedByAgent,
      );
    }
    // For agents, show all their assigned orders (excluding niitlegdsen and archived)
    const filtered = orders.filter((order) => {
      // Check if order has agentId and it matches current user's id
      if (!order.agentId || !user?.id) return false;

      // Skip archived orders
      if (order.archivedByAgent) return false;

      // Extract agentId - handle both string and object types
      let orderAgentId: string = "";
      if (typeof order.agentId === "string") {
        orderAgentId = order.agentId.trim();
      } else if (order.agentId && typeof order.agentId === "object") {
        // If it's an object, try to get id property or _id
        const agentIdObj = order.agentId as Record<string, unknown>;
        orderAgentId = String(agentIdObj.id || agentIdObj._id || "").trim();
      } else {
        orderAgentId = String(order.agentId || "").trim();
      }

      // Normalize userId to string
      const userId = String(user.id || "").trim();

      // Compare normalized strings
      const isMyOrder = orderAgentId === userId;
      const result = isMyOrder && order.status !== "niitlegdsen";

      // Debug logging
      if (process.env.NODE_ENV === "development") {
        if (order.agentId) {
          console.log("Order filter check:", {
            orderId: order.id,
            orderStatus: order.status,
            orderAgentId: orderAgentId,
            userId: userId,
            isMyOrder,
            result,
            rawOrderAgentId: order.agentId,
            rawOrderAgentIdType: typeof order.agentId,
            rawUserId: user.id,
          });
        }
      }

      return result;
    });

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("myOrders filter result:", {
        totalOrders: orders.length,
        filteredCount: filtered.length,
        userId: user?.id,
        ordersWithAgentId: orders.filter((o) => o.agentId).length,
        allOrderAgentIds: orders
          .filter((o) => o.agentId)
          .map((o) => ({
            id: o.id,
            agentId: String(o.agentId),
            status: o.status,
          })),
      });
    }

    return filtered;
  }, [orders, user?.role, user?.id]);

  // Memoize archived orders for agent
  const archivedOrders = useMemo(() => {
    // For admin, show all archived orders
    if (user?.role === "admin") {
      return orders.filter((order) => order.archivedByAgent);
    }
    // For agents, show their archived orders
    return orders.filter((order) => {
      if (!order.agentId || !user?.id) return false;
      if (!order.archivedByAgent) return false;

      let orderAgentId: string = "";
      if (typeof order.agentId === "string") {
        orderAgentId = order.agentId.trim();
      } else if (order.agentId && typeof order.agentId === "object") {
        const agentIdObj = order.agentId as Record<string, unknown>;
        orderAgentId = String(agentIdObj.id || agentIdObj._id || "").trim();
      } else {
        orderAgentId = String(order.agentId || "").trim();
      }

      const userId = String(user.id || "").trim();
      return orderAgentId === userId;
    });
  }, [orders, user?.role, user?.id]);

  // Memoize filtered orders for "My Orders" section
  const filteredMyOrders = useMemo(() => {
    // For archived filter, use archivedOrders
    if (orderFilter === "archived") {
      return archivedOrders;
    }

    return myOrders.filter((order) => {
      if (orderFilter === "active") {
        // Идэвхтэй: agent судлахаар авсан захиалга
        return (
          order.status === "agent_sudlaj_bn" ||
          order.status === "tolbor_huleej_bn"
        );
      }
      if (orderFilter === "completed") {
        // Амжилттай захиалга: админ төлбөрийг батласан
        return order.status === "amjilttai_zahialga";
      }
      if (orderFilter === "cancelled") {
        // Цуцлагдсан захиалга
        return order.status === "tsutsalsan_zahialga";
      }
      return false;
    });
  }, [myOrders, archivedOrders, orderFilter]);

  // Count orders by category for "My Orders" section
  const myActiveCount = myOrders.filter(
    (order) =>
      order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn",
  ).length;
  const myCompletedCount = myOrders.filter(
    (order) => order.status === "amjilttai_zahialga",
  ).length;
  const myCancelledCount = myOrders.filter(
    (order) => order.status === "tsutsalsan_zahialga",
  ).length;
  const myArchivedCount = archivedOrders.length;

  const handleClearCancelledOrder = async (orderId: string) => {
    setClearLoading(true);
    try {
      await apiClient.cancelOrder(orderId);
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setClearLoading(false);
    }
  };

  const handleClearAllCancelledOrders = async () => {
    const cancelledOrders = filteredMyOrders.filter(
      (order) => order.status === "tsutsalsan_zahialga",
    );
    if (cancelledOrders.length === 0) {
      return;
    }

    setClearLoading(true);
    try {
      await Promise.all(
        cancelledOrders.map((order) => apiClient.cancelOrder(order.id)),
      );
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setClearLoading(false);
    }
  };

  const handleClearAllArchivedOrders = async () => {
    if (archivedOrders.length === 0) {
      return;
    }

    setClearLoading(true);
    try {
      await Promise.all(
        archivedOrders.map((order) => apiClient.cancelOrder(order.id)),
      );
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setClearLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#E0E7FF] flex items-center justify-center z-50 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-400/25 rounded-full blur-3xl animate-blob" />
        <div className="absolute -top-20 right-10 w-72 h-72 bg-indigo-400/25 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 right-20 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />

        <div className="flex flex-col items-center gap-8 z-10">
          {/* Agent icon with animated rings */}
          <div className="relative animate-fade-in">
            <div
              className="absolute inset-0 w-28 h-28 rounded-full border-4 border-indigo-500/20 animate-ping"
              style={{ animationDuration: "2s" }}
            />
            <svg
              className="absolute -inset-2 w-32 h-32 animate-spin-slow"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient
                  id="agentGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#agentGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60 200"
              />
            </svg>
            <div className="relative w-28 h-28 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
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
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">
              Agent
            </h2>
            <div className="flex items-center gap-3 text-gray-600 font-medium">
              <span>Ачааллаж байна</span>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce-dot" />
                <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce-dot animation-delay-150" />
                <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce-dot animation-delay-300" />
              </div>
            </div>
          </div>

          <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden animate-fade-in-up animation-delay-500">
            <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full animate-progress-bar" />
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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Approval Status - Only show for agents, not admins */}
          {user?.role === "agent" && !isApproved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Box 1: Нийтэлсэн захиалгууд */}
          {(user?.role === "admin" || isApproved) && (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowPublishedOrders(!showPublishedOrders)}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
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
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      Нээлттэй захиалгууд
                    </h3>
                    <p className="text-xs text-gray-500">
                      Авах боломжтой захиалгууд ({publishedOrders.length})
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showPublishedOrders ? "rotate-180" : ""}`}
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

              {showPublishedOrders && (
                <div className="mt-4">
                  <div className="space-y-3 sm:space-y-4">
                    {publishedOrders.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {publishedOrders.map((order) => {
                          const mainImage =
                            order.imageUrls && order.imageUrls.length > 0
                              ? order.imageUrls[0]
                              : order.imageUrl || null;

                          return (
                            <div
                              key={order.id}
                              className="bg-linear-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 p-3"
                            >
                              <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                                  {mainImage ? (
                                    <Image
                                      src={mainImage}
                                      alt={order.productName}
                                      fill
                                      sizes="64px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                      <svg
                                        className="w-6 h-6 text-gray-400"
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
                                  {/* New badge */}
                                  <span className="absolute -top-1 -left-1 bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                    Шинэ
                                  </span>
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                  {/* Top: Status & Date */}
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    {(order.user?.profile || (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot) && (
                                      <span className="text-xs font-medium text-blue-600 truncate">
                                        {order.user?.profile?.name || (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot?.name || "Нэргүй"}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                      {new Date(
                                        order.createdAt,
                                      ).toLocaleDateString("mn-MN", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>

                                  {/* Product name */}
                                  <h4 className="font-bold text-gray-900 text-sm truncate">
                                    {order.productName}
                                  </h4>

                                  {/* User cargo */}
                                  {(order.user?.profile?.cargo || (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot?.cargo) && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                      Карго:{" "}
                                      <span className="font-medium text-blue-600">
                                        {order.user?.profile?.cargo || (order as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot?.cargo}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Buttons - Bottom */}
                              <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowOrderModal(true);
                                  }}
                                  className="h-7 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1"
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
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  Харах
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      "agent_sudlaj_bn",
                                    )
                                  }
                                  className="flex-1 h-7 px-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center justify-center gap-1"
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
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                  Авах
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-gray-500 font-medium">
                          Нээлттэй захиалга байхгүй байна
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Шинэ захиалга ирэхэд энд харагдана
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Box 2: Миний захиалгууд */}
          <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative z-10">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowMyOrders(!showMyOrders)}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Миний захиалгууд
                  </h3>
                  <p className="text-xs text-gray-500">
                    Таны авсан захиалгууд ({myOrders.length})
                  </p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${showMyOrders ? "rotate-180" : ""}`}
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

            {showMyOrders && (
              <div className="mt-4 space-y-4">
                {/* Category tabs */}
                <div className="flex flex-row gap-1 sm:gap-2 border-b border-gray-200 pt-2 overflow-x-auto pb-px">
                  <button
                    onClick={() => setOrderFilter("active")}
                    className={`relative px-2 sm:px-4 py-2 pr-5 sm:pr-6 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      orderFilter === "active"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Идэвхтэй
                    <span
                      className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs flex items-center justify-center font-semibold ${
                        orderFilter === "active"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {myActiveCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setOrderFilter("completed")}
                    className={`relative px-2 sm:px-4 py-2 pr-5 sm:pr-6 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      orderFilter === "completed"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Амжилттай
                    <span
                      className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs flex items-center justify-center font-semibold ${
                        orderFilter === "completed"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {myCompletedCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setOrderFilter("cancelled")}
                    className={`relative px-2 sm:px-4 py-2 pr-5 sm:pr-6 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      orderFilter === "cancelled"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Цуцлагдсан
                    <span
                      className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs flex items-center justify-center font-semibold ${
                        orderFilter === "cancelled"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {myCancelledCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setOrderFilter("archived")}
                    className={`relative px-2 sm:px-4 py-2 pr-5 sm:pr-6 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                      orderFilter === "archived"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Архив
                    <span
                      className={`absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs flex items-center justify-center font-semibold ${
                        orderFilter === "archived"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {myArchivedCount}
                    </span>
                  </button>
                </div>

                {/* Clear All button for cancelled orders */}
                {orderFilter === "cancelled" && filteredMyOrders.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={handleClearAllCancelledOrders}
                      disabled={clearLoading}
                      className="px-4 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearLoading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {clearLoading ? "Устгаж байна..." : "Бүгдийг устгах"}
                    </button>
                  </div>
                )}

                {/* Clear All button for archived orders */}
                {orderFilter === "archived" && filteredMyOrders.length > 0 && (
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={handleClearAllArchivedOrders}
                      disabled={clearLoading}
                      className="px-4 py-2.5 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {clearLoading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      {clearLoading ? "Устгаж байна..." : "Бүгдийг устгах"}
                    </button>
                  </div>
                )}

                {/* Filtered orders */}
                <div className="max-h-150 overflow-y-auto">
                  {filteredMyOrders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredMyOrders.map((order) => (
                        <MyOrderCard
                          key={order.id}
                          order={order}
                          agentReport={agentReports[order.id]}
                          exchangeRate={adminSettings?.exchangeRate || 1}
                          canArchive={canArchiveOrder(order)}
                          archiveLoading={archiveLoading}
                          onViewOrder={(o) => {
                            setSelectedOrder(o);
                            setShowOrderModal(true);
                          }}
                          onOpenChat={(o) => {
                            setChatOrder(o);
                            setShowChatModal(true);
                          }}
                          onOpenReportForm={(o, isBundleOrder) => {
                            if (isBundleOrder) {
                              setBundleReportOrder(o);
                              setShowBundleReportForm(true);
                            } else {
                              setReportOrder(o);
                              setShowReportForm(true);
                            }
                          }}
                          onClearOrder={handleClearCancelledOrder}
                          onArchiveOrder={handleArchiveOrder}
                          calculateUserPaymentAmount={calculateUserPaymentAmount}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <svg
                        className="w-10 h-10 text-gray-400 mx-auto mb-2"
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
                      <p className="text-gray-500 font-medium">
                        {orderFilter === "active" &&
                          "Идэвхтэй захиалга байхгүй"}
                        {orderFilter === "completed" &&
                          "Амжилттай захиалга байхгүй"}
                        {orderFilter === "cancelled" &&
                          "Цуцлагдсан захиалга байхгүй"}
                        {orderFilter === "archived" &&
                          "Архивласан захиалга байхгүй"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Box 3: Урамшуулал */}
          {user?.role === "agent" && (
            <RewardsSection
              rewardRequests={rewardRequests}
              showRewards={showRewards}
              onToggle={() => setShowRewards(!showRewards)}
            />
          )}

          {/* Box 4: Cargonууд - Dropdown */}
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
        </div>
      </main>

      {/* Order Detail Modal */}
      {showOrderModal &&
        selectedOrder &&
        (() => {
          const mainImage =
            selectedOrder.imageUrls && selectedOrder.imageUrls.length > 0
              ? selectedOrder.imageUrls[0]
              : null;

          const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
          const userSnapshot = (selectedOrder as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot;
          const bundleItems = (selectedOrder as Order & { bundleItems?: BundleOrder["items"] }).bundleItems;

          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
              <div className="bg-white rounded-none sm:rounded-2xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header with gradient */}
                <OrderDetailHeader
                  isBundleOrder={!!isBundleOrder}
                  bundleItemsCount={bundleItems?.length || 0}
                  productName={selectedOrder.productName}
                  status={selectedOrder.status}
                  orderId={selectedOrder.id}
                  mainImage={mainImage}
                  onClose={() => setShowOrderModal(false)}
                />

                <div className="p-4 sm:p-6 space-y-5">
                  {/* User Contact Info for Agent */}
                  {(selectedOrder.user?.profile || userSnapshot) && (
                    <UserContactInfo
                      name={selectedOrder.user?.profile?.name || userSnapshot?.name}
                      phone={selectedOrder.user?.profile?.phone || userSnapshot?.phone}
                      cargo={selectedOrder.user?.profile?.cargo || userSnapshot?.cargo}
                    />
                  )}

                  {/* Quick Actions for Agent */}
                  {selectedOrder.status === "niitlegdsen" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                          <svg
                            className="w-5 h-5 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-amber-800">
                            Шинэ захиалга
                          </p>
                          <p className="text-sm text-amber-600">
                            Энэ захиалгыг авч, судалж эхлэх үү?
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(
                              selectedOrder.id,
                              "agent_sudlaj_bn",
                            )
                          }
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                        >
                          Авах
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === "agent_sudlaj_bn" &&
                    !agentReports[selectedOrder.id] && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                            <svg
                              className="w-5 h-5 text-indigo-600"
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
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-indigo-800">
                              Тайлан илгээх шаардлагатай
                            </p>
                            <p className="text-sm text-indigo-600">
                              Барааны үнэ, зураг зэргийг хэрэглэгчид илгээнэ үү
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
                              if (isBundleOrder) {
                                setBundleReportOrder(selectedOrder);
                                setShowBundleReportForm(true);
                              } else {
                                setReportOrder(selectedOrder);
                                setShowReportForm(true);
                              }
                            }}
                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                          >
                            Тайлан илгээх
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
                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-purple-600"
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
                        {/* Bundle Order Items - Each item as collapsible */}
                        {(selectedOrder as Order & { isBundleOrder?: boolean; bundleItems?: BundleOrder["items"] }).isBundleOrder &&
                          (selectedOrder as Order & { bundleItems?: BundleOrder["items"] }).bundleItems ? (
                          <div className="space-y-2">
                            {(selectedOrder as Order & { bundleItems?: BundleOrder["items"] }).bundleItems?.map((item, index) => (
                              <BundleItemDropdown key={item.id || index} item={item} index={index} />
                            ))}
                          </div>
                        ) : (
                          <>
                            {/* Images Gallery - Regular Order */}
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
                                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-purple-300 relative"
                                          onClick={() =>
                                            setZoomedImageIndex(
                                              zoomedImageIndex === index
                                                ? null
                                                : index,
                                            )
                                          }
                                        >
                                          <Image
                                            src={imgUrl}
                                            alt={`${selectedOrder.productName} - ${index + 1}`}
                                            fill
                                            sizes="100px"
                                            className="object-cover"
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
                                      <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
                                        <Image
                                          src={
                                            selectedOrder.imageUrls[zoomedImageIndex]
                                          }
                                          alt={`${selectedOrder.productName} - ${zoomedImageIndex + 1}`}
                                          fill
                                          sizes="100vw"
                                          className="object-contain rounded-xl"
                                        />
                                      </div>
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
                              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-100">
                                {selectedOrder.description || "Тайлбар байхгүй"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show Agent Report if exists - Collapsible Box */}
                  {/* Show for orders in "Миний захиалгууд" section (agent's own orders) */}
                  {(() => {
                    // Check if this order is in "myOrders" (agent's own orders)
                    const isMyOrder = myOrders.some(
                      (order) => order.id === selectedOrder.id,
                    );
                    // Also check if order has agentId matching current user
                    const isMyAssignedOrder =
                      selectedOrder.agentId &&
                      selectedOrder.agentId === user?.id;
                    // Check if this is a bundle order
                    const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
                    return (isMyOrder || isMyAssignedOrder) && !isBundleOrder; // Hide for bundle orders - they show report in items
                  })() && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <button
                        onClick={() => {
                          setShowAgentReportInModal(!showAgentReportInModal);
                          // Load report if not loaded yet
                          if (
                            !showAgentReportInModal &&
                            agentReports[selectedOrder.id] === undefined
                          ) {
                            loadAgentReport(selectedOrder.id);
                          }
                        }}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <h3 className="text-lg font-semibold text-gray-900">
                          Миний илгээсэн тайлан
                        </h3>
                        <svg
                          className={`w-5 h-5 transition-transform ${showAgentReportInModal ? "rotate-180" : ""}`}
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

                      {showAgentReportInModal && (
                        <div className="mt-4 space-y-4">
                          {agentReports[selectedOrder.id] === undefined && (
                            <div className="text-sm text-gray-500 text-center py-4">
                              Ачааллаж байна...
                            </div>
                          )}

                          {agentReports[selectedOrder.id] === null && (
                            <div className="text-sm text-gray-500 text-center py-4">
                              Тайлан байхгүй байна
                            </div>
                          )}

                          {agentReports[selectedOrder.id] &&
                            (() => {
                              const report = agentReports[selectedOrder.id];
                              if (!report) return null;

                              // Check if can edit (before user payment)
                              const canEdit =
                                selectedOrder.status === "tolbor_huleej_bn" &&
                                !selectedOrder.userPaymentVerified;

                              return (
                                <>
                                  {/* Yuan Amount with Edit */}
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium text-gray-600">
                                        Юань дүн:
                                      </label>
                                      {canEdit && !isEditingReport && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditingReport(true);
                                            setEditReportAmount(
                                              report.userAmount,
                                            );
                                            setEditReportReason("");
                                          }}
                                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                          Засах
                                        </button>
                                      )}
                                    </div>

                                    {isEditingReport ? (
                                      <div className="mt-2 space-y-2">
                                        <input
                                          type="number"
                                          step="1"
                                          min="0"
                                          value={editReportAmount || ""}
                                          onChange={(e) =>
                                            setEditReportAmount(
                                              Math.round(
                                                parseFloat(e.target.value),
                                              ) || 0,
                                            )
                                          }
                                          className="w-full px-3 py-2 text-base text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          placeholder="Юань дүн оруулна уу"
                                        />
                                        <input
                                          type="text"
                                          value={editReportReason}
                                          onChange={(e) =>
                                            setEditReportReason(e.target.value)
                                          }
                                          className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          placeholder="Засварын шалтгаан (заавал биш)"
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => {
                                              setIsEditingReport(false);
                                              setEditReportReason("");
                                            }}
                                            className="flex-1 px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium"
                                          >
                                            Цуцлах
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleUpdateReport(
                                                selectedOrder.id,
                                              )
                                            }
                                            disabled={editReportLoading}
                                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium disabled:opacity-50"
                                          >
                                            {editReportLoading
                                              ? "Хадгалж байна..."
                                              : "Хадгалах"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-lg font-semibold text-amber-600 mt-1">
                                        ¥
                                        {Math.round(
                                          report.userAmount,
                                        ).toLocaleString()}
                                      </p>
                                    )}
                                  </div>

                                  {/* Calculated MNT Amount */}
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">
                                      Хэрэглэгчийн төлөх дүн:
                                    </label>
                                    <p className="text-lg font-semibold text-green-600 mt-1">
                                      {(() => {
                                        const exchangeRate =
                                          adminSettings?.exchangeRate || 1;
                                        const calculatedAmount =
                                          calculateUserPaymentAmount(
                                            report,
                                            exchangeRate,
                                          );
                                        return Math.round(
                                          calculatedAmount,
                                        ).toLocaleString();
                                      })()}{" "}
                                      ₮
                                    </p>
                                  </div>

                                  {/* Edit History - Text only */}
                                  {report.editHistory &&
                                    report.editHistory.length > 0 && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                        <label className="text-sm font-medium text-amber-700 block mb-2">
                                          Засварын түүх:
                                        </label>
                                        <div className="space-y-1 text-xs text-amber-800">
                                          {report.editHistory.map(
                                            (edit, idx) => (
                                              <p key={idx}>
                                                •{" "}
                                                {new Date(
                                                  edit.editedAt,
                                                ).toLocaleDateString("mn-MN", {
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                                : ¥
                                                {Math.round(
                                                  edit.previousAmount,
                                                ).toLocaleString()}{" "}
                                                → ¥
                                                {Math.round(
                                                  edit.newAmount,
                                                ).toLocaleString()}
                                                {edit.reason && (
                                                  <span className="text-amber-600">
                                                    {" "}
                                                    ({edit.reason})
                                                  </span>
                                                )}
                                              </p>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {report.paymentLink && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">
                                        Төлбөрийн холбоос:
                                      </label>
                                      <a
                                        href={report.paymentLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:text-blue-600 hover:underline break-all block mt-1"
                                      >
                                        {report.paymentLink}
                                      </a>
                                    </div>
                                  )}

                                  {report.quantity && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">
                                        Тоо ширхэг:
                                      </label>
                                      <p className="text-gray-900 mt-1">
                                        {report.quantity}
                                      </p>
                                    </div>
                                  )}

                                  {report.additionalDescription && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">
                                        Нэмэлт тайлбар:
                                      </label>
                                      <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                                        {report.additionalDescription}
                                      </p>
                                    </div>
                                  )}

                                  {report.additionalImages &&
                                    report.additionalImages.length > 0 && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-600 mb-2 block">
                                          Нэмэлт зураг:
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                          {report.additionalImages.map(
                                            (imgUrl, idx) => (
                                              <div key={idx} className="relative h-32 rounded-xl overflow-hidden border border-gray-200">
                                                <Image
                                                  src={imgUrl}
                                                  alt={`Additional ${idx + 1}`}
                                                  fill
                                                  sizes="150px"
                                                  className="object-cover"
                                                />
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                </>
                              );
                            })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bundle Order Report Section */}
                  {(() => {
                    const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
                    const bundleItems = (selectedOrder as Order & { bundleItems?: BundleOrder["items"] }).bundleItems;
                    const isMyOrder = myOrders.some((order) => order.id === selectedOrder.id);
                    const isMyAssignedOrder = selectedOrder.agentId && selectedOrder.agentId === user?.id;

                    if (!isBundleOrder || (!isMyOrder && !isMyAssignedOrder)) return null;

                    // Check for single mode report (bundleReport in the order)
                    const bundleReport = (selectedOrder as Order & { bundleReport?: { totalUserAmount: number; paymentLink?: string; additionalDescription?: string; additionalImages?: string[] } }).bundleReport;
                    const reportMode = (selectedOrder as Order & { reportMode?: string }).reportMode;
                    const isSingleMode = reportMode === "single" && bundleReport;

                    // Check if any item has a report (per-item mode)
                    const hasPerItemReports = bundleItems?.some(item => item.agentReport);

                    // No report at all
                    if (!isSingleMode && !hasPerItemReports) {
                      return (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Миний илгээсэн тайлан</h3>
                          <p className="text-sm text-gray-500 text-center py-4">Тайлан байхгүй байна</p>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <button
                          onClick={() => setShowAgentReportInModal(!showAgentReportInModal)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <h3 className="text-lg font-semibold text-gray-900">Миний илгээсэн тайлан</h3>
                          <svg
                            className={`w-5 h-5 transition-transform ${showAgentReportInModal ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showAgentReportInModal && (
                          <div className="mt-4 space-y-4">
                            {isSingleMode && bundleReport ? (
                              /* Single Mode Report */
                              <div className="space-y-3">
                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                  <span className="text-sm text-gray-600">Хэрэглэгчийн төлөх дүн:</span>
                                  {(() => {
                                    const exchangeRate = adminSettings?.exchangeRate || 1;
                                    const agentYuan = bundleReport.totalUserAmount;
                                    const userYuan = agentYuan * 1.05;
                                    const userMNT = userYuan * exchangeRate;
                                    return (
                                      <div className="mt-2">
                                        <p className="text-xl font-bold text-green-700">
                                          {userMNT.toLocaleString()}₮
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                          ({userYuan.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮)
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          Агент үнэ: {agentYuan.toLocaleString()}¥ + 5% = {userYuan.toLocaleString()}¥
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </div>
                                {bundleReport.paymentLink && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Төлбөрийн мэдээлэл:</label>
                                    <p className="text-gray-900 mt-1 break-all">{bundleReport.paymentLink}</p>
                                  </div>
                                )}
                                {bundleReport.additionalDescription && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600">Нэмэлт тайлбар:</label>
                                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">{bundleReport.additionalDescription}</p>
                                  </div>
                                )}
                                {bundleReport.additionalImages && bundleReport.additionalImages.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-600 mb-2 block">Нэмэлт зураг:</label>
                                    <div className="grid grid-cols-3 gap-3">
                                      {bundleReport.additionalImages.map((imgUrl, idx) => (
                                        <div key={idx} className="relative h-24 rounded-xl overflow-hidden border border-gray-200">
                                          <Image src={imgUrl} alt={`Additional ${idx + 1}`} fill sizes="150px" className="object-cover" />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Per-Item Mode Reports */
                              <div className="space-y-3">
                                {bundleItems?.map((item, idx) => (
                                  item.agentReport && (
                                    <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-gray-400">#{idx + 1}</span>
                                        <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Үнэ:</span>
                                        <span className="font-semibold text-green-600">{item.agentReport.userAmount.toLocaleString()}¥</span>
                                      </div>
                                      {item.agentReport.quantity && (
                                        <div className="flex justify-between text-sm mt-1">
                                          <span className="text-gray-500">Тоо:</span>
                                          <span>{item.agentReport.quantity}</span>
                                        </div>
                                      )}
                                    </div>
                                  )
                                ))}
                                {/* Total for per-item mode */}
                                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                  <span className="text-sm text-gray-600">Хэрэглэгчийн төлөх дүн:</span>
                                  {(() => {
                                    const exchangeRate = adminSettings?.exchangeRate || 1;
                                    const agentYuan = bundleItems?.reduce((sum, item) => sum + (item.agentReport?.userAmount || 0), 0) || 0;
                                    const userYuan = agentYuan * 1.05;
                                    const userMNT = userYuan * exchangeRate;
                                    return (
                                      <div className="mt-2">
                                        <p className="text-xl font-bold text-green-700">
                                          {userMNT.toLocaleString()}₮
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                          ({userYuan.toLocaleString()}¥ × {exchangeRate.toLocaleString()}₮)
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                          Агент үнэ: {agentYuan.toLocaleString()}¥ + 5% = {userYuan.toLocaleString()}¥
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons - Chat and Edit */}
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                              {/* Chat Button */}
                              <button
                                onClick={() => {
                                  setChatOrder(selectedOrder);
                                  setShowChatModal(true);
                                }}
                                className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Хэрэглэгчтэй чатлах
                              </button>

                              {/* Edit Button - Only show if payment not verified */}
                              {!(selectedOrder as Order & { userPaymentVerified?: boolean }).userPaymentVerified && (
                                <button
                                  onClick={() => {
                                    setBundleReportOrder(selectedOrder);
                                    setShowBundleReportForm(true);
                                  }}
                                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Тайлан засварлах
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Track Code Section - Show for successful orders */}
                  {selectedOrder.status === "amjilttai_zahialga" &&
                    (selectedOrder.agentId === user?.id ||
                      user?.role === "admin") && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              Track Code
                            </label>
                            {!isEditingTrackCode && (
                              <button
                                onClick={() => {
                                  setIsEditingTrackCode(true);
                                  setTrackCodeInput(
                                    selectedOrder.trackCode || "",
                                  );
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {selectedOrder.trackCode ? "Засах" : "Нэмэх"}
                              </button>
                            )}
                          </div>

                          {isEditingTrackCode ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={trackCodeInput}
                                onChange={(e) =>
                                  setTrackCodeInput(e.target.value)
                                }
                                placeholder="Track code оруулах"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                                style={{ fontSize: "16px" }}
                                disabled={trackCodeLoading}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    if (!trackCodeInput.trim()) {
                                      alert("Track code оруулах шаардлагатай");
                                      return;
                                    }

                                    setTrackCodeLoading(true);
                                    try {
                                      const updatedOrder =
                                        await apiClient.updateTrackCode(
                                          selectedOrder.id,
                                          trackCodeInput.trim(),
                                        );
                                      setSelectedOrder(updatedOrder);
                                      setIsEditingTrackCode(false);
                                      setTrackCodeInput("");

                                      // Reload orders to update the list
                                      await loadData();

                                      alert("Track code амжилттай нэмэгдлээ");
                                    } catch (e: unknown) {
                                      const errorMessage =
                                        e instanceof Error
                                          ? e.message
                                          : "Алдаа гарлаа";
                                      alert(errorMessage);
                                    } finally {
                                      setTrackCodeLoading(false);
                                    }
                                  }}
                                  disabled={trackCodeLoading}
                                  className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium disabled:opacity-50 min-h-11"
                                >
                                  {trackCodeLoading
                                    ? "Хадгалж байна..."
                                    : "Хадгалах"}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsEditingTrackCode(false);
                                    setTrackCodeInput("");
                                  }}
                                  disabled={trackCodeLoading}
                                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 active:bg-gray-400 transition-colors font-medium disabled:opacity-50 min-h-11"
                                >
                                  Цуцлах
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              {selectedOrder.trackCode ? (
                                <p className="text-gray-900 font-mono">
                                  {selectedOrder.trackCode}
                                </p>
                              ) : (
                                <p className="text-gray-500 text-sm">
                                  Track code байхгүй байна
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Dates Section */}
                  <OrderDates
                    createdAt={selectedOrder.createdAt}
                    updatedAt={selectedOrder.updatedAt}
                  />

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    {/* Status Update Actions (for agents) */}
                    {selectedOrder.status === "niitlegdsen" && (
                      <button
                        onClick={() =>
                          handleUpdateOrderStatus(
                            selectedOrder.id,
                            "agent_sudlaj_bn",
                          )
                        }
                        disabled={statusUpdateLoading}
                        className="w-full px-4 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {statusUpdateLoading ? (
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        )}
                        {statusUpdateLoading
                          ? "Уншиж байна..."
                          : "Захиалга авах"}
                      </button>
                    )}

                    {selectedOrder.status === "agent_sudlaj_bn" && (
                      <>
                        <button
                          onClick={() => {
                            const isBundleOrder = (selectedOrder as Order & { isBundleOrder?: boolean }).isBundleOrder;
                            if (isBundleOrder) {
                              setBundleReportOrder(selectedOrder);
                              setShowBundleReportForm(true);
                            } else {
                              setReportOrder(selectedOrder);
                              setShowReportForm(true);
                            }
                          }}
                          className="w-full px-4 py-3 bg-linear-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Тайлан илгээх
                        </button>
                        <button
                          onClick={() => openCancelModal(selectedOrder.id)}
                          className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Захиалга цуцлах
                        </button>
                      </>
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

      {/* Agent Report Form Modal */}
      {showReportForm && reportOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Тайлан илгээх
              </h2>
              <button
                onClick={() => {
                  setReportOrder(null);
                  setShowReportForm(false);
                }}
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

            <div className="p-6">
              <AgentReportForm
                order={reportOrder}
                onSuccess={async () => {
                  setReportOrder(null);
                  setShowReportForm(false);
                  await loadData();
                  alert("Тайлан амжилттай илгээгдлээ");
                }}
                onCancel={() => {
                  setReportOrder(null);
                  setShowReportForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bundle Report Form Modal */}
      {showBundleReportForm && bundleReportOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-none sm:rounded-xl border border-gray-200 max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Багц захиалгын тайлан
              </h2>
              <button
                onClick={() => {
                  setBundleReportOrder(null);
                  setShowBundleReportForm(false);
                }}
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

            <div className="p-6">
              <BundleReportForm
                bundleOrder={{
                  id: bundleReportOrder.id,
                  userId: bundleReportOrder.userId,
                  agentId: bundleReportOrder.agentId,
                  userSnapshot: (bundleReportOrder as Order & { userSnapshot?: { name: string; phone: string; cargo: string } }).userSnapshot || { name: "", phone: "", cargo: "" },
                  items: (bundleReportOrder as Order & { bundleItems?: BundleOrder["items"] }).bundleItems || [],
                  status: bundleReportOrder.status,
                  createdAt: bundleReportOrder.createdAt,
                  updatedAt: bundleReportOrder.updatedAt,
                  reportMode: (bundleReportOrder as Order & { reportMode?: "single" | "per_item" }).reportMode,
                  bundleReport: (bundleReportOrder as Order & { bundleReport?: { totalUserAmount: number; paymentLink?: string; additionalDescription?: string; additionalImages?: string[] } }).bundleReport,
                }}
                onSuccess={async () => {
                  setBundleReportOrder(null);
                  setShowBundleReportForm(false);
                  await loadData();
                  alert("Багц тайлан амжилттай илгээгдлээ");
                }}
                onCancel={() => {
                  setBundleReportOrder(null);
                  setShowBundleReportForm(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        cancelReason={cancelReason}
        cancelLoading={cancelLoading}
        onReasonChange={setCancelReason}
        onCancel={() => {
          setShowCancelModal(false);
          setCancelOrderId(null);
          setCancelReason("");
        }}
        onConfirm={handleCancelWithReason}
      />
    </div>
  );
}
