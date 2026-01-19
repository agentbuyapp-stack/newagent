export const HomePageHeroText = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-3 sm:gap-4">
      <p
        className="w-[650px] h-[150px] text-transparent bg-clip-text bg-linear-to-r from-[#0b4ce5] via-[#4a90e2] to-[#00d4ff] font-black text-[56px] sm:text-[88px] md:text-[110px] lg:text-[140px] tracking-tight text-center leading-none"
        style={{
          backgroundSize: "200% 200%",
          animation: "gradient-shift 3s ease infinite",
          WebkitTextStroke: "1.5px rgba(11, 76, 229, 0.15)",
          textShadow:
            "0 10px 40px rgba(11, 76, 229, 0.3), 0 0 60px rgba(74, 144, 226, 0.2)",
        }}
      >
        AgentBuy
      </p>
      <div className="flex flex-col items-center gap-2">
        <p
          className="text-gray-800 font-semibold text-[20px] sm:text-[28px] md:text-[36px] lg:text-[42px] tracking-tight text-center px-4 leading-tight"
          style={{
            animation: "fade-in 1.2s ease-out",
            textShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
          }}
        >
          системд тавтай морил
        </p>
        <p
          className="text-gray-500 font-medium text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] text-center px-6 max-w-2xl"
          style={{
            animation: "fade-in 1.5s ease-out",
            letterSpacing: "0.02em",
          }}
        >
          Таны найдвартай хятадын онлайн худалдааны партнер
        </p>
      </div>
    </div>
  );
};
