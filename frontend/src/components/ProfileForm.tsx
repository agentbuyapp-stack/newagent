"use client";

import { useState, useEffect } from "react";
import {
  apiClient,
  type Profile,
  type ProfileData,
  type Cargo,
} from "@/lib/api";

interface ProfileFormProps {
  profile?: Profile | null;
  onSuccess?: () => void;
  hideCargo?: boolean; // Hide cargo field for agents, show accountNumber instead
}

export default function ProfileForm({
  profile,
  onSuccess,
  hideCargo = false,
}: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileData>({
    name: profile?.name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    cargo: profile?.cargo || "",
    accountNumber: profile?.accountNumber || "",
    emailNotificationsEnabled: profile?.emailNotificationsEnabled ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(true);
  useEffect(() => {
    if (!hideCargo) {
      loadCargos();
    }
  }, [hideCargo]);

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        email: profile.email || "",
        cargo: profile.cargo || "",
        accountNumber: profile.accountNumber || "",
        emailNotificationsEnabled: profile.emailNotificationsEnabled ?? true,
      });
    }
  }, [profile]);

  const loadCargos = async () => {
    setLoadingCargos(true);
    try {
      const cargosData = await apiClient.getCargos();
      setCargos(cargosData);
    } catch (err) {
      console.error("Failed to load cargos:", err);
      setError("Ачааны төрлүүдийг татаж чадсангүй.");
    } finally {
      setLoadingCargos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await apiClient.updateProfile(formData);
      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Алдаа гарлаа";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
          Профайл амжилттай шинэчлэгдлээ!
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          Нэр
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Жишээ: Бат"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          Утас
        </label>
        <input
          id="phone"
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="99112233"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-900 mb-1"
        >
          Имэйл
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="example@email.com"
        />
      </div>

      {!hideCargo ? (
        <div>
          <label
            htmlFor="cargo"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Карго сонгох
          </label>
          {loadingCargos ? (
            <p className="text-sm text-gray-500">
              Ачааны төрлүүдийг ачааллаж байна...
            </p>
          ) : (
            <select
              id="cargo"
              required
              value={formData.cargo}
              onChange={(e) =>
                setFormData({ ...formData, cargo: e.target.value })
              }
              className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Карго сонгоно уу</option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.name}>
                  {cargo.name}
                </option>
              ))}
            </select>
          )}
          {!loadingCargos && cargos.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Ачааны төрөл байхгүй байна. Admin-аас нэмэх хэрэгтэй.
            </p>
          )}
        </div>
      ) : (
        <div>
          <label
            htmlFor="accountNumber"
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Дансны дугаар
          </label>
          <input
            id="accountNumber"
            type="text"
            value={formData.accountNumber}
            onChange={(e) =>
              setFormData({ ...formData, accountNumber: e.target.value })
            }
            className="w-full px-3 py-2 text-sm text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Жишээ: 1234567890"
          />
        </div>
      )}

      {/* Email notification toggle */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <label
              htmlFor="emailNotifications"
              className="text-sm font-medium text-gray-900"
            >
              Email мэдэгдэл
            </label>
            <p className="text-xs text-gray-500">
              Захиалгын статус өөрчлөгдөхөд email авах
            </p>
          </div>
          <button
            type="button"
            id="emailNotifications"
            onClick={() =>
              setFormData({
                ...formData,
                emailNotificationsEnabled: !formData.emailNotificationsEnabled,
              })
            }
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              formData.emailNotificationsEnabled ? "bg-blue-500" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={formData.emailNotificationsEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData.emailNotificationsEnabled
                  ? "translate-x-4"
                  : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-3 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors font-medium text-sm"
      >
        {loading ? "Хадгалж байна..." : profile ? "Шинэчлэх" : "Үүсгэх"}
      </button>
    </form>
  );
}
