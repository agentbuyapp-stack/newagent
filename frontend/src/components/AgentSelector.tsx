"use client";

import { useState, useEffect, useRef } from "react";
import { type PublicAgent } from "@/lib/api";
import { useApiClient } from "@/lib/useApiClient";

interface AgentSelectorProps {
  value?: string;
  onChange: (agentId: string) => void;
  className?: string;
}

export default function AgentSelector({
  value,
  onChange,
  className = "",
}: AgentSelectorProps) {
  const apiClient = useApiClient();
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find((a) => a.id === value);

  useEffect(() => {
    loadAgents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadAgents = async () => {
    try {
      const data = await apiClient.getTopAgents();
      setAgents(data);
    } catch (err) {
      console.error("Error loading agents:", err);
      // Fallback to public agents
      try {
        const data = await apiClient.getPublicAgents();
        setAgents(data.slice(0, 10));
      } catch {
        console.error("Error loading public agents");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      agent.specialties?.some((s) => s.toLowerCase().includes(searchLower))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Онлайн";
      case "busy":
        return "Завгүй";
      default:
        return "Офлайн";
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfGradient">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            <path fill="url(#halfGradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      }
    }

    return <div className="flex">{stars}</div>;
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-12 ${className}`}></div>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Display / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        {selectedAgent ? (
          <div className="flex items-center gap-3">
            {selectedAgent.avatarUrl ? (
              <img
                src={selectedAgent.avatarUrl}
                alt={selectedAgent.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {selectedAgent.name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-left">
              <p className="font-medium text-gray-900">{selectedAgent.name}</p>
              <p className="text-xs text-gray-500">
                {selectedAgent.totalTransactions} гүйлгээ
              </p>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Агент сонгох...</span>
        )}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Агент хайх..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Agent List */}
          <div className="overflow-y-auto max-h-80">
            {filteredAgents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Агент олдсонгүй
              </div>
            ) : (
              filteredAgents.map((agent, index) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    onChange(agent.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full p-4 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 ${
                    value === agent.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Rank Badge */}
                    {agent.isTopAgent && (
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full text-xs font-bold">
                        {agent.rank}
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {agent.avatarUrl ? (
                        <img
                          src={agent.avatarUrl}
                          alt={agent.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {agent.name[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Online Status */}
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusColor(
                          agent.availabilityStatus
                        )}`}
                        title={getStatusText(agent.availabilityStatus)}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {agent.name}
                        </h4>
                        {agent.featured && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                            Онцлох
                          </span>
                        )}
                      </div>

                      {/* Rating & Stats */}
                      <div className="flex items-center gap-3 mt-1">
                        {agent.avgRating > 0 && (
                          <div className="flex items-center gap-1">
                            {renderStars(agent.avgRating)}
                            <span className="text-xs text-gray-500">
                              ({agent.reviewCount})
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500">
                          {agent.successRate}% амжилт
                        </span>
                      </div>

                      {/* Bio */}
                      {agent.bio && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {agent.bio}
                        </p>
                      )}

                      {/* Specialties */}
                      {agent.specialties && agent.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.specialties.slice(0, 3).map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                          {agent.specialties.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{agent.specialties.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{agent.totalTransactions} гүйлгээ</span>
                        {agent.experienceYears && agent.experienceYears > 0 && (
                          <span>{agent.experienceYears} жил туршлага</span>
                        )}
                        {agent.responseTime && (
                          <span>Хариу: {agent.responseTime}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
