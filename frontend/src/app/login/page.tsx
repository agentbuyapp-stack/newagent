"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import Link from "next/link";

type Tab = "login" | "register";
type ForgotStep = "email" | "otp" | "newPassword";
type ClaimStep = "email" | "otp" | "setup";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, login, register } = useAuthContext();

  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const toggleShow = (key: string) => setShowPassword(p => ({ ...p, [key]: !p[key] }));

  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");

  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotToken, setForgotToken] = useState("");

  const [showClaim, setShowClaim] = useState(false);
  const [claimStep, setClaimStep] = useState<ClaimStep>("email");
  const [claimEmail, setClaimEmail] = useState("");
  const [claimOtp, setClaimOtp] = useState("");
  const [claimToken, setClaimToken] = useState("");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimPassword, setClaimPassword] = useState("");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(loginPhone, loginPassword);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!regName.trim()) { setError("Нэрээ оруулна уу"); setLoading(false); return; }
    if (!/^\d{8}$/.test(regPhone)) { setError("Утасны дугаар 8 оронтой байх ёстой"); setLoading(false); return; }
    if (regPassword.length < 4 || regPassword.length > 6) { setError("Нууц үг 4-6 тэмдэгт байх ёстой"); setLoading(false); return; }
    if (!/[a-zA-Z]/.test(regPassword)) { setError("Нууц үг дор хаяж 1 үсэг агуулсан байх ёстой"); setLoading(false); return; }
    if (regPhone.includes(regPassword) || regPassword.includes(regPhone)) { setError("Нууц үг утасны дугаартай давхцаж болохгүй"); setLoading(false); return; }
    try {
      await register(regPhone, regPassword, regEmail, regName.trim());
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Бүртгэлд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await apiClient.forgotPassword(forgotEmail); setSuccess("Баталгаажуулах код илгээгдлээ."); setForgotStep("otp"); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Алдаа гарлаа"); }
    finally { setLoading(false); }
  };

  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try { const r = await apiClient.verifyOtp(forgotEmail, forgotOtp); setForgotToken(r.tempToken); setSuccess("Код баталгаажлаа."); setForgotStep("newPassword"); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Код буруу"); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    if (forgotNewPassword.length < 4 || forgotNewPassword.length > 6) { setError("Нууц үг 4-6 тэмдэгт байх ёстой"); setLoading(false); return; }
    if (!/[a-zA-Z]/.test(forgotNewPassword)) { setError("Нууц үг дор хаяж 1 үсэг агуулсан байх ёстой"); setLoading(false); return; }
    try { await apiClient.resetPassword(forgotToken, forgotNewPassword); setSuccess("Нууц үг амжилттай солигдлоо!"); resetForgot(); setTab("login"); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Алдаа гарлаа"); }
    finally { setLoading(false); }
  };

  const resetForgot = () => { setShowForgot(false); setForgotStep("email"); setForgotEmail(""); setForgotOtp(""); setForgotNewPassword(""); setForgotToken(""); setError(""); };

  const handleClaimEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await apiClient.forgotPassword(claimEmail); setSuccess("Баталгаажуулах код илгээгдлээ."); setClaimStep("otp"); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Алдаа гарлаа"); }
    finally { setLoading(false); }
  };

  const handleClaimVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try { const r = await apiClient.verifyOtp(claimEmail, claimOtp); setClaimToken(r.tempToken); setSuccess("Код баталгаажлаа."); setClaimStep("setup"); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Код буруу"); }
    finally { setLoading(false); }
  };

  const handleClaimSetup = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    if (!/^\d{8}$/.test(claimPhone)) { setError("Утасны дугаар 8 оронтой байх ёстой"); setLoading(false); return; }
    if (claimPassword.length < 4 || claimPassword.length > 6) { setError("Нууц үг 4-6 тэмдэгт байх ёстой"); setLoading(false); return; }
    if (!/[a-zA-Z]/.test(claimPassword)) { setError("Нууц үг дор хаяж 1 үсэг агуулсан байх ёстой"); setLoading(false); return; }
    try {
      const r = await apiClient.claimAccount(claimToken, claimPhone, claimPassword);
      localStorage.setItem("token", r.token); apiClient.setToken(r.token); router.push("/"); router.refresh();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Алдаа гарлаа"); }
    finally { setLoading(false); }
  };

  const resetClaim = () => { setShowClaim(false); setClaimStep("email"); setClaimEmail(""); setClaimOtp(""); setClaimToken(""); setClaimPhone(""); setClaimPassword(""); setError(""); setSuccess(""); };

  const inputClass = "w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-[14px] sm:text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all placeholder:text-gray-400";
  const btnClass = "w-full px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-semibold text-[14px] sm:text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30";

  const EyeToggle = ({ field }: { field: string }) => (
    <button type="button" onClick={() => toggleShow(field)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
      {showPassword[field] ? (
        <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
      ) : (
        <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )}
    </button>
  );

  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
    </button>
  );

  const ErrorAlert = () => error ? (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2.5 rounded-xl text-[13px] sm:text-sm">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {error}
    </div>
  ) : null;

  const SuccessAlert = () => success ? (
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 px-3 sm:px-4 py-2.5 rounded-xl text-[13px] sm:text-sm">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      {success}
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] px-4 py-8 sm:py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-6 sm:mb-8">
        <img src="/icon.png" alt="AgentBuy" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">AgentBuy</span>
          <span className="text-[10px] sm:text-xs text-gray-500 leading-tight">Худалдан авалт хялбар боллоо</span>
        </div>
      </Link>

      <div className="max-w-[420px] w-full bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">

        {showClaim ? (
          <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5">
              <BackBtn onClick={resetClaim} />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Бүртгэл сэргээх</h2>
            </div>
            <ErrorAlert /><SuccessAlert />
            {claimStep === "email" && (
              <form onSubmit={handleClaimEmail} className="space-y-3.5">
                <p className="text-[13px] sm:text-sm text-gray-500">Өмнө бүртгүүлсэн имэйл хаягаа оруулна уу.</p>
                <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Имэйл</label>
                  <input type="email" required value={claimEmail} onChange={(e) => setClaimEmail(e.target.value)} className={inputClass} placeholder="example@email.com" /></div>
                <button type="submit" disabled={loading} className={btnClass}>{loading ? "Илгээж байна..." : "Код илгээх"}</button>
              </form>
            )}
            {claimStep === "otp" && (
              <form onSubmit={handleClaimVerifyOtp} className="space-y-3.5">
                <p className="text-[13px] sm:text-sm text-gray-500"><strong className="text-gray-700">{claimEmail}</strong> руу илгээсэн 6 оронтой код.</p>
                <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Баталгаажуулах код</label>
                  <input type="text" required maxLength={6} value={claimOtp} onChange={(e) => setClaimOtp(e.target.value.replace(/\D/g, ""))} className={`${inputClass} text-center tracking-[0.3em] text-lg font-mono`} placeholder="000000" /></div>
                <button type="submit" disabled={loading || claimOtp.length !== 6} className={btnClass}>{loading ? "Шалгаж байна..." : "Баталгаажуулах"}</button>
              </form>
            )}
            {claimStep === "setup" && (
              <form onSubmit={handleClaimSetup} className="space-y-3.5">
                <p className="text-[13px] sm:text-sm text-gray-500">Утас болон нууц үгээ тохируулна уу.</p>
                <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Утасны дугаар</label>
                  <input type="tel" required maxLength={8} value={claimPhone} onChange={(e) => setClaimPhone(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="99112233" />
                  <p className="mt-1 text-[11px] text-gray-400">8 оронтой</p></div>
                <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Нууц үг</label>
                  <div className="relative"><input type={showPassword["claim"] ? "text" : "password"} required minLength={4} maxLength={6} value={claimPassword} onChange={(e) => setClaimPassword(e.target.value)} className={`${inputClass} pr-12`} placeholder="Нууц үг" /><EyeToggle field="claim" /></div>
                  <p className="mt-1 text-[11px] text-gray-400">4-6 тэмдэгт, дор хаяж 1 үсэг</p></div>
                <button type="submit" disabled={loading} className="w-full px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-semibold text-[14px] sm:text-base shadow-lg shadow-green-500/20">{loading ? "Хадгалж байна..." : "Бүртгэл сэргээх"}</button>
              </form>
            )}
          </div>

        ) : showForgot ? (
          <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-2.5">
              <BackBtn onClick={resetForgot} />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Нууц үг сэргээх</h2>
            </div>
            <ErrorAlert /><SuccessAlert />
            {forgotStep === "email" && (
              <form onSubmit={handleForgotEmail} className="space-y-3.5">
                <p className="text-[13px] sm:text-sm text-gray-500">Бүртгэлтэй имэйл хаягаа оруулна уу.</p>
                <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Имэйл</label>
                  <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className={inputClass} placeholder="example@email.com" /></div>
                <button type="submit" disabled={loading} className={btnClass}>{loading ? "Илгээж байна..." : "Код илгээх"}</button>
              </form>
            )}
            {forgotStep === "otp" && (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-3.5">
                <p className="text-[13px] sm:text-sm text-gray-500"><strong className="text-gray-700">{forgotEmail}</strong> руу илгээсэн 6 оронтой код.</p>
                <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Баталгаажуулах код</label>
                  <input type="text" required maxLength={6} value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))} className={`${inputClass} text-center tracking-[0.3em] text-lg font-mono`} placeholder="000000" /></div>
                <button type="submit" disabled={loading || forgotOtp.length !== 6} className={btnClass}>{loading ? "Шалгаж байна..." : "Баталгаажуулах"}</button>
              </form>
            )}
            {forgotStep === "newPassword" && (
              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <p className="text-[13px] sm:text-sm text-gray-500">Шинэ нууц үгээ оруулна уу (4-6 тэмдэгт, 1+ үсэг).</p>
                <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Шинэ нууц үг</label>
                  <div className="relative"><input type={showPassword["forgot"] ? "text" : "password"} required minLength={4} maxLength={6} value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} className={`${inputClass} pr-12`} placeholder="Шинэ нууц үг" /><EyeToggle field="forgot" /></div></div>
                <button type="submit" disabled={loading} className={btnClass}>{loading ? "Хадгалж байна..." : "Нууц үг солих"}</button>
              </form>
            )}
          </div>

        ) : (
          <div>
            <div className="flex border-b border-gray-100">
              <button onClick={() => { setTab("login"); setError(""); setSuccess(""); }}
                className={`flex-1 py-3.5 sm:py-4 text-center font-semibold text-[13px] sm:text-sm transition-all ${tab === "login" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-gray-400 hover:text-gray-600"}`}>Нэвтрэх</button>
              <button onClick={() => { setTab("register"); setError(""); setSuccess(""); }}
                className={`flex-1 py-3.5 sm:py-4 text-center font-semibold text-[13px] sm:text-sm transition-all ${tab === "register" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30" : "text-gray-400 hover:text-gray-600"}`}>Бүртгүүлэх</button>
            </div>

            <div className="p-5 sm:p-7 space-y-4 sm:space-y-5">
              <ErrorAlert /><SuccessAlert />

              {tab === "login" && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Утасны дугаар</label>
                    <input type="tel" required maxLength={8} value={loginPhone} onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="99112233" /></div>
                  <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Нууц үг</label>
                    <div className="relative"><input type={showPassword["login"] ? "text" : "password"} required minLength={4} maxLength={6} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`${inputClass} pr-12`} placeholder="Нууц үг" /><EyeToggle field="login" /></div></div>
                  <button type="submit" disabled={loading} className={btnClass}>{loading ? "Нэвтэрч байна..." : "Нэвтрэх"}</button>
                  <div className="flex justify-between text-[13px] sm:text-sm pt-1">
                    <button type="button" onClick={() => { setShowForgot(true); setError(""); setSuccess(""); }} className="text-gray-400 hover:text-blue-600 transition-colors">Нууц үгээ мартсан?</button>
                    <button type="button" onClick={() => { setShowClaim(true); setError(""); setSuccess(""); }} className="text-green-600 hover:text-green-700 transition-colors font-medium">Бүртгэл сэргээх</button>
                  </div>
                </form>
              )}

              {tab === "register" && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Нэр</label>
                    <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} className={inputClass} placeholder="Таны нэр" /></div>
                  <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Утасны дугаар</label>
                    <input type="tel" required maxLength={8} value={regPhone} onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="99112233" />
                    <p className="mt-1 text-[11px] text-gray-400">8 оронтой утасны дугаар</p></div>
                  <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Нууц үг</label>
                    <div className="relative"><input type={showPassword["reg"] ? "text" : "password"} required minLength={4} maxLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={`${inputClass} pr-12`} placeholder="Нууц үг" /><EyeToggle field="reg" /></div>
                    <p className="mt-1 text-[11px] text-gray-400">4-6 тэмдэгт, дор хаяж 1 үсэг</p></div>
                  <div><label className="block text-[13px] sm:text-sm font-medium text-gray-700 mb-1">Имэйл</label>
                    <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputClass} placeholder="example@email.com" />
                    <p className="mt-1 text-[11px] text-gray-400">Нууц үг сэргээхэд ашиглагдана</p></div>
                  <button type="submit" disabled={loading} className={btnClass}>{loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}</button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      <Link href="/" className="mt-5 sm:mt-6 text-[13px] sm:text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Нүүр хуудас руу буцах
      </Link>
    </div>
  );
}
