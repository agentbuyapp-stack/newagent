"use client";

import { useState, useCallback } from "react";
import type { User, Cargo, AdminSettings, AdminSettingsData, OrderStatus } from "@/lib/api";

interface CargoFormData {
  name: string;
  description: string;
  phone: string;
  location: string;
  website: string;
  facebook: string;
  imageUrl: string;
}

interface UseAdminActionsOptions {
  apiClient: {
    addAgent: (email: string) => Promise<User>;
    approveAgent: (agentId: string, approved: boolean) => Promise<User>;
    verifyUserPayment: (orderId: string) => Promise<unknown>;
    cancelPayment: (orderId: string, reason: string, type: "order" | "bundle") => Promise<unknown>;
    markAgentPaymentPaid: (orderId: string) => Promise<unknown>;
    updateOrderStatus: (orderId: string, status: OrderStatus, cancelReason?: string) => Promise<unknown>;
    createCargo: (data: CargoFormData) => Promise<Cargo>;
    updateCargo: (cargoId: string, data: CargoFormData) => Promise<Cargo>;
    deleteCargo: (cargoId: string) => Promise<void>;
    updateAdminSettings: (data: AdminSettingsData) => Promise<AdminSettings>;
    uploadImage: (base64: string) => Promise<{ imageUrl: string }>;
    approveRewardRequest: (requestId: string) => Promise<unknown>;
    rejectRewardRequest: (requestId: string) => Promise<unknown>;
    recalculateAgentStats: () => Promise<{ message: string; agents: { agentId: string; email: string; totalOrders: number; successfulOrders: number; successRate: number }[] }>;
  };
  loadData: () => Promise<void>;
  setAdminSettings: (settings: AdminSettings) => void;
}

interface UseAdminActionsReturn {
  // Loading states
  addingAgent: boolean;
  savingSettings: boolean;
  settingsSaved: boolean;
  uploadingCargoImage: boolean;

  // Agent actions
  handleAddAgent: (email: string) => Promise<boolean>;
  handleApproveAgent: (agentId: string, approved: boolean) => Promise<void>;

  // Order actions
  handleVerifyPayment: (orderId: string) => Promise<void>;
  handleCancelPayment: (orderId: string, isBundleOrder?: boolean) => Promise<void>;
  handleAgentPayment: (orderId: string) => Promise<void>;
  handleApproveOrder: (orderId: string) => Promise<void>;
  handleCancelOrder: (orderId: string) => Promise<void>;

  // Cargo actions
  handleCreateCargo: (formData: CargoFormData, onSuccess: () => void) => Promise<void>;
  handleUpdateCargo: (cargoId: string, formData: CargoFormData, onSuccess: () => void) => Promise<void>;
  handleDeleteCargo: (cargoId: string) => Promise<void>;
  handleCargoImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    setFormData: React.Dispatch<React.SetStateAction<CargoFormData>>
  ) => Promise<void>;

  // Settings actions
  handleSaveSettings: (
    formData: AdminSettingsData,
    onSuccess: () => void
  ) => Promise<void>;
  setSettingsSaved: React.Dispatch<React.SetStateAction<boolean>>;

  // Reward actions
  handleApproveReward: (requestId: string, amount: number) => Promise<void>;
  handleRejectReward: (requestId: string, amount: number) => Promise<void>;

  // Stats
  handleRecalculateStats: () => Promise<void>;
}

