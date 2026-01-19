import { BackgroundGradient } from "../_components/backgroundGradientHome";

export const BackgroundGradientSection = () => {
  return (
    <>
      <BackgroundGradient
        classname="absolute top-0 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
        style="float-3 20s ease-in-out infinite"
      />
      <BackgroundGradient
        classname="absolute -top-40 right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
        style="float-2 25s ease-in-out infinite"
      />
      <BackgroundGradient
        classname="absolute bottom-20 right-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"
        style="float-5 22s ease-in-out infinite"
      />
      <BackgroundGradient
        classname="absolute bottom-40 -left-20 w-80 h-80 bg-purple-400/15 rounded-full blur-3xl"
        style="float-4 18s ease-in-out infinite"
      />
    </>
  );
};
