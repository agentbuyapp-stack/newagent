"use client";

import { useState } from "react";
import { type User } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

interface AgentRankingManagerProps {
  agents: User[];
  onUpdate: (agents: User[]) => void;
}

export default function AgentRankingManager({
  agents,
  onUpdate,
}: AgentRankingManagerProps) {
  const apiClient = useApiClient();
  const [saving, setSaving] = useState(false);
  const [draggedAgent, setDraggedAgent] = useState<User | null>(null);

  // Sort agents by rank (top agents first)
  const sortedAgents = [...agents].sort((a, b) => {
    const aIsTop = (a as any).agentProfile?.isTopAgent || false;
    const bIsTop = (b as any).agentProfile?.isTopAgent || false;
    const aRank = (a as any).agentProfile?.rank || 999;
    const bRank = (b as any).agentProfile?.rank || 999;

    if (aIsTop && !bIsTop) return -1;
    if (!aIsTop && bIsTop) return 1;
    return aRank - bRank;
  });

  const topAgents = sortedAgents.filter((a) => (a as any).agentProfile?.isTopAgent);
  const otherAgents = sortedAgents.filter((a) => !(a as any).agentProfile?.isTopAgent);

  const handleToggleTop = async (agent: User) => {
    const isCurrentlyTop = (agent as any).agentProfile?.isTopAgent || false;

    if (!isCurrentlyTop && topAgents.length >= 10) {
      alert("Топ 10-д зөвхөн 10 агент байх боломжтой");
      return;
    }

    setSaving(true);
    try {
      await apiClient.toggleAgentTop(agent.id, !isCurrentlyTop);

      // Update local state
      const updatedAgents = agents.map((a) => {
        if (a.id === agent.id) {
          return {
            ...a,
            agentProfile: {
              ...(a as any).agentProfile,
              isTopAgent: !isCurrentlyTop,
              rank: !isCurrentlyTop ? topAgents.length + 1 : 999,
            },
          };
        }
        return a;
      });

      onUpdate(updatedAgents as User[]);
    } catch (err) {
      console.error("Error toggling top:", err);
      alert("Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (agent: User) => {
    setDraggedAgent(agent);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetAgent: User) => {
    if (!draggedAgent || draggedAgent.id === targetAgent.id) {
      setDraggedAgent(null);
      return;
    }

    const draggedRank = (draggedAgent as any).agentProfile?.rank || 999;
    const targetRank = (targetAgent as any).agentProfile?.rank || 999;

    // Reorder in local state
    const newTopAgents = [...topAgents];
    const draggedIndex = newTopAgents.findIndex((a) => a.id === draggedAgent.id);
    const targetIndex = newTopAgents.findIndex((a) => a.id === targetAgent.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newTopAgents.splice(draggedIndex, 1);
      newTopAgents.splice(targetIndex, 0, draggedAgent);

      // Update ranks
      const agentIds = newTopAgents.map((a) => a.id);

      setSaving(true);
      try {
        await apiClient.reorderAgents(agentIds);

        // Update local state with new ranks
        const updatedAgents = agents.map((a) => {
          const newRankIndex = agentIds.indexOf(a.id);
          if (newRankIndex !== -1) {
            return {
              ...a,
              agentProfile: {
                ...(a as any).agentProfile,
                rank: newRankIndex + 1,
              },
            };
          }
          return a;
        });

        onUpdate(updatedAgents as User[]);
      } catch (err) {
        console.error("Error reordering:", err);
        alert("Эрэмбэ өөрчлөхөд алдаа гарлаа");
      } finally {
        setSaving(false);
      }
    }

    setDraggedAgent(null);
  };

  const getAgentName = (agent: User) => {
    return (agent as any).agentProfile?.displayName || agent.profile?.name || agent.email.split("@")[0];
  };

  const getAgentStats = (agent: User) => {
    const profile = (agent as any).agentProfile;
    return {
      transactions: profile?.totalTransactions || 0,
      successRate: profile?.successRate || 0,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top 10 Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Топ 10 агент
          </h3>
          <span className="text-sm text-gray-500">
            {topAgents.length}/10 сонгосон
          </span>
        </div>

        {topAgents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Топ агент сонгоогүй байна. Доорх жагсаалтаас агентуудыг нэмнэ үү.
          </p>
        ) : (
          <div className="space-y-2">
            {topAgents.map((agent, index) => {
              const stats = getAgentStats(agent);
              return (
                <div
                  key={agent.id}
                  draggable
                  onDragStart={() => handleDragStart(agent)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(agent)}
                  className={`flex items-center gap-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg cursor-move hover:shadow-md transition-shadow ${
                    draggedAgent?.id === agent.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>

                  {(agent as any).agentProfile?.avatarUrl ? (
                    <img
                      src={(agent as any).agentProfile.avatarUrl}
                      alt={getAgentName(agent)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {getAgentName(agent)[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {getAgentName(agent)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.transactions} гүйлгээ | {stats.successRate}% амжилт
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleTop(agent)}
                    disabled={saving}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    title="Топ 10-оос хасах"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          Дээрх агентуудыг чирж байршлыг нь өөрчилж болно
        </p>
      </div>

      {/* Other Agents Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Бусад агентууд
        </h3>

        {otherAgents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Бүх агентууд Топ 10-д байна
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {otherAgents.map((agent) => {
              const stats = getAgentStats(agent);
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {(agent as any).agentProfile?.avatarUrl ? (
                    <img
                      src={(agent as any).agentProfile.avatarUrl}
                      alt={getAgentName(agent)}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {getAgentName(agent)[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {getAgentName(agent)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.transactions} гүйлгээ | {stats.successRate}% амжилт
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleTop(agent)}
                    disabled={saving || topAgents.length >= 10}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title={topAgents.length >= 10 ? "Топ 10 дүүрсэн" : "Топ 10-д нэмэх"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
