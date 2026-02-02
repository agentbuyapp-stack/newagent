"use client";

import { useState, useCallback } from "react";
import type { Order, BundleOrder } from "@/lib/api";

interface UseUserActionsOptions {
  apiClient: {
    cancelOrder: (orderId: string) => Promise<void>;
    archiveOrder: (orderId: string) => Promise<Order>;
    deleteBundleOrder: (orderId: string) => Promise<void>;
    cancelBundleOrder: (orderId: string) => Promise<{ id: string; status: string }>;
    confirmBundleUserPayment: (orderId: string) => Promise<BundleOrder>;
    removeItemFromBundle: (bundleOrderId: string, itemId: string) => Promise<BundleOrder>;
    uploadAudio: (audioBase64: string) => Promise<{ url: string }>;
    sendMessage: (orderId: string, data: { audioUrl: string; audioDuration: number }) => Promise<unknown>;
    request: <T>(url: string, options?: { method?: string }) => Promise<T>;
  };
  onReloadData: () => Promise<void>;
}

interface UseUserActionsReturn {
  // Loading states
  cancelLoading: boolean;
  paymentLoading: boolean;
  deleteLoading: boolean;
  archiveLoading: boolean;
  removeItemLoading: string | null;

  // Order actions
  handleCancelOrder: (orderId: string) => Promise<void>;
  handlePaymentPaid: (orderId: string, onSuccess?: (orderId: string) => void) => Promise<void>;
  handleDeleteOrder: (order: Order) => Promise<void>;
  handleArchiveOrder: (orderId: string, onSuccess?: () => void) => Promise<void>;

  // Bundle order actions
  handleDeleteBundleOrder: (bundleOrder: BundleOrder) => Promise<void>;
  handleCancelBundleOrder: (
    bundleOrderId: string,
    selectedBundleOrder: BundleOrder | null,
    setSelectedBundleOrder: (order: BundleOrder | null) => void,
    onCloseModal?: () => void
  ) => Promise<void>;
  handleConfirmBundlePayment: (
    bundleOrderId: string,
    selectedBundleOrder: BundleOrder | null,
    setSelectedBundleOrder: (order: BundleOrder | null) => void
  ) => Promise<void>;
  handleRemoveItemFromBundle: (
    bundleOrderId: string,
    itemId: string,
    setSelectedBundleOrder: (order: BundleOrder) => void
  ) => Promise<void>;

  // Voice message
  handleSendVoiceMessage: (orderId: string, audioBase64: string, duration: number) => Promise<void>;

  // Utility
  canCancelOrder: (order: Order) => boolean;
  canArchiveOrder: (order: Order) => boolean;
}

export function useUserActions({
  apiClient,
  onReloadData,
}: UseUserActionsOptions): UseUserActionsReturn {
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [removeItemLoading, setRemoveItemLoading] = useState<string | null>(null);

  // Check if order can be cancelled
  const canCancelOrder = useCallback((order: Order) => {
    return (
      order.status === "niitlegdsen" ||
      order.status === "tsutsalsan_zahialga" ||
      order.status === "tolbor_huleej_bn"
    );
  }, []);

  // Check if order can be archived
  const canArchiveOrder = useCallback((order: Order) => {
    return (
      (order.status === "amjilttai_zahialga" ||
        order.status === "tsutsalsan_zahialga") &&
      !order.archivedByUser
    );
  }, []);

  // Cancel order
  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      setCancelLoading(true);
      try {
        await apiClient.cancelOrder(orderId);
        await onReloadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setCancelLoading(false);
      }
    },
    [apiClient, onReloadData]
  );

  // Confirm user payment
  const handlePaymentPaid = useCallback(
    async (orderId: string, onSuccess?: (orderId: string) => void) => {
      setPaymentLoading(true);
      try {
        await apiClient.request<Order>(
          `/orders/${orderId}/user-payment-confirmed`,
          { method: "PUT" }
        );
        if (onSuccess) {
          onSuccess(orderId);
        }
        await onReloadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setPaymentLoading(false);
      }
    },
    [apiClient, onReloadData]
  );

  // Delete order (uses cancel API)
  const handleDeleteOrder = useCallback(
    async (order: Order) => {
      setDeleteLoading(true);
      try {
        await apiClient.cancelOrder(order.id);
        await onReloadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setDeleteLoading(false);
      }
    },
    [apiClient, onReloadData]
  );

  // Archive order
  const handleArchiveOrder = useCallback(
    async (orderId: string, onSuccess?: () => void) => {
      setArchiveLoading(true);
      try {
        await apiClient.archiveOrder(orderId);
        await onReloadData();
        if (onSuccess) {
          onSuccess();
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setArchiveLoading(false);
      }
    },
    [apiClient, onReloadData]
  );

  // Delete bundle order
  const handleDeleteBundleOrder = useCallback(
    async (bundleOrder: BundleOrder) => {
      setDeleteLoading(true);
      try {
        await apiClient.deleteBundleOrder(bundleOrder.id);
        await onReloadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setDeleteLoading(false);
      }
    },
    [apiClient, onReloadData]
  );

  // Cancel bundle order
  const handleCancelBundleOrder = useCallback(
    async (
      bundleOrderId: string,
      selectedBundleOrder: BundleOrder | null,
      setSelectedBundleOrder: (order: BundleOrder | null) => void,
      onCloseModal?: () => void
    ) => {
      setCancelLoading(true);
      try {
        await apiClient.cancelBundleOrder(bundleOrderId);
        if (selectedBundleOrder) {
          setSelectedBundleOrder({
            ...selectedBundleOrder,
            status: "tsutsalsan_zahialga",
          });
        }
        await onReloadData();
        if (onCloseModal) {
          onCloseModal();
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setCancelLoading(false);
      }
    },
    [apiClient, onReloadData]
  );

  // Confirm bundle payment
  const handleConfirmBundlePayment = useCallback(
    async (
      bundleOrderId: string,
      selectedBundleOrder: BundleOrder | null,
      setSelectedBundleOrder: (order: BundleOrder | null) => void
    ) => {
      setPaymentLoading(true);
      try {
        await apiClient.confirmBundleUserPayment(bundleOrderId);
        if (selectedBundleOrder) {
          setSelectedBundleOrder({
            ...selectedBundleOrder,
            userPaymentVerified: true,
          });
        }
        await onReloadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setPaymentLoading(false);
      }
    },
    [apiClient, onReloadData]
  );

  // Remove item from bundle
  const handleRemoveItemFromBundle = useCallback(
    async (
      bundleOrderId: string,
      itemId: string,
      setSelectedBundleOrder: (order: BundleOrder) => void
    ) => {
      setRemoveItemLoading(itemId);
      try {
        const updatedOrder = await apiClient.removeItemFromBundle(bundleOrderId, itemId);
        setSelectedBundleOrder(updatedOrder);
        await onReloadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Бараа хасахад алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setRemoveItemLoading(null);
      }
    },
    [apiClient, onReloadData]
  );

  // Send voice message
  const handleSendVoiceMessage = useCallback(
    async (orderId: string, audioBase64: string, duration: number) => {
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
    },
    [apiClient]
  );

  return {
    cancelLoading,
    paymentLoading,
    deleteLoading,
    archiveLoading,
    removeItemLoading,
    handleCancelOrder,
    handlePaymentPaid,
    handleDeleteOrder,
    handleArchiveOrder,
    handleDeleteBundleOrder,
    handleCancelBundleOrder,
    handleConfirmBundlePayment,
    handleRemoveItemFromBundle,
    handleSendVoiceMessage,
    canCancelOrder,
    canArchiveOrder,
  };
}
