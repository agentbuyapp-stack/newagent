import { useState, useCallback } from "react";
import type { Order, OrderStatus, BundleOrder } from "@/lib/api";

interface UseOrderActionsOptions {
  apiClient: {
    updateOrderStatus: (orderId: string, status: OrderStatus, reasonForCancel?: string) => Promise<Order>;
    updateBundleOrderStatus: (orderId: string, status: OrderStatus, cancelReason?: string) => Promise<BundleOrder>;
    archiveOrder: (orderId: string) => Promise<Order>;
    cancelOrder: (orderId: string) => Promise<void>;
    uploadAudio: (audioBase64: string) => Promise<{ url: string }>;
    sendMessage: (orderId: string, data: { audioUrl: string; audioDuration: number }) => Promise<unknown>;
  };
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  selectedOrder: Order | null;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  setShowOrderModal: (show: boolean) => void;
  setOrderFilter: (filter: "active" | "completed" | "cancelled" | "archived") => void;
  loadData: () => Promise<void>;
  user: { id: string } | null;
}

interface UseOrderActionsReturn {
  // Status update
  statusUpdateLoading: boolean;
  handleUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, reasonForCancel?: string) => Promise<void>;

  // Archive
  archiveLoading: boolean;
  handleArchiveOrder: (orderId: string) => Promise<void>;
  canArchiveOrder: (order: Order) => boolean;

  // Cancel
  showCancelModal: boolean;
  setShowCancelModal: (show: boolean) => void;
  cancelOrderId: string | null;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  cancelLoading: boolean;
  openCancelModal: (orderId: string) => void;
  handleCancelWithReason: (reason: string) => Promise<void>;

  // Clear
  clearLoading: boolean;
  handleClearCancelledOrder: (orderId: string) => Promise<void>;
  handleClearAllCancelledOrders: (filteredOrders: Order[]) => Promise<void>;
  handleClearAllArchivedOrders: (archivedOrders: Order[]) => Promise<void>;

  // Voice
  handleSendVoiceMessage: (orderId: string, audioBase64: string, duration: number) => Promise<void>;
}

