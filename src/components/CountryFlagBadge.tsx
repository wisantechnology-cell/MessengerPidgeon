import React from 'react';

interface CountryFlagBadgeProps {
  countryCode: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CountryFlagBadge: React.FC<CountryFlagBadgeProps> = ({
  countryCode,
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-4 h-3',
    md: 'w-5 h-3.5',
    lg: 'w-6 h-4',
  };

  const code = countryCode.trim();

  // Render bespoke clean vector SVG flag based on code
  const renderFlag = () => {
    switch (code) {
      case '16': // PidgeX Direct
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="24" height="16" rx="2" fill="#0284c7" />
            <path
              d="M 6 8 C 8 5 12 5 14 7 C 16 6 18 6 19 8 C 17 9 14 11 11 10 C 9 12 7 11 6 8 Z"
              fill="white"
            />
            <circle cx="15" cy="7" r="1" fill="#0284c7" />
          </svg>
        );

      case '16 34': // Spain
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="24" height="4" fill="#AA151B" />
            <rect y="4" width="24" height="8" fill="#F1BF00" />
            <rect y="12" width="24" height="4" fill="#AA151B" />
            <rect x="5" y="6" width="3" height="4" rx="1" fill="#AA151B" />
          </svg>
        );

      case '16 52': // Mexico
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="8" height="16" fill="#006847" />
            <rect x="8" width="8" height="16" fill="#FFFFFF" />
            <rect x="16" width="8" height="16" fill="#CE1126" />
            <circle cx="12" cy="8" r="2.2" fill="#8B4513" />
          </svg>
        );

      case '16 1': // USA / CA
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="24" height="16" fill="#B22234" />
            <rect y="2.5" width="24" height="2.5" fill="#FFFFFF" />
            <rect y="7.5" width="24" height="2.5" fill="#FFFFFF" />
            <rect y="12.5" width="24" height="2.5" fill="#FFFFFF" />
            <rect width="10" height="9" fill="#3C3B6E" />
            <circle cx="3" cy="3" r="0.8" fill="white" />
            <circle cx="7" cy="3" r="0.8" fill="white" />
            <circle cx="5" cy="5" r="0.8" fill="white" />
            <circle cx="3" cy="7" r="0.8" fill="white" />
            <circle cx="7" cy="7" r="0.8" fill="white" />
          </svg>
        );

      case '16 54': // Argentina
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="24" height="5.33" fill="#75AADB" />
            <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
            <rect y="10.66" width="24" height="5.34" fill="#75AADB" />
            <circle cx="12" cy="8" r="2" fill="#F6B40E" />
          </svg>
        );

      case '16 57': // Colombia
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="24" height="8" fill="#FCD116" />
            <rect y="8" width="24" height="4" fill="#003893" />
            <rect y="12" width="24" height="4" fill="#CE1126" />
          </svg>
        );

      case '16 56': // Chile
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="24" height="8" fill="#FFFFFF" />
            <rect y="8" width="24" height="8" fill="#D52B1E" />
            <rect width="8" height="8" fill="#0039A6" />
            <path
              d="M 4 2 L 4.6 3.6 L 6.2 3.6 L 4.9 4.6 L 5.4 6.2 L 4 5.2 L 2.6 6.2 L 3.1 4.6 L 1.8 3.6 L 3.4 3.6 Z"
              fill="#FFFFFF"
            />
          </svg>
        );

      case '16 51': // Peru
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="8" height="16" fill="#D91023" />
            <rect x="8" width="8" height="16" fill="#FFFFFF" />
            <rect x="16" width="8" height="16" fill="#D91023" />
            <rect x="10.5" y="6" width="3" height="4" rx="0.5" fill="#D91023" opacity="0.3" />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 24 16" fill="none" className="w-full h-full rounded-[2px] shadow-xs">
            <rect width="24" height="16" rx="2" fill="#0284c7" />
            <circle cx="12" cy="8" r="4" fill="white" opacity="0.3" />
          </svg>
        );
    }
  };

  return (
    <span className={`inline-flex shrink-0 items-center overflow-hidden border border-slate-700/20 ${sizeMap[size]} ${className}`}>
      {renderFlag()}
    </span>
  );
};
