"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const { logout } = useAuthContext();
  const router = useRouter();

  const handleSignOut = () => {
    if (!confirm("Та системээс гарахдаа итгэлтэй байна уу?")) return;
    logout();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-colors font-medium"
      title="Системээс гарах"
    >
      Гарах
    </button>
  );
}
