"use client";

import { useState, useEffect } from "react";

interface DashboardLoadingProps {
  title: string;
  gradientId: string;
  primaryColor: string;
  secondaryColor: string;
  icon: React.ReactNode;
}

export function DashboardLoading({
  title,
  gradientId,
  primaryColor,
  secondaryColor,
  icon,
}: DashboardLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Холбогдож байна");

  // Simulate smooth loading progress
  useEffect(() => {
    const textStages = [
      { at: 10, text: "Холбогдож байна" },
      { at: 30, text: "Мэдээлэл татаж байна" },
      { at: 50, text: "Захиалгууд уншиж байна" },
      { at: 70, text: "Бараа мэдээлэл татаж байна" },
      { at: 85, text: "Бэлтгэж байна" },
      { at: 95, text: "Бараг боллоо" },
    ];

    let currentProgress = 0;
    let targetProgress = 100;

    const interval = setInterval(() => {
      if (currentProgress < targetProgress) {
        // Smooth increment - smaller steps
        const increment = Math.max(1, Math.floor((targetProgress - currentProgress) / 20));
        currentProgress = Math.min(currentProgress + increment, targetProgress);
        setProgress(currentProgress);

        // Update text based on progress
        const stage = textStages.find(s => currentProgress >= s.at && currentProgress < (textStages[textStages.indexOf(s) + 1]?.at || 101));
        if (stage) {
          setLoadingText(stage.text);
        }
      }
    }, 50); // Faster interval for smoother animation

    return () => clearInterval(interval);
  }, []);

  // Circle progress calculation
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center z-50 overflow-hidden">
      {/* Background blobs */}
      <div
        className="absolute top-0 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-30"
        style={{ backgroundColor: primaryColor }}
      />
      <div
        className="absolute -bottom-20 right-10 w-80 h-80 rounded-full blur-3xl animate-pulse opacity-20"
        style={{ backgroundColor: secondaryColor, animationDelay: "1s" }}
      />

      <div className="flex flex-col items-center gap-6 z-10">
        {/* Circular progress with icon */}
        <div className="relative">
          {/* Progress circle */}
          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={primaryColor} />
                <stop offset="100%" stopColor={secondaryColor} />
              </linearGradient>
            </defs>
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200 dark:text-slate-700"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Icon in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 10px 40px -10px ${primaryColor}80`,
              }}
            >
              {icon}
            </div>
          </div>
        </div>

        {/* Percentage */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-4xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
          >
            {progress}%
          </span>
          <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">
            {loadingText}
          </span>
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold text-transparent bg-clip-text mt-2"
          style={{
            backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          {title}
        </h2>

        {/* Progress bar */}
        <div className="w-56 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
