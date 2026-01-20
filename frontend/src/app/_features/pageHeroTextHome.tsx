export const HomePageHeroText = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-2 sm:gap-3 md:gap-4 w-full px-4">
      <h1
        className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl text-transparent bg-clip-text bg-linear-to-r from-[#0b4ce5] via-[#4a90e2] to-[#00d4ff] font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight text-center leading-none"
        style={{
          backgroundSize: "200% 200%",
          animation: "gradient-shift 3s ease infinite",
          WebkitTextStroke: "1px rgba(11, 76, 229, 0.15)",
          textShadow:
            "0 10px 40px rgba(11, 76, 229, 0.3), 0 0 60px rgba(74, 144, 226, 0.2)",
        }}
      >
        AgentBuy
      </h1>
      <div className="flex flex-col items-center gap-1 sm:gap-2 mt-2 sm:mt-4">
        <p
          className="text-gray-800 font-semibold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl tracking-tight text-center leading-tight"
          style={{
            animation: "fade-in 1.2s ease-out",
            textShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
          }}
        >
          системд тавтай морил
        </p>
        <p
          className="text-gray-500 font-medium text-xs sm:text-sm md:text-base lg:text-lg text-center px-2 sm:px-4 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xl"
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
