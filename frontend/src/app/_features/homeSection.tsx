"use client";
import { AnimatedIconsSection } from "./animatedIconSectionHome";
import { BackgroundGradientSection } from "./backgroundGradientHome";
import { HomePageHeroText } from "./pageHeroTextHome";
import { AuthBtn } from "./authBtnHome";
import Footer from "@/components/Footer";

export const HomeSection = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 w-full min-h-screen bg-linear-to-br from-[#E8F5FF] via-[#F5F9FF] to-[#EEF2FF] relative overflow-hidden">
        <BackgroundGradientSection />
        <AnimatedIconsSection />
        <div className="absolute inset-0 flex items-center justify-center z-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-center items-center gap-6 sm:gap-8 lg:gap-10 max-w-6xl w-full">
            <HomePageHeroText />
            <AuthBtn />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
