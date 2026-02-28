"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSupportChat } from "@/hooks/useSupportChat";

/* ─── Types ─── */
type DogState = "sit" | "walk" | "sleep" | "scratch" | "stretch" | "bone" | "talk";

const PHRASES = [
  "Өдрийг сайхан өнгөрүүлээрэй!",
  "Өнөөдөр хэр байвдаа?",
  "Танд юугаар туслах вэ?",
  "Хэрэг гарвал хэлээрэй!",
  "Сайн уу!",
  "Би энд байна шүү~",
  "Захиалгатай холбоотой асуух зүйл бий юу?",
  "Ваув! Ваув!",
];

/* ─── Dog SVG Poses ─── */
function DogSit({ hovered }: { hovered: boolean }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Back body */}
      <ellipse cx="30" cy="42" rx="16" ry="11" fill="#C08B5C" />
      <ellipse cx="30" cy="43" rx="13" ry="8.5" fill="#D4A574" />
      {/* Tail */}
      <path d="M14 38 Q8 28 12 22" stroke="#C08B5C" strokeWidth="3.5" strokeLinecap="round" fill="none" className="animate-[dogTailIdle_2s_ease-in-out_infinite]" />
      {/* Back legs (sitting) */}
      <ellipse cx="20" cy="50" rx="5" ry="3.5" fill="#B07A4B" />
      <ellipse cx="40" cy="50" rx="5" ry="3.5" fill="#B07A4B" />
      {/* Front legs */}
      <rect x="25" y="46" width="4.5" height="9" rx="2.2" fill="#C08B5C" />
      <rect x="34" y="46" width="4.5" height="9" rx="2.2" fill="#B07A4B" />
      {/* Paws */}
      <ellipse cx="27.2" cy="55" rx="3" ry="1.8" fill="#8B6340" />
      <ellipse cx="36.2" cy="55" rx="3" ry="1.8" fill="#8B6340" />
      {/* Head */}
      <circle cx="40" cy="28" r="12" fill="#C08B5C" />
      <circle cx="40" cy="29" r="10" fill="#D4A574" />
      {/* Ears */}
      <ellipse cx="32" cy="18" rx="4.5" ry="7.5" fill="#8B6340" transform="rotate(-20 32 18)" />
      <ellipse cx="48" cy="18" rx="4.5" ry="7.5" fill="#8B6340" transform="rotate(20 48 18)" />
      <ellipse cx="32.5" cy="19" rx="3" ry="5" fill="#BF8B60" transform="rotate(-20 32.5 19)" />
      <ellipse cx="47.5" cy="19" rx="3" ry="5" fill="#BF8B60" transform="rotate(20 47.5 19)" />
      {/* Eyes */}
      <circle cx="36" cy="27" r="2.8" fill="#2D1B0E" />
      <circle cx="44" cy="27" r="2.8" fill="#2D1B0E" />
      <circle cx="36.8" cy="25.8" r="1.1" fill="white" />
      <circle cx="44.8" cy="25.8" r="1.1" fill="white" />
      {/* Eyebrows */}
      <path d="M33.5 23.5 Q36 22 38.5 23" stroke="#8B6340" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M41.5 23 Q44 22 46.5 23.5" stroke="#8B6340" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <ellipse cx="40" cy="31.5" rx="2.8" ry="2" fill="#2D1B0E" />
      <ellipse cx="40" cy="31" rx="1.2" ry="0.6" fill="#5C3D2E" />
      {/* Mouth */}
      <path d="M38 33 Q40 35.5 42 33" stroke="#2D1B0E" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Tongue on hover */}
      {hovered && <ellipse cx="40" cy="36" rx="2" ry="2.5" fill="#E85D75" />}
      {/* Cheeks */}
      <circle cx="33" cy="30" r="2" fill="#E8A87C" opacity="0.4" />
      <circle cx="47" cy="30" r="2" fill="#E8A87C" opacity="0.4" />
      {/* Collar */}
      <path d="M30 36 Q40 40 50 36" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="38.5" r="2" fill="#FBBF24" />
    </svg>
  );
}

