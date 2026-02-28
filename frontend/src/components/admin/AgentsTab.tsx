"use client";

import { useState } from "react";
import type { User } from "@/lib/api";

interface AgentFormData {
  phone: string;
  password: string;
  email: string;
  displayName?: string;
}

interface AgentsTabProps {
  agents: User[];
  addingAgent: boolean;
  onAddAgent: (data: AgentFormData) => Promise<boolean>;
  onApproveAgent: (agentId: string, approved: boolean) => Promise<void>;
  onEditAgent: (agent: User) => void;
}

export function AgentsTab({
  agents,
  addingAgent,
  onAddAgent,
  onApproveAgent,
  onEditAgent,
}: AgentsTabProps) {
  const [agentPhone, setAgentPhone] = useState("");
  const [agentPassword, setAgentPassword] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentDisplayName, setAgentDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onAddAgent({
      phone: agentPhone,
      password: agentPassword,
      email: agentEmail,
      displayName: agentDisplayName || undefined,
    });
    if (success) {
      setAgentPhone("");
      setAgentPassword("");
      setAgentEmail("");
      setAgentDisplayName("");
    }
  };

  const isFormValid = agentPhone.trim().length === 8 && agentPassword.trim().length >= 4 && agentEmail.trim();

  return (
    <div className="space-y-4">
      {/* Add New Agent Form */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Шинэ Agent нэмэх
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Утасны дугаар</label>
              <input
                type="tel"
                maxLength={8}
                value={agentPhone}
                onChange={(e) => setAgentPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="99112233"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-11"
                disabled={addingAgent}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Нууц үг (4-6 тэмдэгт)</label>
              <input
                type="text"
                minLength={4}
                maxLength={6}
                value={agentPassword}
                onChange={(e) => setAgentPassword(e.target.value)}
                placeholder="Нууц үг"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-11"
                disabled={addingAgent}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Имэйл</label>
              <input
                type="email"
                value={agentEmail}
                onChange={(e) => setAgentEmail(e.target.value)}
                placeholder="agent@example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-11"
                disabled={addingAgent}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Нэр (заавал биш)</label>
              <input
                type="text"
                value={agentDisplayName}
                onChange={(e) => setAgentDisplayName(e.target.value)}
                placeholder="Agent нэр"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-11"
                disabled={addingAgent}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addingAgent || !isFormValid}
            className="px-6 py-2.5 text-sm sm:text-base text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-11 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {addingAgent ? "Нэмж байна..." : "Agent нэмэх"}
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-2">
          Утас, нууц үг, имэйл оруулахад шинэ agent бүртгэл үүсгэнэ.
        </p>
      </div>

      {/* Идэвхтэй Agents */}
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-4 sm:mt-6">
        Идэвхтэй Agents
      </h3>
      {agents.filter(a => a.isApproved).length > 0 ? (
        <div className="space-y-3">
          {agents.filter(a => a.isApproved).map((agent) => (
            <div
              key={agent.id}
              className="border border-gray-200 rounded-xl p-4 bg-green-50"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {agent.profile?.name || agent.email}
                  </p>
                  <p className="text-sm text-gray-600">{agent.email}</p>
                  {agent.profile?.phone && (
                    <p className="text-sm text-gray-600">
                      Утас: {agent.profile.phone}
                    </p>
                  )}
                  <p className="text-xs text-green-700 mt-2 font-medium">Идэвхтэй</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditAgent(agent)}
                    className="px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-10"
                  >
                    Профайл
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`"${agent.profile?.name || agent.email}" agent-ийг цуцлах уу?`)) {
                        onApproveAgent(agent.id, false);
                      }
                    }}
                    className="px-4 py-2.5 text-sm text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors font-medium min-h-10"
                  >
                    Цуцлах
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
          Идэвхтэй agent байхгүй байна.
        </div>
      )}

      {/* Цуцлагдсан Agents */}
      {agents.filter(a => !a.isApproved).length > 0 && (
        <>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-4 sm:mt-6">
            Цуцлагдсан Agents
          </h3>
          <div className="space-y-3">
            {agents.filter(a => !a.isApproved).map((agent) => (
              <div
                key={agent.id}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {agent.profile?.name || agent.email}
                    </p>
                    <p className="text-sm text-gray-600">{agent.email}</p>
                    {agent.profile?.phone && (
                      <p className="text-sm text-gray-600">
                        Утас: {agent.profile.phone}
                      </p>
                    )}
                    <p className="text-xs text-red-600 mt-2 font-medium">Цуцлагдсан</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditAgent(agent)}
                      className="px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-10"
                    >
                      Профайл
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`"${agent.profile?.name || agent.email}" agent-ийг дахин идэвхжүүлэх үү?`)) {
                          onApproveAgent(agent.id, true);
                        }
                      }}
                      className="px-4 py-2.5 text-sm text-white bg-green-500 rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors font-medium min-h-10"
                    >
                      Идэвхжүүлэх
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
