"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

type Step = "login" | "forgotEmail" | "forgotOtp" | "forgotNewPassword";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthContext();

  const [step, setStep] = useState<Step>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
        <div className="w-8 h-8 border-4 border-indigo-300 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user?.role === "admin") {
    router.push("/admin/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiClient.adminLogin(email, password);
      localStorage.setItem("token", result.token);
      apiClient.setToken(result.token);
      window.location.href = "/admin/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiClient.forgotPassword(forgotEmail);
      setSuccess("Баталгаажуулах код илгээгдлээ.");
      setStep("forgotOtp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await apiClient.verifyOtp(forgotEmail, forgotOtp);
      setForgotToken(r.tempToken);
      setSuccess("Код баталгаажлаа.");
      setStep("forgotNewPassword");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Код буруу");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (newPassword.length < 4 || newPassword.length > 6) {
      setError("Нууц үг 4-6 тэмдэгт байх ёстой");
      setLoading(false);
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      setError("Нууц үг дор хаяж 1 үсэг агуулсан байх ёстой");
      setLoading(false);
      return;
    }
    try {
      await apiClient.resetPassword(forgotToken, newPassword);
      setSuccess("Нууц үг амжилттай солигдлоо! Дахин нэвтэрнэ үү.");
      setStep("login");
      setForgotEmail("");
      setForgotOtp("");
      setForgotToken("");
      setNewPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 text-sm text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent focus:bg-white/15 transition-all placeholder:text-white/40";
  const btnClass =
    "w-full px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/30";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-sm text-indigo-300/70 mt-1">AgentBuy удирдлагын самбар</p>
      </div>

      {/* Card */}
      <div className="max-w-[400px] w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-2.5 rounded-xl text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-400/30 text-green-300 px-4 py-2.5 rounded-xl text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Имэйл</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Нууц үг</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={4}
                    maxLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="Нууц үг"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("forgotEmail"); setError(""); setSuccess(""); }}
                className="w-full text-center text-sm text-indigo-300/60 hover:text-indigo-300 transition-colors pt-1"
              >
                Нууц үгээ мартсан?
              </button>
            </form>
          )}

          {step === "forgotEmail" && (
            <form onSubmit={handleForgotEmail} className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => { setStep("login"); setError(""); setSuccess(""); }} className="p-1 text-white/40 hover:text-white/70 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-base font-semibold text-white">Нууц үг сэргээх</h3>
              </div>
              <p className="text-sm text-indigo-300/60">Бүртгэлтэй имэйл хаягаа оруулна уу.</p>
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Имэйл</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className={inputClass}
                  placeholder="example@email.com"
                />
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Илгээж байна..." : "Код илгээх"}
              </button>
            </form>
          )}

          {step === "forgotOtp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => { setStep("forgotEmail"); setError(""); setSuccess(""); }} className="p-1 text-white/40 hover:text-white/70 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-base font-semibold text-white">Код оруулах</h3>
              </div>
              <p className="text-sm text-indigo-300/60">
                <strong className="text-indigo-200">{forgotEmail}</strong> руу илгээсэн 6 оронтой код.
              </p>
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Баталгаажуулах код</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                  className={`${inputClass} text-center tracking-[0.3em] text-lg font-mono`}
                  placeholder="000000"
                />
              </div>
              <button type="submit" disabled={loading || forgotOtp.length !== 6} className={btnClass}>
                {loading ? "Шалгаж байна..." : "Баталгаажуулах"}
              </button>
            </form>
          )}

          {step === "forgotNewPassword" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <button type="button" onClick={() => { setStep("forgotOtp"); setError(""); setSuccess(""); }} className="p-1 text-white/40 hover:text-white/70 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-base font-semibold text-white">Шинэ нууц үг</h3>
              </div>
              <p className="text-sm text-indigo-300/60">Шинэ нууц үгээ оруулна уу (4-6 тэмдэгт, 1+ үсэг).</p>
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Шинэ нууц үг</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={4}
                    maxLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="Шинэ нууц үг"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Хадгалж байна..." : "Нууц үг солих"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Back to home */}
      <button
        onClick={() => router.push("/")}
        className="mt-6 text-sm text-indigo-300/40 hover:text-indigo-300/70 transition-colors flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Нүүр хуудас
      </button>
    </div>
  );
}
