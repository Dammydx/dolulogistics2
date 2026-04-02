import motocycleImg from '../../assets/motocycle.png';

const DispatchBikeIcon = ({ size = 24, className = '', ...props }: any) => {
  const { color, style, ...restProps } = props;

  return (
    <span
      className={`inline-block ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color || 'currentColor',
        maskImage: `url(${motocycleImg})`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(${motocycleImg})`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        transform: 'scale(1.55)',
        filter: `drop-shadow(0px 0px 0.5px ${color || 'currentColor'}) brightness(1.2)`,
        opacity: 1,
        ...style,
      }}
      {...restProps}
    />
  );
};

export default DispatchBikeIcon;
