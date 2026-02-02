"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Order, BundleOrder, AgentReport, LatestVoiceMessage } from "@/lib/api";

export type UserOrderFilterType = "active" | "completed" | "cancelled" | "archived";

interface UseUserOrdersOptions {
  userId: string | undefined;
  orders: Order[];
  bundleOrders: BundleOrder[];
  agentReports: Record<string, AgentReport | null>;
  onReloadData: () => void;
}

interface UseUserOrdersReturn {
  // Orders
  activeOrders: Order[];
  archivedOrders: Order[];

  // Bundle orders (always shown separately in UI)
  bundleOrders: BundleOrder[];

  // Filtering
  orderFilter: UserOrderFilterType;
  setOrderFilter: (filter: UserOrderFilterType) => void;
  filteredOrders: Order[];

  // Counts for filter tabs
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  archivedCount: number;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  paginatedOrders: Order[];
  itemsPerPage: number;

  // Voice messages
  latestVoiceMessages: Record<string, LatestVoiceMessage | null>;
  setLatestVoiceMessages: React.Dispatch<React.SetStateAction<Record<string, LatestVoiceMessage | null>>>;

  // Socket
  socketRef: React.RefObject<Socket | null>;
}

export function useUserOrders({
  userId,
  orders,
  bundleOrders,
  agentReports,
  onReloadData,
}: UseUserOrdersOptions): UseUserOrdersReturn {
  const [orderFilter, setOrderFilter] = useState<UserOrderFilterType>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [latestVoiceMessages, setLatestVoiceMessages] = useState<
    Record<string, LatestVoiceMessage | null>
  >({});

  const socketRef = useRef<Socket | null>(null);
  const itemsPerPage = 6;

  // Socket connection for real-time voice message notifications
  useEffect(() => {
    if (!userId) return;

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:4000";

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      // Join user's personal room
      socket.emit("join", userId);
    });

    // Listen for new voice messages - refresh orders to update the UI
    socket.on("new-voice-message", (event: { orderId: string }) => {
      console.log("New voice message received for order:", event.orderId);
      // Refresh orders to get the latest voice message data
      onReloadData();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, onReloadData]);

  // Active orders (not archived by user)
  const activeOrders = orders.filter((o) => !o.archivedByUser);

  // Archived orders
  const archivedOrders = orders.filter((o) => o.archivedByUser);

  // Filter counts
  const activeCount = activeOrders.filter(
    (o) =>
      o.status === "niitlegdsen" ||
      o.status === "agent_sudlaj_bn" ||
      o.status === "tolbor_huleej_bn"
  ).length;

  const completedCount = activeOrders.filter(
    (o) => o.status === "amjilttai_zahialga"
  ).length;

  const cancelledCount = activeOrders.filter(
    (o) => o.status === "tsutsalsan_zahialga"
  ).length;

  const archivedCount = archivedOrders.length;

  // Filtered orders based on selected filter
  const filteredOrders = (() => {
    switch (orderFilter) {
      case "active":
        return activeOrders.filter(
          (o) =>
            o.status === "niitlegdsen" ||
            o.status === "agent_sudlaj_bn" ||
            o.status === "tolbor_huleej_bn"
        );
      case "completed":
        return activeOrders.filter((o) => o.status === "amjilttai_zahialga");
      case "cancelled":
        return activeOrders.filter((o) => o.status === "tsutsalsan_zahialga");
      case "archived":
        return archivedOrders;
      default:
        return activeOrders;
    }
  })();

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [orderFilter]);

  // Handle filter change
  const handleSetOrderFilter = useCallback((filter: UserOrderFilterType) => {
    setOrderFilter(filter);
    setCurrentPage(1);
  }, []);

  return {
    activeOrders,
    archivedOrders,
    bundleOrders,
    orderFilter,
    setOrderFilter: handleSetOrderFilter,
    filteredOrders,
    activeCount,
    completedCount,
    cancelledCount,
    archivedCount,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedOrders,
    itemsPerPage,
    latestVoiceMessages,
    setLatestVoiceMessages,
    socketRef,
  };
}
