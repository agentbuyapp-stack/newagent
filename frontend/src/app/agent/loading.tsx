export default function AgentLoading() {
  return (
    <div className="fixed inset-0 bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] flex items-center justify-center z-50 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-cyan-400/25 rounded-full blur-3xl animate-blob" />
      <div className="absolute -top-20 right-10 w-72 h-72 bg-blue-400/25 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute bottom-10 right-20 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl animate-blob animation-delay-4000" />

      <div className="flex flex-col items-center gap-8 z-10">
        {/* Agent icon with animated rings */}
        <div className="relative animate-fade-in">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 w-28 h-28 rounded-full border-4 border-[#00d4ff]/20 animate-ping" style={{ animationDuration: '2s' }} />

          {/* Middle rotating ring */}
          <svg className="absolute -inset-2 w-32 h-32 animate-spin-slow" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="agentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a90e2" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#agentGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="60 200"
            />
          </svg>

          {/* Icon container */}
          <div className="relative w-28 h-28 rounded-full bg-linear-to-br from-[#4a90e2] to-[#00d4ff] flex items-center justify-center shadow-2xl shadow-cyan-500/40">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-[#4a90e2] to-[#00d4ff]">
            Агент
          </h2>

          <div className="flex items-center gap-3 text-gray-600 font-medium">
            <span>Ачааллаж байна</span>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#4a90e2] rounded-full animate-bounce-dot" />
              <span className="w-2.5 h-2.5 bg-[#00d4ff] rounded-full animate-bounce-dot animation-delay-150" />
              <span className="w-2.5 h-2.5 bg-[#0b4ce5] rounded-full animate-bounce-dot animation-delay-300" />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden animate-fade-in-up animation-delay-500">
          <div className="h-full bg-linear-to-r from-[#4a90e2] to-[#00d4ff] rounded-full animate-progress-bar" />
        </div>
      </div>
    </div>
  );
}
