import { useState, useCallback } from "react";
import type { AgentReport } from "@/lib/api";

interface UseAgentReportsOptions {
  apiClient: {
    getAgentReport: (orderId: string) => Promise<AgentReport | null>;
    updateAgentReport: (orderId: string, data: { userAmount: number; editReason?: string }) => Promise<AgentReport>;
  };
  agentReports?: Record<string, AgentReport | null>;
  setAgentReports?: React.Dispatch<React.SetStateAction<Record<string, AgentReport | null>>>;
}

interface UseAgentReportsReturn {
  agentReports: Record<string, AgentReport | null>;
  setAgentReports: React.Dispatch<React.SetStateAction<Record<string, AgentReport | null>>>;
  loadAgentReport: (orderId: string) => Promise<void>;

  // Edit report states
  isEditingReport: boolean;
  setIsEditingReport: (value: boolean) => void;
  editReportAmount: number;
  setEditReportAmount: (value: number) => void;
  editReportReason: string;
  setEditReportReason: (value: string) => void;
  editReportLoading: boolean;
  handleUpdateReport: (orderId: string) => Promise<void>;

  // Utility
  calculateUserPaymentAmount: (agentReport: AgentReport | null, exchangeRate?: number) => number;
}

export function useAgentReports({
  apiClient,
  agentReports: externalAgentReports,
  setAgentReports: externalSetAgentReports,
}: UseAgentReportsOptions): UseAgentReportsReturn {
  // Use internal state only if external state is not provided
  const [internalAgentReports, internalSetAgentReports] = useState<Record<string, AgentReport | null>>({});

  const agentReports = externalAgentReports ?? internalAgentReports;
  const setAgentReports = externalSetAgentReports ?? internalSetAgentReports;

  const [isEditingReport, setIsEditingReport] = useState(false);
  const [editReportAmount, setEditReportAmount] = useState<number>(0);
  const [editReportReason, setEditReportReason] = useState("");
  const [editReportLoading, setEditReportLoading] = useState(false);

  const loadAgentReport = useCallback(async (orderId: string) => {
    try {
      const report = await apiClient.getAgentReport(orderId);
      setAgentReports((prev) => ({ ...prev, [orderId]: report }));
    } catch {
      setAgentReports((prev) => ({ ...prev, [orderId]: null }));
    }
  }, [apiClient, setAgentReports]);

  const handleUpdateReport = useCallback(async (orderId: string) => {
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
  }, [editReportAmount, editReportReason, apiClient, setAgentReports]);

  const calculateUserPaymentAmount = useCallback(
    (agentReport: AgentReport | null, exchangeRate: number = 1): number => {
      if (!agentReport) return 0;
      return Math.round(agentReport.userAmount * exchangeRate * 1.05);
    },
    []
  );

  return {
    agentReports,
    setAgentReports,
    loadAgentReport,
    isEditingReport,
    setIsEditingReport,
    editReportAmount,
    setEditReportAmount,
    editReportReason,
    setEditReportReason,
    editReportLoading,
    handleUpdateReport,
    calculateUserPaymentAmount,
  };
}
