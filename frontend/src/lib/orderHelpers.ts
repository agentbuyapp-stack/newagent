import type { OrderStatus } from "@/lib/api";

// Status text mapping (Mongolian)
export const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case "niitlegdsen":
      return "Нийтэлсэн";
    case "agent_sudlaj_bn":
      return "Agent шалгаж байна";
    case "tolbor_huleej_bn":
      return "Төлбөр хүлээж байна";
    case "amjilttai_zahialga":
      return "Амжилттай захиалга";
    case "tsutsalsan_zahialga":
      return "Цуцлагдсан захиалга";
    default:
      return status;
  }
};

// Status color classes
export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case "niitlegdsen":
      return "bg-gray-100 text-gray-700";
    case "agent_sudlaj_bn":
      return "bg-amber-100 text-amber-700";
    case "tolbor_huleej_bn":
      return "bg-blue-100 text-blue-700";
    case "amjilttai_zahialga":
      return "bg-emerald-100 text-emerald-700";
    case "tsutsalsan_zahialga":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Check if order can be archived
export const canArchiveOrder = (status: OrderStatus): boolean => {
  return status === "amjilttai_zahialga" || status === "tsutsalsan_zahialga";
};

// Calculate user payment amount from yuan
export const calculateUserPaymentAmount = (
  agentAmount: number,
  exchangeRate: number
): number => {
  const userYuan = Math.ceil(agentAmount * 1.05); // 5% commission
  return Math.ceil(userYuan * exchangeRate);
};
