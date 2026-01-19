export default function Loading() {
  return (
    <div className="fixed inset-0 bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background gradient blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-blob" />
      <div className="absolute -top-40 right-20 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 right-40 w-80 h-80 bg-indigo-400/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
      <div className="absolute bottom-0 left-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-3000" />

      <div className="flex flex-col items-center gap-10 z-10">
        {/* Logo with glow effect */}
        <div className="relative animate-fade-in">
          {/* Glow behind text */}
          <div className="absolute inset-0 blur-2xl bg-linear-to-r from-[#0b4ce5]/40 via-[#4a90e2]/40 to-[#00d4ff]/40 scale-150" />

          <h1
            className="relative text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-linear-to-r from-[#0b4ce5] via-[#4a90e2] to-[#00d4ff] tracking-tight"
            style={{
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease infinite',
              textShadow: '0 0 80px rgba(11, 76, 229, 0.5)',
            }}
          >
            AgentBuy
          </h1>
        </div>

        {/* Animated loading ring */}
        <div className="relative w-24 h-24 animate-fade-in-up">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-100" />

          {/* Spinning gradient ring */}
          <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0b4ce5" />
                <stop offset="50%" stopColor="#4a90e2" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="70 200"
            />
          </svg>

          {/* Inner spinning ring (reverse) */}
          <svg className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] animate-spin-reverse" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#00d4ff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="40 200"
              opacity="0.6"
            />
          </svg>

          {/* Center pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-linear-to-r from-[#0b4ce5] to-[#00d4ff] animate-pulse-scale" />
          </div>
        </div>

        {/* Loading text with typing effect */}
        <div className="flex flex-col items-center gap-3 animate-fade-in-up animation-delay-500">
          <p className="text-gray-700 font-semibold text-xl tracking-wide">
            Түр хүлээнэ үү
          </p>

          {/* Animated dots */}
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0b4ce5] animate-bounce-dot" />
            <span className="w-3 h-3 rounded-full bg-[#4a90e2] animate-bounce-dot animation-delay-150" />
            <span className="w-3 h-3 rounded-full bg-[#00d4ff] animate-bounce-dot animation-delay-300" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden animate-fade-in-up animation-delay-700">
          <div className="h-full bg-linear-to-r from-[#0b4ce5] via-[#4a90e2] to-[#00d4ff] rounded-full animate-progress-bar" />
        </div>
      </div>
    </div>
  );
}
