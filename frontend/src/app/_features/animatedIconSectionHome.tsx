import { AnimatedIconsHome } from "../_components/animatedIconsHome";

export const AnimatedIconsSection = () => {
  return (
    <>
      {/* Mobile icons - top area (4 icons) */}
      <AnimatedIconsHome
        classname="absolute top-[2%] left-[3%] scale-50 sm:scale-75 md:scale-100"
        style="float-1 10s ease-in-out infinite"
        imgURL="/taobao.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[8%] left-[30%] scale-50 sm:scale-75 md:scale-100"
        style="float-2 7s ease-in-out infinite"
        imgURL="/pinduoduo-stock-e-commerce-1609177441009.webp"
      />
      <AnimatedIconsHome
        classname="absolute top-[3%] right-[25%] scale-50 sm:scale-75 md:scale-100"
        style="float-3 9s ease-in-out infinite"
        imgURL="/alibaba.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[6%] right-[3%] scale-50 sm:scale-75 md:scale-100"
        style="float-4 8s ease-in-out infinite"
        imgURL="/Dewu-Poizon-E-Commerce-1024x576.jpg"
      />

      {/* Mobile icons - bottom area (4 icons) */}
      <AnimatedIconsHome
        classname="absolute top-[80%] left-[3%] scale-50 sm:scale-75 md:scale-100"
        style="float-5 6.5s ease-in-out infinite"
        imgURL="/alibaba.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[85%] left-[28%] scale-50 sm:scale-75 md:scale-100"
        style="float-1 8s ease-in-out infinite"
        imgURL="/taobao.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[82%] right-[25%] scale-50 sm:scale-75 md:scale-100"
        style="float-4 7s ease-in-out infinite"
        imgURL="/Dewu-Poizon-E-Commerce-1024x576.jpg"
      />
      <AnimatedIconsHome
        classname="absolute top-[87%] right-[3%] scale-50 sm:scale-75 md:scale-100"
        style="float-3 5s ease-in-out infinite"
        imgURL="/pinduoduo-stock-e-commerce-1609177441009.webp"
      />

      {/* Additional icons for larger screens */}
      <AnimatedIconsHome
        classname="absolute top-[22%] left-[15%] hidden sm:block"
        style="float-3 10s ease-in-out infinite"
        imgURL="/pinduoduo-stock-e-commerce-1609177441009.webp"
      />
      <AnimatedIconsHome
        classname="absolute top-[45%] left-[8%] hidden md:block"
        style="float-2 10s ease-in-out infinite"
        imgURL="/Dewu-Poizon-E-Commerce-1024x576.jpg"
      />
      <AnimatedIconsHome
        classname="absolute top-[58%] left-[4%] hidden lg:block"
        style="float-5 6.5s ease-in-out infinite"
        imgURL="/alibaba.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[85%] left-[15%] hidden md:block"
        style="float-4 8s ease-in-out infinite"
        imgURL="/visa.png"
      />

      {/* Right side icons for larger screens */}
      <AnimatedIconsHome
        classname="absolute top-[6%] right-[16%] hidden sm:block"
        style="float-2 7s ease-in-out infinite"
        imgURL="/alibaba.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[38%] right-[5%] hidden md:block"
        style="float-5 6.5s ease-in-out infinite"
        imgURL="/taobao.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[52%] right-[12%] hidden lg:block"
        style="float-3 5s ease-in-out infinite"
        imgURL="/pinduoduo-stock-e-commerce-1609177441009.webp"
      />
      <AnimatedIconsHome
        classname="absolute top-[72%] right-[15%] hidden sm:block"
        style="float-1 6s ease-in-out infinite"
        imgURL="/Dewu-Poizon-E-Commerce-1024x576.jpg"
      />

      {/* Center icons (only on xl screens) */}
      <AnimatedIconsHome
        classname="absolute top-[10%] left-[42%] hidden xl:block"
        style="float-5 6.5s ease-in-out infinite"
        imgURL="/taobao.png"
      />
      <AnimatedIconsHome
        classname="absolute top-[78%] left-[48%] hidden xl:block"
        style="float-4 8s ease-in-out infinite"
        imgURL="/Dewu-Poizon-E-Commerce-1024x576.jpg"
      />
    </>
  );
};
