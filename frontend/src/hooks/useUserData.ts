"use client";

import { useState, useCallback } from "react";
import type { User, Profile, Order, AgentReport, BundleOrder, Cargo, PublicAgent } from "@/lib/api";

interface AdminSettingsPartial {
  accountNumber?: string;
  accountName?: string;
  bank?: string;
  exchangeRate?: number;
}

interface UseUserDataOptions {
  apiClient: {
    getMe: () => Promise<User>;
    getAdminSettings: () => Promise<AdminSettingsPartial>;
    getCargos: () => Promise<Cargo[]>;
    getTopAgents: () => Promise<PublicAgent[]>;
    getPublicAgents: () => Promise<PublicAgent[]>;
    getOrders: () => Promise<Order[]>;
    getBundleOrders: () => Promise<BundleOrder[]>;
    getAgentReport: (orderId: string) => Promise<AgentReport | null>;
  };
  clerkUser: { primaryEmailAddress?: { emailAddress?: string } | null } | null | undefined;
}

interface UseUserDataReturn {
  user: User | null;
  profile: Profile | null;
  orders: Order[];
  bundleOrders: BundleOrder[];
  cargos: Cargo[];
  agents: PublicAgent[];
  agentReports: Record<string, AgentReport | null>;
  adminSettings: AdminSettingsPartial | null;
  loading: boolean;
  error: string;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setBundleOrders: React.Dispatch<React.SetStateAction<BundleOrder[]>>;
  setAgentReports: React.Dispatch<React.SetStateAction<Record<string, AgentReport | null>>>;
  loadData: () => Promise<void>;
  loadAgentReport: (orderId: string) => Promise<void>;
}

export function useUserData({ apiClient, clerkUser }: UseUserDataOptions): UseUserDataReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bundleOrders, setBundleOrders] = useState<BundleOrder[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [agentReports, setAgentReports] = useState<Record<string, AgentReport | null>>({});
  const [adminSettings, setAdminSettings] = useState<AdminSettingsPartial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        if (userData.profile) setProfile(userData.profile);

        const [settingsResult, cargosResult, agentsResult, ordersResult, bundleOrdersResult] =
          await Promise.allSettled([
            apiClient.getAdminSettings(),
            apiClient.getCargos(),
            apiClient.getTopAgents(),
            apiClient.getOrders(),
            apiClient.getBundleOrders(),
          ]);

        if (settingsResult.status === "fulfilled") setAdminSettings(settingsResult.value);
        if (cargosResult.status === "fulfilled") setCargos(cargosResult.value);
        if (bundleOrdersResult.status === "fulfilled") setBundleOrders(bundleOrdersResult.value);

        if (agentsResult.status === "fulfilled" && agentsResult.value.length > 0) {
          setAgents(agentsResult.value);
        } else {
          try {
            const publicAgents = await apiClient.getPublicAgents();
            setAgents(publicAgents.slice(0, 10));
          } catch {
            setAgents([]);
          }
        }

        if (ordersResult.status === "fulfilled") {
          const ordersData = ordersResult.value;
          setOrders(ordersData);

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
            const reportsMap: Record<string, AgentReport | null> = {};
            reportResults.forEach(({ orderId, report }) => {
              reportsMap[orderId] = report;
            });
            setAgentReports((prev) => ({ ...prev, ...reportsMap }));
          }
        }
      } catch {
        setTimeout(async () => {
          try {
            const userData = await apiClient.getMe();
            setUser(userData);
            if (userData.profile) setProfile(userData.profile);
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

  const loadAgentReport = useCallback(
    async (orderId: string) => {
      if (agentReports[orderId] !== undefined) return;
      try {
        const report = await apiClient.getAgentReport(orderId);
        setAgentReports((prev) => ({ ...prev, [orderId]: report }));
      } catch {
        setAgentReports((prev) => ({ ...prev, [orderId]: null }));
      }
    },
    [apiClient, agentReports]
  );

  return {
    user, profile, orders, bundleOrders, cargos, agents, agentReports, adminSettings,
    loading, error, setUser, setProfile, setOrders, setBundleOrders, setAgentReports,
    loadData, loadAgentReport,
  };
}
