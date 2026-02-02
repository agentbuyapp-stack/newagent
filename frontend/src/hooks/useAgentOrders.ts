import { useState, useMemo, useEffect, useCallback } from "react";
import type { Order, User, BundleOrder, AgentReport, LatestVoiceMessage } from "@/lib/api";

export type OrderFilterType = "active" | "completed" | "cancelled" | "archived";

interface UseAgentOrdersOptions {
  orders: Order[];
  user: User | null;
  agentReports: Record<string, AgentReport | null>;
  apiClient: {
    getLatestVoiceMessage: (orderId: string) => Promise<LatestVoiceMessage | null>;
  };
}

interface UseAgentOrdersReturn {
  // Filtered order lists
  publishedOrders: Order[];
  myOrders: Order[];
  archivedOrders: Order[];
  filteredMyOrders: Order[];
  paginatedMyOrders: Order[];

  // Filter state
  orderFilter: OrderFilterType;
  setOrderFilter: (filter: OrderFilterType) => void;

  // Pagination
  myOrdersPage: number;
  setMyOrdersPage: (page: number) => void;
  myOrdersTotalPages: number;
  ITEMS_PER_PAGE: number;

  // Counts
  myActiveCount: number;
  myCompletedCount: number;
  myCancelledCount: number;
  myArchivedCount: number;

  // Voice messages
  latestVoiceMessages: Record<string, LatestVoiceMessage | null>;
  fetchLatestVoiceMessages: () => Promise<void>;
}

export function useAgentOrders({
  orders,
  user,
  agentReports,
  apiClient,
}: UseAgentOrdersOptions): UseAgentOrdersReturn {
  const ITEMS_PER_PAGE = 10;

  const [orderFilter, setOrderFilter] = useState<OrderFilterType>("active");
  const [myOrdersPage, setMyOrdersPage] = useState(1);
  const [latestVoiceMessages, setLatestVoiceMessages] = useState<
    Record<string, LatestVoiceMessage | null>
  >({});

  // Published orders - open orders for agents to take
  const publishedOrders = useMemo(() => {
    if (user?.role === "agent") {
      return orders.filter(
        (order) => order.status === "niitlegdsen" && !order.agentId
      );
    }
    return orders.filter((order) => order.status === "niitlegdsen");
  }, [orders, user?.role]);

  // Agent's own orders (excluding published and archived)
  const myOrders = useMemo(() => {
    if (user?.role === "admin") {
      return orders.filter(
        (order) => order.status !== "niitlegdsen" && !order.archivedByAgent
      );
    }

    return orders.filter((order) => {
      if (!order.agentId || !user?.id) return false;
      if (order.archivedByAgent) return false;

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
      return orderAgentId === userId && order.status !== "niitlegdsen";
    });
  }, [orders, user?.role, user?.id]);

  // Archived orders
  const archivedOrders = useMemo(() => {
    if (user?.role === "admin") {
      return orders.filter((order) => order.archivedByAgent);
    }

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

  // Filtered orders based on filter selection
  const filteredMyOrders = useMemo(() => {
    if (orderFilter === "archived") {
      return archivedOrders;
    }

    return myOrders.filter((order) => {
      if (orderFilter === "active") {
        return (
          order.status === "agent_sudlaj_bn" ||
          order.status === "tolbor_huleej_bn"
        );
      }
      if (orderFilter === "completed") {
        return order.status === "amjilttai_zahialga";
      }
      if (orderFilter === "cancelled") {
        return order.status === "tsutsalsan_zahialga";
      }
      return false;
    });
  }, [myOrders, archivedOrders, orderFilter]);

  // Pagination
  const myOrdersTotalPages = Math.ceil(filteredMyOrders.length / ITEMS_PER_PAGE);

  const paginatedMyOrders = useMemo(() => {
    const startIndex = (myOrdersPage - 1) * ITEMS_PER_PAGE;
    return filteredMyOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMyOrders, myOrdersPage]);

  // Reset page when filter changes
  useEffect(() => {
    setMyOrdersPage(1);
  }, [orderFilter]);

  // Order counts
  const myActiveCount = myOrders.filter(
    (order) =>
      order.status === "agent_sudlaj_bn" || order.status === "tolbor_huleej_bn"
  ).length;

  const myCompletedCount = myOrders.filter(
    (order) => order.status === "amjilttai_zahialga"
  ).length;

  const myCancelledCount = myOrders.filter(
    (order) => order.status === "tsutsalsan_zahialga"
  ).length;

  const myArchivedCount = archivedOrders.length;

  // Fetch latest voice messages for active orders
  const fetchLatestVoiceMessages = useCallback(async () => {
    const activeOrders = myOrders.filter((o) =>
      ["niitlegdsen", "agent_sudlaj_bn", "tolbor_huleej_bn", "amjilttai_zahialga"].includes(o.status)
    );

    const results: Record<string, LatestVoiceMessage | null> = {};
    await Promise.all(
      activeOrders.map(async (order) => {
        try {
          const voice = await apiClient.getLatestVoiceMessage(order.id);
          results[order.id] = voice;
        } catch {
          results[order.id] = null;
        }
      })
    );
    setLatestVoiceMessages(results);
  }, [myOrders, apiClient]);

  useEffect(() => {
    if (myOrders.length > 0) {
      fetchLatestVoiceMessages();
    }
  }, [myOrders.length, fetchLatestVoiceMessages]);

  return {
    publishedOrders,
    myOrders,
    archivedOrders,
    filteredMyOrders,
    paginatedMyOrders,
    orderFilter,
    setOrderFilter,
    myOrdersPage,
    setMyOrdersPage,
    myOrdersTotalPages,
    ITEMS_PER_PAGE,
    myActiveCount,
    myCompletedCount,
    myCancelledCount,
    myArchivedCount,
    latestVoiceMessages,
    fetchLatestVoiceMessages,
  };
}
