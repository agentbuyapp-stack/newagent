"use client";

import { useState, useCallback } from "react";
import type {
  User,
  Order,
  Cargo,
  AdminSettings,
  AdminSettingsData,
  AgentReport,
  RewardRequest,
  AgentSpecialty,
} from "@/lib/api";

interface UseAdminDataOptions {
  apiClient: {
    getMe: () => Promise<User>;
    getAgents: () => Promise<User[]>;
    getAdminOrders: () => Promise<Order[]>;
    getCargos: () => Promise<Cargo[]>;
    getAdminSettings: () => Promise<AdminSettings>;
    getAdminSpecialties: () => Promise<AgentSpecialty[]>;
    getRewardRequests: () => Promise<RewardRequest[]>;
    getAgentReport: (orderId: string) => Promise<AgentReport | null>;
  };
  clerkUser: { primaryEmailAddress?: { emailAddress?: string } | null } | null | undefined;
}

interface UseAdminDataReturn {
  // Data
  user: User | null;
  agents: User[];
  orders: Order[];
  cargos: Cargo[];
  adminSettings: AdminSettings | null;
  agentReports: Record<string, AgentReport | null>;
  rewardRequests: RewardRequest[];
  specialties: AgentSpecialty[];

  // State setters
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAgents: React.Dispatch<React.SetStateAction<User[]>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setCargos: React.Dispatch<React.SetStateAction<Cargo[]>>;
  setAdminSettings: React.Dispatch<React.SetStateAction<AdminSettings | null>>;
  setAgentReports: React.Dispatch<React.SetStateAction<Record<string, AgentReport | null>>>;
  setRewardRequests: React.Dispatch<React.SetStateAction<RewardRequest[]>>;
  setSpecialties: React.Dispatch<React.SetStateAction<AgentSpecialty[]>>;

  // Settings form
  settingsFormData: AdminSettingsData;
  setSettingsFormData: React.Dispatch<React.SetStateAction<AdminSettingsData>>;

  // Loading state
  loading: boolean;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;

  // Actions
  loadData: (includeRewards?: boolean) => Promise<void>;
}

export function useAdminData({
  apiClient,
  clerkUser,
}: UseAdminDataOptions): UseAdminDataReturn {
  const [user, setUser] = useState<User | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [agentReports, setAgentReports] = useState<Record<string, AgentReport | null>>({});
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);
  const [specialties, setSpecialties] = useState<AgentSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settingsFormData, setSettingsFormData] = useState<AdminSettingsData>({
    accountNumber: "",
    accountName: "",
    bank: "",
    exchangeRate: 1,
    orderLimitEnabled: true,
    maxOrdersPerDay: 10,
    maxActiveOrders: 10,
  });

  const loadData = useCallback(
    async (includeRewards = true) => {
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

          if (userData.role !== "admin") {
            setError("Та admin эрхгүй байна");
            setLoading(false);
            return;
          }

          // Load agents, orders, cargos, admin settings, specialties and reward requests
          try {
            const promises: Promise<unknown>[] = [
              apiClient.getAgents(),
              apiClient.getAdminOrders(),
              apiClient.getCargos(),
              apiClient.getAdminSettings(),
              apiClient.getAdminSpecialties(),
            ];

            if (includeRewards) {
              promises.push(apiClient.getRewardRequests());
            }

            const results = await Promise.all(promises);
            const [
              agentsData,
              ordersData,
              cargosData,
              settingsData,
              specialtiesData,
              rewardRequestsData,
            ] = results as [
              User[],
              Order[],
              Cargo[],
              AdminSettings,
              AgentSpecialty[],
              RewardRequest[] | undefined,
            ];

            setAgents(agentsData);
            setOrders(ordersData);
            setCargos(cargosData);
            setAdminSettings(settingsData);
            setSpecialties(specialtiesData || []);
            if (includeRewards && rewardRequestsData) {
              setRewardRequests(rewardRequestsData);
            }
            setSettingsFormData({
              accountNumber: settingsData.accountNumber || "",
              accountName: settingsData.accountName || "",
              bank: settingsData.bank || "",
              exchangeRate: settingsData.exchangeRate || 1,
              orderLimitEnabled: settingsData.orderLimitEnabled ?? true,
              maxOrdersPerDay: settingsData.maxOrdersPerDay ?? 10,
              maxActiveOrders: settingsData.maxActiveOrders ?? 10,
            });

            // Load agent reports for orders
            const reports: Record<string, AgentReport | null> = {};
            for (const order of ordersData) {
              if (
                order.status === "agent_sudlaj_bn" ||
                order.status === "tolbor_huleej_bn" ||
                order.status === "amjilttai_zahialga"
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
          } catch (fetchErr: unknown) {
            console.error("Error fetching data:", fetchErr);
            const errorMessage =
              fetchErr instanceof Error
                ? fetchErr.message
                : "Мэдээлэл татахад алдаа гарлаа";
            setError(errorMessage);
            setAgents([]);
            setOrders([]);
            setCargos([]);
          }
        } catch (e: unknown) {
          console.error("Error in loadData:", e);
          const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
          setError(errorMessage);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [clerkUser, apiClient]
  );

  return {
    user,
    agents,
    orders,
    cargos,
    adminSettings,
    agentReports,
    rewardRequests,
    specialties,
    setUser,
    setAgents,
    setOrders,
    setCargos,
    setAdminSettings,
    setAgentReports,
    setRewardRequests,
    setSpecialties,
    settingsFormData,
    setSettingsFormData,
    loading,
    error,
    setError,
    loadData,
  };
}
