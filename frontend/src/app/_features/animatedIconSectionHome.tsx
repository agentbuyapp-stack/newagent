import { AnimatedIconsHome } from "../_components/animatedIconsHome";

export const AnimatedIconsSection = () => {
  return (
    <>
      {/* Left side icons */}
      <AnimatedIconsHome
        classname="absolute top-[8%] left-[6%] hidden sm:block"
        style="float-1 10s ease-in-out infinite"
        imgURL="/taobao.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[22%] left-[15%] hidden md:block"
        style="float-3 10s ease-in-out infinite"
        imgURL="/pinduoduo.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[45%] left-[8%] hidden lg:block"
        style="float-2 10s ease-in-out infinite"
        imgURL="/poizon.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[58%] left-[4%] hidden sm:block"
        style="float-5 6.5s ease-in-out infinite"
        imgURL="/alibaba.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[75%] left-[12%] hidden md:block"
        style="float-4 8s ease-in-out infinite"
        imgURL="/alipay.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[85%] left-[6%] hidden lg:block"
        style="float-1 6s ease-in-out infinite"
        imgURL="/pinduoduo.svg"
      />

      {/* Right side icons */}
      <AnimatedIconsHome
        classname="absolute top-[12%] right-[8%] hidden sm:block"
        style="float-4 8s ease-in-out infinite"
        imgURL="/poizon.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[6%] right-[16%] hidden md:block"
        style="float-2 7s ease-in-out infinite"
        imgURL="/alibaba.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[38%] right-[5%] hidden lg:block"
        style="float-5 6.5s ease-in-out infinite"
        imgURL="/taobao.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[52%] right-[12%] hidden sm:block"
        style="float-3 5s ease-in-out infinite"
        imgURL="/pinduoduo.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[72%] right-[8%] hidden md:block"
        style="float-1 6s ease-in-out infinite"
        imgURL="/poizon.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[82%] right-[14%] hidden lg:block"
        style="float-2 7s ease-in-out infinite"
        imgURL="/alibaba.svg"
      />

      {/* Center icons (only on xl screens) */}
      <AnimatedIconsHome
        classname="absolute top-[10%] left-[42%] hidden xl:block"
        style="float-5 6.5s ease-in-out infinite"
        imgURL="/taobao.svg"
      />
      <AnimatedIconsHome
        classname="absolute top-[78%] left-[48%] hidden xl:block"
        style="float-4 8s ease-in-out infinite"
        imgURL="/poizon.svg"
      />
    </>
  );
};
