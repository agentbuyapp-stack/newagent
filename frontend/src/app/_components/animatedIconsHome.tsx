/* eslint-disable @next/next/no-img-element */
interface AnimatedIconsHomeProps {
  classname: string;
  style: string;
  imgURL: string;
}

export const AnimatedIconsHome = ({ classname, style, imgURL }: AnimatedIconsHomeProps) => {
  return (
    <div
      className={classname}
      style={{ animation: style }}
    >
      <img
        src={imgURL}
        alt="icon"
        className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl shadow-lg object-cover"
      />
    </div>
  );
};