export function useOrderActions({
  apiClient,
  orders,
  setOrders,
  selectedOrder,
  setSelectedOrder,
  setShowOrderModal,
  setOrderFilter,
  loadData,
  user,
}: UseOrderActionsOptions): UseOrderActionsReturn {
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const handleUpdateOrderStatus = useCallback(async (
    orderId: string,
    newStatus: OrderStatus,
    reasonForCancel?: string
  ) => {
    setStatusUpdateLoading(true);
    try {
      const currentOrder = orders.find((o) => o.id === orderId);
      const isBundleOrder = (currentOrder as Order & { isBundleOrder?: boolean })?.isBundleOrder;

      // Both Order and BundleOrder have agentId, so we can use a common type
      const updatedOrder: { agentId?: string | null } = isBundleOrder
        ? await apiClient.updateBundleOrderStatus(orderId, newStatus)
        : await apiClient.updateOrderStatus(orderId, newStatus, reasonForCancel);

      // Update filter based on new status
      if (newStatus === "amjilttai_zahialga" || newStatus === "tsutsalsan_zahialga") {
        setOrderFilter("completed");
      } else if (newStatus === "agent_sudlaj_bn" || newStatus === "tolbor_huleej_bn") {
        setOrderFilter("active");
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                agentId: updatedOrder.agentId || order.agentId || user?.id,
              }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          agentId: updatedOrder.agentId || selectedOrder.agentId || user?.id,
        });
      }

      await loadData();
      setShowOrderModal(false);
    } catch (e: unknown) {
      console.error("Error updating order status:", e);
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setStatusUpdateLoading(false);
    }
  }, [orders, apiClient, setOrderFilter, setOrders, selectedOrder, setSelectedOrder, loadData, setShowOrderModal, user?.id]);

  const handleArchiveOrder = useCallback(async (orderId: string) => {
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
  }, [apiClient, loadData, setShowOrderModal]);

  const canArchiveOrder = useCallback((order: Order) => {
    return (
      (order.status === "amjilttai_zahialga" ||
        order.status === "tsutsalsan_zahialga") &&
      !order.archivedByAgent &&
      order.agentId === user?.id
    );
  }, [user?.id]);

  const openCancelModal = useCallback((orderId: string) => {
    setCancelOrderId(orderId);
    setCancelReason("");
    setShowCancelModal(true);
  }, []);

  const handleCancelWithReason = useCallback(async (reasonInput: string) => {
    if (!cancelOrderId) return;

    const reason = reasonInput.trim();

    if (reason.length < 5) {
      alert("Цуцлах шалтгаан хамгийн багадаа 5 тэмдэгт байх ёстой");
      return;
    }

    setCancelLoading(true);
    try {
      // Check if it's a bundle order
      const currentOrder = orders.find((o) => o.id === cancelOrderId);
      const isBundleOrder = (currentOrder as Order & { isBundleOrder?: boolean })?.isBundleOrder;

      if (isBundleOrder) {
        await apiClient.updateBundleOrderStatus(cancelOrderId, "tsutsalsan_zahialga", reason);
      } else {
        await apiClient.updateOrderStatus(cancelOrderId, "tsutsalsan_zahialga", reason);
      }

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
  }, [cancelOrderId, orders, apiClient, setOrderFilter, loadData, setShowOrderModal]);

  // Agent clear - uses archive to hide from agent view (doesn't delete from DB)
  const handleClearCancelledOrder = useCallback(async (orderId: string) => {
    setClearLoading(true);
    try {
      await apiClient.archiveOrder(orderId);
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setClearLoading(false);
    }
  }, [apiClient, loadData]);

  // Agent clear all cancelled - uses archive (doesn't delete from DB)
  const handleClearAllCancelledOrders = useCallback(async (filteredOrders: Order[]) => {
    const cancelledOrders = filteredOrders.filter(
      (order) => order.status === "tsutsalsan_zahialga"
    );
    if (cancelledOrders.length === 0) return;

    setClearLoading(true);
    try {
      await Promise.all(
        cancelledOrders.map((order) => apiClient.archiveOrder(order.id))
      );
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setClearLoading(false);
    }
  }, [apiClient, loadData]);

  // Agent clear all archived - only cancelled orders (doesn't delete from DB)
  const handleClearAllArchivedOrders = useCallback(async (archivedOrders: Order[]) => {
    // Only clear cancelled orders from archive
    const cancelledArchivedOrders = archivedOrders.filter(
      (order) => order.status === "tsutsalsan_zahialga"
    );
    if (cancelledArchivedOrders.length === 0) {
      alert("Цуцлагдсан захиалга байхгүй байна.");
      return;
    }

    setClearLoading(true);
    try {
      // Archive sets archivedByAgent: true, doesn't delete from DB
      await Promise.all(
        cancelledArchivedOrders.map((order) => apiClient.archiveOrder(order.id))
      );
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    } finally {
      setClearLoading(false);
    }
  }, [apiClient, loadData]);

  const handleSendVoiceMessage = useCallback(async (
    orderId: string,
    audioBase64: string,
    duration: number
  ) => {
    try {
      const uploadResult = await apiClient.uploadAudio(audioBase64);
      await apiClient.sendMessage(orderId, {
        audioUrl: uploadResult.url,
        audioDuration: duration,
      });
    } catch (e: unknown) {
      console.error("Failed to send voice message:", e);
      throw e;
    }
  }, [apiClient]);

  return {
    statusUpdateLoading,
    handleUpdateOrderStatus,
    archiveLoading,
    handleArchiveOrder,
    canArchiveOrder,
    showCancelModal,
    setShowCancelModal,
    cancelOrderId,
    cancelReason,
    setCancelReason,
    cancelLoading,
    openCancelModal,
    handleCancelWithReason,
    clearLoading,
    handleClearCancelledOrder,
    handleClearAllCancelledOrders,
    handleClearAllArchivedOrders,
    handleSendVoiceMessage,
  };
}
