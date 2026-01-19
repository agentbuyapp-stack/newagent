interface BackgroundGradientProps {
  classname: string;
  style: string;
}

export const BackgroundGradient = ({ classname, style }: BackgroundGradientProps) => {
  return (
    <div
      className={classname}
      style={{ animation: style }}
    />
  );
};
