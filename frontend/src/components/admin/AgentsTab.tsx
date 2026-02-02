"use client";

import { useState } from "react";
import type { User } from "@/lib/api";

interface AgentsTabProps {
  agents: User[];
  addingAgent: boolean;
  onAddAgent: (email: string) => Promise<boolean>;
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
  const [newAgentEmail, setNewAgentEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onAddAgent(newAgentEmail);
    if (success) {
      setNewAgentEmail("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Add New Agent Form */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Шинэ Agent нэмэх
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={newAgentEmail}
            onChange={(e) => setNewAgentEmail(e.target.value)}
            placeholder="Agent email оруулах (жишээ: agent@example.com)"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-11"
            disabled={addingAgent}
          />
          <button
            type="submit"
            disabled={addingAgent || !newAgentEmail.trim()}
            className="px-6 py-2.5 text-sm sm:text-base text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-11 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {addingAgent ? "Нэмж байна..." : "Agent нэмэх"}
          </button>
        </form>
        <p className="text-xs text-gray-600 mt-2">
          Email оруулахад тухайн email-д agent эрх өгөгдөнө. Хэрэв user байхгүй
          бол шинээр үүсгэнэ.
        </p>
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-4 sm:mt-6">
        Батлагдсан Agents
      </h3>
      {agents.length > 0 ? (
        <div className="space-y-3">
          {agents.map((agent) => (
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
                  <p className="text-sm text-gray-600 capitalize">
                    Эрх:{" "}
                    {agent.role === "agent" && agent.isApproved
                      ? `${agent.role}`
                      : agent.role === "user" && agent.isApproved
                        ? `${agent.role}`
                        : agent.role}
                  </p>
                  {agent.profile?.phone && (
                    <p className="text-sm text-gray-600">
                      Утас: {agent.profile.phone}
                    </p>
                  )}
                  <p className="text-xs text-green-800 mt-2">Батлагдсан</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditAgent(agent)}
                    className="px-4 py-2.5 text-sm text-white bg-blue-500 rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium min-h-10"
                  >
                    Профайл
                  </button>
                  <button
                    onClick={() => onApproveAgent(agent.id, false)}
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
          Батлагдсан agent байхгүй байна.
        </div>
      )}
    </div>
  );
}