function DogSleep() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Body lying down */}
      <ellipse cx="32" cy="48" rx="20" ry="8" fill="#C08B5C" />
      <ellipse cx="32" cy="49" rx="17" ry="6" fill="#D4A574" />
      {/* Tail */}
      <path d="M12 46 Q6 42 8 36" stroke="#C08B5C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Back paws */}
      <ellipse cx="14" cy="52" rx="4" ry="2.5" fill="#8B6340" />
      {/* Front paws stretched */}
      <ellipse cx="48" cy="52" rx="5" ry="2.5" fill="#8B6340" />
      <ellipse cx="42" cy="53" rx="4" ry="2" fill="#8B6340" />
      {/* Head resting */}
      <circle cx="46" cy="42" r="10" fill="#C08B5C" />
      <circle cx="46" cy="43" r="8.5" fill="#D4A574" />
      {/* Ears floppy */}
      <ellipse cx="39" cy="35" rx="4" ry="6" fill="#8B6340" transform="rotate(-30 39 35)" />
      <ellipse cx="53" cy="35" rx="4" ry="6" fill="#8B6340" transform="rotate(10 53 35)" />
      {/* Closed eyes */}
      <path d="M42 41 Q44 42.5 46 41" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M47 41 Q49 42.5 51 41" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <ellipse cx="46.5" cy="45" rx="2" ry="1.5" fill="#2D1B0E" />
      {/* Cheeks */}
      <circle cx="41" cy="44" r="1.5" fill="#E8A87C" opacity="0.4" />
      <circle cx="52" cy="44" r="1.5" fill="#E8A87C" opacity="0.4" />
      {/* Zzz */}
      <text x="52" y="30" fill="#93C5FD" fontSize="8" fontWeight="bold" className="animate-[floatUp_2s_ease-in-out_infinite]">z</text>
      <text x="56" y="24" fill="#93C5FD" fontSize="10" fontWeight="bold" className="animate-[floatUp_2s_ease-in-out_infinite_0.5s]">z</text>
      <text x="58" y="16" fill="#93C5FD" fontSize="12" fontWeight="bold" className="animate-[floatUp_2s_ease-in-out_infinite_1s]">Z</text>
    </svg>
  );
}

function DogWalk() {
  return (
    <svg width="72" height="58" viewBox="0 0 72 58" fill="none">
      {/* Body */}
      <ellipse cx="36" cy="34" rx="17" ry="11" fill="#C08B5C" />
      <ellipse cx="36" cy="35" rx="14" ry="8.5" fill="#D4A574" />
      {/* Tail */}
      <path d="M19 30 Q12 22 15 16" stroke="#C08B5C" strokeWidth="3.5" strokeLinecap="round" fill="none" className="animate-[dogTailIdle_2.5s_ease-in-out_infinite]" />
      {/* Back left leg - phase A (opposite to front left) */}
      <g className="dog-leg-a" style={{ transformBox: "fill-box" as unknown as undefined, transformOrigin: "center top" }}>
        <rect x="23" y="40" width="4.5" height="12" rx="2.2" fill="#B07A4B" />
        <ellipse cx="25.2" cy="52" rx="3" ry="1.8" fill="#8B6340" />
      </g>
      {/* Back right leg - phase B */}
      <g className="dog-leg-b" style={{ transformBox: "fill-box" as unknown as undefined, transformOrigin: "center top" }}>
        <rect x="31" y="40" width="4.5" height="12" rx="2.2" fill="#C08B5C" />
        <ellipse cx="33.2" cy="52" rx="3" ry="1.8" fill="#8B6340" />
      </g>
      {/* Front left leg - phase B (opposite to back left) */}
      <g className="dog-leg-b" style={{ transformBox: "fill-box" as unknown as undefined, transformOrigin: "center top" }}>
        <rect x="38" y="40" width="4.5" height="12" rx="2.2" fill="#B07A4B" />
        <ellipse cx="40.2" cy="52" rx="3" ry="1.8" fill="#8B6340" />
      </g>
      {/* Front right leg - phase A */}
      <g className="dog-leg-a" style={{ transformBox: "fill-box" as unknown as undefined, transformOrigin: "center top" }}>
        <rect x="46" y="40" width="4.5" height="12" rx="2.2" fill="#C08B5C" />
        <ellipse cx="48.2" cy="52" rx="3" ry="1.8" fill="#8B6340" />
      </g>
      {/* Head */}
      <circle cx="52" cy="24" r="11" fill="#C08B5C" />
      <circle cx="52" cy="25" r="9.5" fill="#D4A574" />
      {/* Ears */}
      <ellipse cx="44" cy="15" rx="4" ry="7" fill="#8B6340" transform="rotate(-15 44 15)" />
      <ellipse cx="60" cy="15" rx="4" ry="7" fill="#8B6340" transform="rotate(15 60 15)" />
      {/* Eyes */}
      <circle cx="48.5" cy="23" r="2.5" fill="#2D1B0E" />
      <circle cx="55.5" cy="23" r="2.5" fill="#2D1B0E" />
      <circle cx="49.2" cy="22" r="1" fill="white" />
      <circle cx="56.2" cy="22" r="1" fill="white" />
      {/* Nose */}
      <ellipse cx="52" cy="28" rx="2.5" ry="1.8" fill="#2D1B0E" />
      {/* Mouth */}
      <path d="M50 29.5 Q52 32 54 29.5" stroke="#2D1B0E" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Collar */}
      <path d="M43 31 Q52 35 61 31" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="52" cy="33.5" r="1.8" fill="#FBBF24" />
    </svg>
  );
}

