import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DedeLogo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full ${sizeMap[size]} ${className}`}>
      {/* Outer circular gold border */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_12px_rgba(217,162,56,0.35)]"
      >
        <circle cx="50" cy="50" r="46" stroke="#c8932c" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="40" stroke="#c8932c" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
        
        {/* Decorative compass ticks */}
        <line x1="50" y1="4" x2="50" y2="10" stroke="#e6b349" strokeWidth="2" />
        <line x1="50" y1="90" x2="50" y2="96" stroke="#e6b349" strokeWidth="2" />
        <line x1="4" y1="50" x2="10" y2="50" stroke="#e6b349" strokeWidth="2" />
        <line x1="90" y1="50" x2="96" y2="50" stroke="#e6b349" strokeWidth="2" />

        {/* Crossed scissors vintage barber emblem */}
        <g stroke="#dfa73b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Scissor Blade 1 */}
          <path d="M30 70 L68 30" />
          {/* Scissor Blade 2 */}
          <path d="M70 70 L32 30" />
          
          {/* Scissor loop 1 */}
          <circle cx="28" cy="74" r="8" stroke="#dfa73b" strokeWidth="2" />
          {/* Scissor loop 2 */}
          <circle cx="72" cy="74" r="8" stroke="#dfa73b" strokeWidth="2" />

          {/* Pivot screw */}
          <circle cx="50" cy="50" r="2.5" fill="#e6b349" />
          
          {/* Comb teeth in background */}
          <path d="M42 22 L58 22" stroke="#b67f1f" strokeWidth="1.5" />
          <path d="M44 22 L44 26" stroke="#b67f1f" strokeWidth="1.5" />
          <path d="M47 22 L47 26" stroke="#b67f1f" strokeWidth="1.5" />
          <path d="M50 22 L50 26" stroke="#b67f1f" strokeWidth="1.5" />
          <path d="M53 22 L53 26" stroke="#b67f1f" strokeWidth="1.5" />
          <path d="M56 22 L56 26" stroke="#b67f1f" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
};
