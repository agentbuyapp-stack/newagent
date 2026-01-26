import type { Order, AgentReport, AdminSettings, BundleOrder } from "@/lib/api";

// Extended Order type with bundle properties
export interface ExtendedOrder extends Order {
  isBundleOrder?: boolean;
  userSnapshot?: {
    name: string;
    phone: string;
    cargo: string;
  };
  bundleItems?: BundleOrder["items"];
}

// Order Detail Modal Props
export interface OrderDetailModalProps {
  order: ExtendedOrder;
  currentReport: AgentReport | null | undefined;
  agentReports: Record<string, AgentReport | null>;
  adminSettings: AdminSettings | null;
  userId: string | undefined;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
  onOpenReportForm: (order: Order) => void;
  onOpenBundleReportForm: (order: Order) => void;
  onUpdateReport: (orderId: string, amount: number, reason: string) => Promise<void>;
  onArchive: (orderId: string) => Promise<void>;
  onOpenCancelModal: (orderId: string) => void;
  onOpenChat: () => void;
  statusUpdateLoading: boolean;
  archiveLoading: boolean;
}

// Order filter type
export type OrderFilterType = "active" | "completed" | "cancelled" | "archived";
