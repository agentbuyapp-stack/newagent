import { useState, useCallback } from "react";
import type { User, Order, RewardRequest, Cargo, BundleOrder, AgentReport } from "@/lib/api";
import type { useApiClient } from "@/lib/useApiClient";

interface UseAgentDataOptions {
  apiClient: ReturnType<typeof useApiClient>;
  clerkUser: { primaryEmailAddress?: { emailAddress: string } | null } | null | undefined;
}

interface UseAgentDataReturn {
  user: User | null;
  orders: Order[];
  rewardRequests: RewardRequest[];
  cargos: Cargo[];
  adminSettings: { accountNumber?: string; accountName?: string; bank?: string; exchangeRate?: number } | null;
  isApproved: boolean;
  loading: boolean;
  error: string;
  agentReports: Record<string, AgentReport | null>;
  setAgentReports: React.Dispatch<React.SetStateAction<Record<string, AgentReport | null>>>;
  loadData: () => Promise<void>;
}

export function useAgentData({ apiClient, clerkUser }: UseAgentDataOptions): UseAgentDataReturn {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [adminSettings, setAdminSettings] = useState<{
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    exchangeRate?: number;
  } | null>(null);
  const [agentReports, setAgentReports] = useState<Record<string, AgentReport | null>>({});

  const loadData = useCallback(async () => {
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

        if (userData.role === "user") {
          setError("Та agent эрхгүй байна. Admin-аас agent эрх авах хэрэгтэй.");
          setLoading(false);
          return;
        }
        if (userData.role !== "agent" && userData.role !== "admin") {
          setError("Та agent эрхгүй байна");
          setLoading(false);
          return;
        }

        setIsApproved(userData.isApproved || false);

        // Fetch orders
        try {
          const [ordersData, bundleOrdersData] = await Promise.all([
            apiClient.getOrders(),
            apiClient.getBundleOrders().catch(() => [] as BundleOrder[]),
          ]);

          // Convert BundleOrder to Order format
          const convertedBundleOrders: Order[] = bundleOrdersData.map((bundle) => {
            const itemNames = bundle.items.slice(0, 2).map((i) => i.productName);
            const remaining = bundle.items.length - 2;
            const productName = remaining > 0
              ? `${itemNames.join(", ")} +${remaining}`
              : itemNames.join(", ") || "Багц захиалга";

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
              bundleItems: bundle.items,
              reportMode: bundle.reportMode,
              bundleReport: bundle.bundleReport,
              userSnapshot: bundle.userSnapshot,
            } as Order;
          });

          const allOrders = [...ordersData, ...convertedBundleOrders];
          setOrders(allOrders);

          // Load agent reports
          const reports: Record<string, AgentReport | null> = {};
          for (const order of allOrders) {
            if ((order as Order & { isBundleOrder?: boolean }).isBundleOrder) continue;

            let orderAgentId = "";
            if (typeof order.agentId === "string") {
              orderAgentId = order.agentId.trim();
            } else if (order.agentId && typeof order.agentId === "object") {
              const agentIdObj = order.agentId as Record<string, unknown>;
              orderAgentId = String(agentIdObj.id || agentIdObj._id || "").trim();
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

        // Load admin settings
        try {
          const settings = await apiClient.getAdminSettings();
          setAdminSettings(settings);
        } catch {}

        // Load reward requests
        try {
          const requests = await apiClient.getMyRewardRequests();
          setRewardRequests(requests);
        } catch {
          setRewardRequests([]);
        }

        // Load cargos
        try {
          const cargosData = await apiClient.getCargos();
          setCargos(cargosData);
        } catch {}
      } catch {
        setTimeout(async () => {
          try {
            const userData = await apiClient.getMe();
            setUser(userData);
            if (userData.role === "user") {
              setError("Та agent эрхгүй байна. Admin-аас agent эрх авах хэрэгтэй.");
              return;
            }
            if (userData.role !== "agent" && userData.role !== "admin") {
              setError("Та agent эрхгүй байна");
              return;
            }
            setIsApproved(userData.isApproved || false);
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
  }, [clerkUser, apiClient]);

  return {
    user,
    orders,
    rewardRequests,
    cargos,
    adminSettings,
    isApproved,
    loading,
    error,
    agentReports,
    setAgentReports,
    loadData,
  };
}
