import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32 md:w-40 md:h-40',
    large: 'w-40 h-40 md:w-48 md:h-48'
  };

  return (
    <img
      src="https://d64gsuwffb70l.cloudfront.net/68366206d4e44998c9b3046b_1753842719826_a8c02e0b.png"
      alt="GreenScape Lux Logo"
      className={`${sizeClasses[size]} drop-shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:drop-shadow-[0_0_30px_rgba(34,197,94,0.7)] transition-all duration-300 ${className}`}
    />
  );
};

export default Logo;
export { Logo };