export function useAdminActions({
  apiClient,
  loadData,
  setAdminSettings,
}: UseAdminActionsOptions): UseAdminActionsReturn {
  const [addingAgent, setAddingAgent] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [uploadingCargoImage, setUploadingCargoImage] = useState(false);

  // Agent actions
  const handleAddAgent = useCallback(
    async (email: string): Promise<boolean> => {
      if (!email.trim()) {
        alert("Email оруулах шаардлагатай");
        return false;
      }

      setAddingAgent(true);
      try {
        await apiClient.addAgent(email.trim());
        await loadData();
        alert("Agent амжилттай нэмэгдлээ!");
        return true;
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "Agent нэмэхэд алдаа гарлаа";
        alert(errorMessage);
        return false;
      } finally {
        setAddingAgent(false);
      }
    },
    [apiClient, loadData]
  );

  const handleApproveAgent = useCallback(
    async (agentId: string, approved: boolean) => {
      try {
        await apiClient.approveAgent(agentId, approved);
        await loadData();
        alert(`Agent ${approved ? "батлагдлаа" : "цуцлагдлаа"}`);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  // Order actions
  const handleVerifyPayment = useCallback(
    async (orderId: string) => {
      try {
        await apiClient.verifyUserPayment(orderId);
        await loadData();
        alert("User төлбөр батлагдлаа");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  const handleCancelPayment = useCallback(
    async (orderId: string, isBundleOrder: boolean = false) => {
      const reason = prompt(
        "Төлбөр цуцлах шалтгаан (заавал биш):",
        "Төлбөр ирээгүй"
      );
      if (reason === null) return;

      try {
        await apiClient.cancelPayment(
          orderId,
          reason,
          isBundleOrder ? "bundle" : "order"
        );
        await loadData();
        alert("Төлбөр цуцлагдлаа. Захиалга цуцлагдсан төлөвт шилжлээ.");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  const handleAgentPayment = useCallback(
    async (orderId: string) => {
      try {
        await apiClient.markAgentPaymentPaid(orderId);
        await loadData();
        alert(
          "Agent төлбөр төлөгдсөн гэж тэмдэглэгдлээ. Agent-ийн оноо нэмэгдлээ."
        );
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        if (errorMessage.includes("no assigned agent")) {
          alert(
            "Энэ захиалгад agent томилогдоогүй байна. Эхлээд agent захиалгыг авсан эсэхийг шалгана уу."
          );
        } else {
          alert(errorMessage);
        }
      }
    },
    [apiClient, loadData]
  );

  const handleApproveOrder = useCallback(
    async (orderId: string) => {
      if (!confirm("Энэ захиалгыг амжилттай гэж батлах уу?")) {
        return;
      }
      try {
        await apiClient.updateOrderStatus(orderId, "amjilttai_zahialga");
        await loadData();
        alert("Захиалга амжилттай батлагдлаа");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      if (!confirm("Энэ захиалгыг цуцлах уу?")) {
        return;
      }
      try {
        await apiClient.updateOrderStatus(orderId, "tsutsalsan_zahialga");
        await loadData();
        alert("Захиалга цуцлагдлаа");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  // Cargo actions
  const handleCreateCargo = useCallback(
    async (formData: CargoFormData, onSuccess: () => void) => {
      try {
        if (!formData.name.trim()) {
          alert("Cargo нэр оруулах шаардлагатай");
          return;
        }
        await apiClient.createCargo(formData);
        await loadData();
        onSuccess();
        alert("Cargo амжилттай үүслээ");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  const handleUpdateCargo = useCallback(
    async (cargoId: string, formData: CargoFormData, onSuccess: () => void) => {
      try {
        await apiClient.updateCargo(cargoId, formData);
        await loadData();
        onSuccess();
        alert("Cargo амжилттай шинэчлэгдлээ");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  const handleDeleteCargo = useCallback(
    async (cargoId: string) => {
      if (!confirm("Та энэ cargo-г устгахдаа итгэлтэй байна уу?")) {
        return;
      }
      try {
        await apiClient.deleteCargo(cargoId);
        await loadData();
        alert("Cargo амжилттай устгагдлаа");
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  const handleCargoImageUpload = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      setFormData: React.Dispatch<React.SetStateAction<CargoFormData>>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Зөвхөн зураг оруулах боломжтой");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Зурагны хэмжээ 5MB-аас бага байх ёстой");
        return;
      }

      setUploadingCargoImage(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const result = await apiClient.uploadImage(base64);
            setFormData((prev) => ({ ...prev, imageUrl: result.imageUrl }));
          } catch (err) {
            console.error("Upload error:", err);
            alert("Зураг upload хийхэд алдаа гарлаа");
          } finally {
            setUploadingCargoImage(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("File read error:", err);
        setUploadingCargoImage(false);
      }
    },
    [apiClient]
  );

  // Settings actions
  const handleSaveSettings = useCallback(
    async (formData: AdminSettingsData, onSuccess: () => void) => {
      setSavingSettings(true);
      try {
        const updatedSettings = await apiClient.updateAdminSettings(formData);
        setAdminSettings(updatedSettings);
        setSettingsSaved(true);
        onSuccess();
        setTimeout(() => {
          setSettingsSaved(false);
        }, 3000);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      } finally {
        setSavingSettings(false);
      }
    },
    [apiClient, setAdminSettings]
  );

  // Reward actions
  const handleApproveReward = useCallback(
    async (requestId: string, amount: number) => {
      if (
        !confirm(
          `Та ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮ урамшууллыг батлахдаа итгэлтэй байна уу?`
        )
      ) {
        return;
      }

      try {
        await apiClient.approveRewardRequest(requestId);
        alert("Урамшуулал амжилттай батлагдлаа.");
        await loadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  const handleRejectReward = useCallback(
    async (requestId: string, amount: number) => {
      if (
        !confirm(
          `Та ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ₮ урамшууллын хүсэлтийг татгалзахдаа итгэлтэй байна уу? Оноо agent-д буцаагдана.`
        )
      ) {
        return;
      }

      try {
        await apiClient.rejectRewardRequest(requestId);
        alert("Хүсэлт татгалзсан. Оноо agent-д буцаагдлаа.");
        await loadData();
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
        alert(errorMessage);
      }
    },
    [apiClient, loadData]
  );

  // Stats
  const handleRecalculateStats = useCallback(async () => {
    if (
      !confirm(
        "Бүх агентуудын статистикийг дахин тооцоолох уу? Энэ үйлдэл хэдэн секунд болж магадгүй."
      )
    ) {
      return;
    }
    try {
      const result = await apiClient.recalculateAgentStats();
      alert(
        `Амжилттай! ${result.agents?.length || 0} агентын статистик шинэчлэгдлээ.`
      );
      await loadData();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      alert(errorMessage);
    }
  }, [apiClient, loadData]);

  return {
    addingAgent,
    savingSettings,
    settingsSaved,
    uploadingCargoImage,
    handleAddAgent,
    handleApproveAgent,
    handleVerifyPayment,
    handleCancelPayment,
    handleAgentPayment,
    handleApproveOrder,
    handleCancelOrder,
    handleCreateCargo,
    handleUpdateCargo,
    handleDeleteCargo,
    handleCargoImageUpload,
    handleSaveSettings,
    setSettingsSaved,
    handleApproveReward,
    handleRejectReward,
    handleRecalculateStats,
  };
}

export type { CargoFormData };
