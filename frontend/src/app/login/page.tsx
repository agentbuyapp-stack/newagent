"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Role } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await apiClient.register({ email, role });
      
      // Redirect based on role
      if (user.role === "agent") {
        router.push("/agent");
      } else {
        router.push("/user");
      }
    } catch (err: any) {
      setError(err.message || "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-6 p-6 sm:p-8 bg-white rounded-xl border border-gray-200">
        <div>
          <h2 className="text-center text-xl sm:text-2xl font-semibold text-gray-900">
            Нэвтрэх / Бүртгүүлэх
          </h2>
        </div>
        <form className="space-y-4 sm:space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
              Имэйл
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-900 mb-1">
              Эрх
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-4 py-3 text-base text-black bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="user">User</option>
              <option value="agent">Agent</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors font-medium text-base min-h-[44px]"
            >
              {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

