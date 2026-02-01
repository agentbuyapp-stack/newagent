"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { RecordingState } from "@/hooks/useVoiceRecording";

export interface LatestVoiceMessage {
  audioUrl: string;
  audioDuration?: number;
  senderId: string;
  createdAt: string;
}

interface OrderCardVoiceProps {
  // Recording props
  isRecording: boolean;
  recordingState: RecordingState;
  recordingDuration: number;
  waveformData: number[];
  maxDuration?: number;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  formatTime: (seconds: number) => string;

  // Playback props
  latestVoiceMessage?: LatestVoiceMessage | null;
  // Current user ID to check if the message is from the other party
  currentUserId?: string;

  // Styling
  theme: "dark" | "light";
}

// Helper to get/set listened messages in localStorage
const LISTENED_KEY = "listenedVoiceMessages";
function getListenedMessages(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(LISTENED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}
function markAsListened(audioUrl: string) {
  if (typeof window === "undefined") return;
  try {
    const listened = getListenedMessages();
    listened.add(audioUrl);
    // Keep only last 500 entries to prevent localStorage bloat
    const arr = Array.from(listened).slice(-500);
    localStorage.setItem(LISTENED_KEY, JSON.stringify(arr));
  } catch {
    // Ignore storage errors
  }
}

// Compact audio player for card with pulse animation for new messages
function CardAudioPlayer({
  audioUrl,
  duration,
  theme,
  isNew,
  onPlayed,
}: {
  audioUrl: string;
  duration?: number;
  theme: "dark" | "light";
  isNew?: boolean;
  onPlayed?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Check if this message should show as new (not played yet)
  const showAsNew = isNew && !hasPlayed && !isPlaying;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (!duration && audio.duration && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [duration]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      // Mark as played
      if (!hasPlayed) {
        setHasPlayed(true);
        onPlayed?.();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="relative">
        {/* Pulse ring animation for new messages */}
        {showAsNew && (
          <>
            <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-50" />
            <div className="absolute -inset-1 rounded-full bg-amber-400/30 animate-pulse" />
          </>
        )}
        <button
          onClick={togglePlay}
          className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all ${
            showAsNew
              ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/50"
              : isDark
                ? "bg-blue-500 hover:bg-blue-400 text-white"
                : "bg-purple-500 hover:bg-purple-400 text-white"
          }`}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
      {isPlaying && (
        <div className="flex items-center gap-2">
          {/* Waveform bars animation */}
          <div className="flex items-center gap-0.5 h-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`w-0.5 rounded-full ${isDark ? "bg-blue-400" : "bg-purple-500"}`}
                style={{
                  height: `${Math.random() * 12 + 4}px`,
                  animation: `waveform 0.5s ease-in-out ${i * 0.05}s infinite alternate`,
                }}
              />
            ))}
          </div>
          <span
            className={`text-xs ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {formatTime(currentTime)}
          </span>
        </div>
      )}
      <style jsx>{`
        @keyframes waveform {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
    </div>
  );
}

export const OrderCardVoice: React.FC<OrderCardVoiceProps> = ({
  isRecording,
  recordingState,
  recordingDuration,
  waveformData,
  maxDuration = 60,
  onStopRecording,
  onCancelRecording,
  formatTime,
  latestVoiceMessage,
  currentUserId,
  theme,
}) => {
  const isDark = theme === "dark";
  const [listenedMessages, setListenedMessages] = useState<Set<string>>(new Set());

  // Load listened messages from localStorage on mount
  useEffect(() => {
    setListenedMessages(getListenedMessages());
  }, []);

  // Check if the latest voice message is new (from other party and not listened)
  const isNewVoiceMessage = useCallback(() => {
    if (!latestVoiceMessage || !currentUserId) return false;
    // Message is new if it's from the other party (not from current user) and not listened
    const isFromOther = latestVoiceMessage.senderId !== currentUserId;
    const isListened = listenedMessages.has(latestVoiceMessage.audioUrl);
    return isFromOther && !isListened;
  }, [latestVoiceMessage, currentUserId, listenedMessages]);

  const handleVoicePlayed = useCallback(() => {
    if (latestVoiceMessage) {
      markAsListened(latestVoiceMessage.audioUrl);
      setListenedMessages(prev => new Set([...prev, latestVoiceMessage.audioUrl]));
    }
  }, [latestVoiceMessage]);

  // Recording overlay UI
  if (isRecording || recordingState === "recording" || recordingState === "uploading") {
    return (
      <div
        className={`absolute inset-0 z-20 rounded-lg flex flex-col items-center justify-center ${
          isDark
            ? "bg-gray-900/95 backdrop-blur-sm"
            : "bg-white/95 backdrop-blur-sm"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {recordingState === "uploading" ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${
                isDark ? "border-blue-400" : "border-purple-500"
              }`}
            />
            <span
              className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Илгээж байна...
            </span>
          </div>
        ) : (
          <>
            {/* Recording indicator and time */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span
                className={`text-lg font-mono ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                {formatTime(recordingDuration)} / {formatTime(maxDuration)}
              </span>
            </div>

            {/* Waveform visualization */}
            <div className="flex items-center justify-center gap-0.5 h-12 mb-4">
              {waveformData.length > 0
                ? waveformData.map((value, index) => (
                    <div
                      key={index}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        isDark ? "bg-blue-400" : "bg-purple-500"
                      }`}
                      style={{
                        height: `${Math.max(4, value * 48)}px`,
                      }}
                    />
                  ))
                : // Default bars when no data
                  Array.from({ length: 20 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1 rounded-full ${
                        isDark ? "bg-blue-400/30" : "bg-purple-500/30"
                      }`}
                    />
                  ))}
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelRecording();
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-600"
                }`}
                title="Цуцлах"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStopRecording();
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "bg-blue-500 hover:bg-blue-400 text-white"
                    : "bg-purple-500 hover:bg-purple-400 text-white"
                }`}
                title="Илгээх"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Play button for latest voice message (shown when not recording)
  if (latestVoiceMessage) {
    return (
      <CardAudioPlayer
        audioUrl={latestVoiceMessage.audioUrl}
        duration={latestVoiceMessage.audioDuration}
        theme={theme}
        isNew={isNewVoiceMessage()}
        onPlayed={handleVoicePlayed}
      />
    );
  }

  return null;
};

// Long press progress indicator component
export const LongPressIndicator: React.FC<{
  progress: number;
  isPressed: boolean;
  theme: "dark" | "light";
}> = ({ progress, isPressed, theme }) => {
  if (!isPressed || progress === 0) return null;

  const isDark = theme === "dark";

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Border progress indicator */}
      <div
        className={`absolute inset-0 rounded-lg transition-opacity ${
          isDark ? "ring-2 ring-blue-400" : "ring-2 ring-purple-500"
        }`}
        style={{ opacity: progress / 100 }}
      />
      {/* Pulse effect */}
      <div
        className={`absolute inset-0 rounded-lg animate-pulse ${
          isDark ? "bg-blue-400/10" : "bg-purple-500/10"
        }`}
      />
    </div>
  );
};

// New voice message glow overlay for cards
export const NewVoiceGlow: React.FC<{
  hasNewVoice: boolean;
  theme: "dark" | "light";
}> = ({ hasNewVoice, theme }) => {
  if (!hasNewVoice) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-5 rounded-2xl overflow-hidden">
      {/* Subtle animated border glow */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/60 animate-pulse" />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-amber-400/5 animate-pulse"
        style={{ animationDuration: '2s' }}
      />
    </div>
  );
};

// Helper hook to check if a voice message is new
export function useIsNewVoiceMessage(
  latestVoiceMessage: LatestVoiceMessage | null | undefined,
  currentUserId: string | undefined
): boolean {
  const [listenedMessages, setListenedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    setListenedMessages(getListenedMessages());
  }, []);

  if (!latestVoiceMessage || !currentUserId) return false;
  const isFromOther = latestVoiceMessage.senderId !== currentUserId;
  const isListened = listenedMessages.has(latestVoiceMessage.audioUrl);
  return isFromOther && !isListened;
}
