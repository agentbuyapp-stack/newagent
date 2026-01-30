"use client";

import React, { useState, useRef, useEffect } from "react";
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

  // Styling
  theme: "dark" | "light";
}

// Compact audio player for card
function CardAudioPlayer({
  audioUrl,
  duration,
  theme,
}: {
  audioUrl: string;
  duration?: number;
  theme: "dark" | "light";
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      <button
        onClick={togglePlay}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
          isDark
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
      {isPlaying && (
        <div className="flex items-center gap-2">
          <div
            className={`w-16 h-1 rounded-full overflow-hidden ${
              isDark ? "bg-gray-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`h-full transition-all ${
                isDark ? "bg-blue-400" : "bg-purple-500"
              }`}
              style={{ width: `${progress}%` }}
            />
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
  theme,
}) => {
  const isDark = theme === "dark";

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
