interface PremiumLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
}

export default function PremiumLogo({ size = 36, showText = true, textSize = 20 }: PremiumLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="logoGrad2" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
          </linearGradient>
          <filter id="logoGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Hexagon background */}
        <path
          d="M20 2L35.5 11V29L20 38L4.5 29V11L20 2Z"
          fill="url(#logoGrad1)"
          filter="url(#logoGlow)"
        />

        {/* Inner hex border */}
        <path
          d="M20 5L33 13V27L20 35L7 27V13L20 5Z"
          fill="none"
          stroke="url(#logoGrad2)"
          strokeWidth="0.5"
        />

        {/* Stylized X / exchange arrows */}
        <path
          d="M12 14L20 20L28 14"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path
          d="M12 26L20 20L28 26"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        {/* Center diamond */}
        <circle cx="20" cy="20" r="2.5" fill="white" opacity="0.95" />

        {/* Top-right shine */}
        <circle cx="27" cy="13" r="1.5" fill="white" opacity="0.5" />
      </svg>

      {showText && (
        <span style={{
          fontWeight: 900,
          fontSize: textSize,
          letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>
          CryptoXchange
        </span>
      )}
    </div>
  );
}