function DogScratch({ frame }: { frame: number }) {
  const scratchY = Math.sin(frame * 0.5) * 3;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Body tilted */}
      <ellipse cx="30" cy="42" rx="16" ry="10" fill="#C08B5C" />
      <ellipse cx="30" cy="43" rx="13" ry="7.5" fill="#D4A574" />
      {/* Tail */}
      <path d="M14 38 Q8 28 12 22" stroke="#C08B5C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Back legs */}
      <ellipse cx="20" cy="50" rx="5" ry="3" fill="#B07A4B" />
      {/* Scratching back leg raised */}
      <g style={{ transform: `translateY(${scratchY}px)` }}>
        <rect x="42" y="30" width="4" height="10" rx="2" fill="#B07A4B" transform="rotate(-30 44 35)" />
        <ellipse cx="44" cy="28" rx="3" ry="2" fill="#8B6340" />
      </g>
      {/* Front leg */}
      <rect x="28" y="46" width="4.5" height="9" rx="2.2" fill="#C08B5C" />
      <ellipse cx="30.2" cy="55" rx="3" ry="1.8" fill="#8B6340" />
      {/* Head tilted */}
      <circle cx="38" cy="28" r="11" fill="#C08B5C" />
      <circle cx="38" cy="29" r="9.5" fill="#D4A574" />
      {/* Ears */}
      <ellipse cx="31" cy="19" rx="4" ry="7" fill="#8B6340" transform="rotate(-15 31 19)" />
      <ellipse cx="46" cy="18" rx="4" ry="7" fill="#8B6340" transform="rotate(25 46 18)" />
      {/* Eyes (happy squint) */}
      <path d="M34 27 Q36 28.5 38 27" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M39 27 Q41 28.5 43 27" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <ellipse cx="38.5" cy="31.5" rx="2.5" ry="1.8" fill="#2D1B0E" />
      {/* Tongue out */}
      <ellipse cx="38.5" cy="35" rx="2" ry="2.5" fill="#E85D75" />
      {/* Cheeks */}
      <circle cx="32" cy="31" r="2" fill="#E8A87C" opacity="0.5" />
      <circle cx="45" cy="31" r="2" fill="#E8A87C" opacity="0.5" />
      {/* Collar */}
      <path d="M29 35 Q38 39 47 35" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="37.5" r="1.8" fill="#FBBF24" />
      {/* Scratch lines */}
      <path d="M46 26 L48 24" stroke="#FFB347" strokeWidth="1" opacity="0.6" />
      <path d="M47 28 L49 26" stroke="#FFB347" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function DogStretch() {
  return (
    <svg width="80" height="58" viewBox="0 0 80 58" fill="none">
      {/* Body stretched */}
      <ellipse cx="40" cy="38" rx="22" ry="9" fill="#C08B5C" />
      <ellipse cx="40" cy="39" rx="19" ry="7" fill="#D4A574" />
      {/* Tail up */}
      <path d="M18 34 Q10 22 16 14" stroke="#C08B5C" strokeWidth="3.5" strokeLinecap="round" fill="none" className="animate-[dogTailIdle_2s_ease-in-out_infinite]" />
      {/* Back legs stretched back */}
      <rect x="18" y="42" width="4.5" height="11" rx="2.2" fill="#B07A4B" transform="rotate(15 18 42)" />
      <rect x="24" y="42" width="4.5" height="11" rx="2.2" fill="#C08B5C" transform="rotate(10 24 42)" />
      {/* Front legs stretched forward */}
      <rect x="54" y="40" width="4.5" height="12" rx="2.2" fill="#B07A4B" transform="rotate(-20 54 40)" />
      <rect x="60" y="40" width="4.5" height="12" rx="2.2" fill="#C08B5C" transform="rotate(-15 60 40)" />
      {/* Head low (stretching down) */}
      <circle cx="60" cy="32" r="10" fill="#C08B5C" />
      <circle cx="60" cy="33" r="8.5" fill="#D4A574" />
      {/* Ears floppy */}
      <ellipse cx="53" cy="25" rx="3.5" ry="6" fill="#8B6340" transform="rotate(-20 53 25)" />
      <ellipse cx="67" cy="25" rx="3.5" ry="6" fill="#8B6340" transform="rotate(20 67 25)" />
      {/* Eyes (happy) */}
      <path d="M56 31 Q58 32.5 60 31" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M61 31 Q63 32.5 65 31" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <ellipse cx="60.5" cy="35" rx="2.2" ry="1.6" fill="#2D1B0E" />
      {/* Butt up indicator */}
      <path d="M22 30 L24 28 L26 30" stroke="#D4A574" strokeWidth="1" opacity="0.5" />
      {/* Collar */}
      <path d="M52 39 Q60 42 68 39" stroke="#3B82F6" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function DogBone() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Body */}
      <ellipse cx="28" cy="42" rx="16" ry="10" fill="#C08B5C" />
      <ellipse cx="28" cy="43" rx="13" ry="7.5" fill="#D4A574" />
      {/* Tail wagging */}
      <path d="M12 38 Q6 28 10 22" stroke="#C08B5C" strokeWidth="3.5" strokeLinecap="round" fill="none" className="animate-[dogTailWag_0.6s_ease-in-out_infinite]" />
      {/* Legs */}
      <rect x="22" y="46" width="4" height="9" rx="2" fill="#C08B5C" />
      <rect x="30" y="46" width="4" height="9" rx="2" fill="#B07A4B" />
      <ellipse cx="24" cy="55" rx="2.8" ry="1.6" fill="#8B6340" />
      <ellipse cx="32" cy="55" rx="2.8" ry="1.6" fill="#8B6340" />
      <ellipse cx="18" cy="50" rx="4.5" ry="3" fill="#B07A4B" />
      {/* Head - lower, near bone */}
      <circle cx="42" cy="34" r="10" fill="#C08B5C" />
      <circle cx="42" cy="35" r="8.5" fill="#D4A574" />
      {/* Ears */}
      <ellipse cx="35" cy="26" rx="3.5" ry="6" fill="#8B6340" transform="rotate(-15 35 26)" />
      <ellipse cx="49" cy="26" rx="3.5" ry="6" fill="#8B6340" transform="rotate(15 49 26)" />
      {/* Eyes (happy) */}
      <path d="M38 33 Q40 34.5 42 33" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M43 33 Q45 34.5 47 33" stroke="#2D1B0E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Nose */}
      <ellipse cx="42.5" cy="37" rx="2.2" ry="1.6" fill="#2D1B0E" />
      {/* Bone */}
      <g className="animate-[wiggle_0.5s_ease-in-out_infinite]">
        <rect x="38" y="43" width="14" height="3.5" rx="1.5" fill="#F5E6D3" />
        <circle cx="38" cy="42.5" r="2.5" fill="#F5E6D3" />
        <circle cx="38" cy="47" r="2.5" fill="#F5E6D3" />
        <circle cx="52" cy="42.5" r="2.5" fill="#F5E6D3" />
        <circle cx="52" cy="47" r="2.5" fill="#F5E6D3" />
      </g>
      {/* Cheeks */}
      <circle cx="36" cy="36" r="1.8" fill="#E8A87C" opacity="0.5" />
      <circle cx="49" cy="36" r="1.8" fill="#E8A87C" opacity="0.5" />
      {/* Collar */}
      <path d="M34 41 Q42 44 50 41" stroke="#3B82F6" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Dog Mascot Component ─── */
function DogMascot({ onClick }: { onClick: () => void }) {
  const [state, setState] = useState<DogState>("sit");
  const [phrase, setPhrase] = useState("");
  const [showPhrase, setShowPhrase] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [posX, setPosX] = useState(0);
  const [facing, setFacing] = useState<"right" | "left">("left");
  const [frame, setFrame] = useState(0);

  // Walk range: bottom-right ~30% of screen
  const getWalkBounds = useCallback(() => {
    if (typeof window === "undefined") return { minX: -120, maxX: 20 };
    const w = window.innerWidth;
    const rangeX = Math.min(w * 0.3, 400);
    return { minX: -rangeX, maxX: 20 };
  }, []);

  // Animation frame counter
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), 50);
    return () => clearInterval(id);
  }, []);

  // Random behavior cycle — calm, relaxing vibe
  const pickNext = useCallback(() => {
    const states: DogState[] = ["sit", "sit", "sit", "sleep", "sleep", "sleep", "walk", "scratch", "stretch", "bone", "talk"];
    const next = states[Math.floor(Math.random() * states.length)];
    setState(next);

    if (next === "talk") {
      setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
      setShowPhrase(true);
    } else if (next === "walk") {
      setFacing(Math.random() > 0.5 ? "right" : "left");
    }
  }, []);

  useEffect(() => {
    const durations: Record<DogState, number> = {
      sit: 5000 + Math.random() * 6000,
      walk: 3000 + Math.random() * 2500,
      sleep: 10000 + Math.random() * 10000,
      scratch: 2500 + Math.random() * 1500,
      stretch: 2500 + Math.random() * 1500,
      bone: 4000 + Math.random() * 3000,
      talk: 3500 + Math.random() * 1500,
    };

    const timeout = setTimeout(() => {
      setShowPhrase(false);
      pickNext();
    }, durations[state]);

    return () => clearTimeout(timeout);
  }, [state, pickNext]);

  // Walk movement — roam freely in bottom-right 30%, X only
  useEffect(() => {
    if (state !== "walk") return;
    const bounds = getWalkBounds();

    const interval = setInterval(() => {
      setPosX((prev) => {
        const speed = 0.8 + Math.random() * 0.3;
        const next = facing === "left" ? prev - speed : prev + speed;
        if (next < bounds.minX) { setFacing("right"); return prev + speed; }
        if (next > bounds.maxX) { setFacing("left"); return prev - speed; }
        return next;
      });
    }, 35);
    return () => clearInterval(interval);
  }, [state, facing, getWalkBounds]);

  // Slowly drift back to home position when not walking
  useEffect(() => {
    if (state === "walk") return;
    const interval = setInterval(() => {
      setPosX((prev) => {
        if (Math.abs(prev) < 1) return 0;
        return prev * 0.95;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [state]);

  // Show random phrase occasionally even when sitting
  useEffect(() => {
    if (state !== "sit") return;
    const delay = 10000 + Math.random() * 15000;
    const timeout = setTimeout(() => {
      if (state === "sit") {
        setPhrase(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
        setShowPhrase(true);
        setTimeout(() => setShowPhrase(false), 3500);
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [state]);

  const renderDog = () => {
    switch (state) {
      case "sleep": return <DogSleep />;
      case "walk": return <DogWalk />;
      case "scratch": return <DogScratch frame={frame} />;
      case "stretch": return <DogStretch />;
      case "bone": return <DogBone />;
      case "talk": return <DogSit hovered={true} />;
      default: return <DogSit hovered={hovered} />;
    }
  };

  return (
    <div
      className="fixed z-40 bottom-3 right-4 sm:right-6 cursor-pointer select-none scale-[0.8] sm:scale-100 origin-bottom-right"
      style={{
        transform: `translateX(${posX}px)`,
        transition: state === "walk" ? "none" : "transform 0.5s ease-out",
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Speech bubble */}
      {(showPhrase || hovered) && (
        <div className="absolute -top-11 right-0 bg-white rounded-xl px-3 py-1.5 shadow-lg border border-gray-200 whitespace-nowrap animate-[fadeInDown_0.3s_ease] pointer-events-none">
          <p className="text-[11px] text-gray-700 font-medium">
            {hovered && !showPhrase ? "Дарна уу!" : phrase || "Сайн уу!"}
          </p>
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45" />
        </div>
      )}

      {/* Dog container */}
      <div className={`transition-transform duration-300 ${
        state === "walk" && facing === "left" ? "scale-x-[-1]" : ""
      } ${hovered ? "scale-110" : ""}`}>
        {renderDog()}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    error,
    status,
    sendMessage,
    requestHumanSupport,
    clearChat,
  } = useSupportChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
  };

  return (
    <>
      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes dogTailIdle {
          0%, 100% { transform: rotate(-4deg); transform-origin: bottom; }
          50% { transform: rotate(4deg); transform-origin: bottom; }
        }
        @keyframes dogTailWag {
          0%, 100% { transform: rotate(-12deg); transform-origin: bottom; }
          50% { transform: rotate(12deg); transform-origin: bottom; }
        }
        @keyframes floatUp {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .dog-leg-a {
          animation: dogLegA 0.6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center top;
        }
        .dog-leg-b {
          animation: dogLegB 0.6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center top;
        }
        @keyframes dogLegA {
          0%, 100% { transform: rotate(-14deg); }
          50% { transform: rotate(14deg); }
        }
        @keyframes dogLegB {
          0%, 100% { transform: rotate(14deg); }
          50% { transform: rotate(-14deg); }
        }
      `}</style>

      {/* Dog mascot in bottom-right */}
      {!isOpen && <DogMascot onClick={() => setIsOpen(true)} />}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:right-4 sm:bottom-4 z-50 sm:w-[380px] sm:h-[500px] sm:rounded-2xl flex flex-col bg-white sm:shadow-2xl sm:border sm:border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
                🐶
              </div>
              <div>
                <h3 className="text-sm font-semibold">Тусламж</h3>
                <p className="text-[11px] text-blue-200">
                  {status === "waiting_human" ? "Ажилтан хүлээж байна..." : "AI туслах"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={clearChat} className="p-2 rounded-lg hover:bg-white/20 transition-colors" title="Цэвэрлэх">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="text-5xl mb-3">🐶</div>
                <p className="text-sm font-medium text-gray-600">Сайн байна уу!</p>
                <p className="text-[13px] text-gray-400 mt-0.5">Танд юугаар туслах вэ?</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {msg.role !== "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm mt-0.5">
                    {msg.role === "admin" ? "👨‍💼" : "🐶"}
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : msg.role === "admin"
                    ? "bg-emerald-500 text-white rounded-bl-sm"
                    : "bg-white text-gray-900 rounded-bl-sm border border-gray-100 shadow-sm"
                }`}>
                  {msg.role === "admin" && (
                    <p className="text-[10px] font-medium text-emerald-200 mb-0.5">Ажилтан</p>
                  )}
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm mt-0.5">
                  🐶
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-100 shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-[13px] p-3 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Human Support */}
          {status === "active" && messages.length > 2 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 shrink-0">
              <button onClick={requestHumanSupport} disabled={isLoading}
                className="w-full text-[13px] text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1.5 py-0.5 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Хүнтэй ярих
              </button>
            </div>
          )}

          {status === "waiting_human" && (
            <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 text-center shrink-0">
              <p className="text-[13px] text-yellow-700">Манай ажилтан удахгүй холбогдоно...</p>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-3 sm:px-4 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Мессеж бичих..."
              disabled={isLoading}
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-[13px] sm:text-sm text-gray-900 bg-gray-50 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white disabled:bg-gray-100 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed shrink-0"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
