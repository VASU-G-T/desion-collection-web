import React from 'react';

interface ShopLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
  lightBg?: boolean;
  customLogoUrl?: string | null;
}

export const ShopLogo: React.FC<ShopLogoProps> = ({
  className = "w-8 h-8 text-cyan-400",
  size,
  animated = false,
  lightBg = false,
  customLogoUrl
}) => {
  const effectiveLogo = customLogoUrl !== undefined 
    ? customLogoUrl 
    : (typeof window !== 'undefined' ? localStorage.getItem('nextprinters_custom_logo') : null);

  if (effectiveLogo) {
    return (
      <img
        src={effectiveLogo}
        alt="Shop Logo"
        className={`object-contain rounded-lg transition-transform ${animated ? 'hover:scale-105 duration-300' : ''} ${className}`}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 240 300"
      fill="currentColor"
      className={`inline-block shrink-0 transition-transform ${animated ? 'hover:scale-105 duration-300' : ''} ${className}`}
      style={size ? { width: size, height: size } : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="flameCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      {/* Main Flame Outline and Tribal Lettering Cutouts */}
      <g fill={lightBg ? "#0f172a" : "currentColor"}>
        {/* Outer Flame Contour */}
        <path
          d="M 112,12 
             C 118,28 128,52 138,78 
             C 146,62 148,46 145,30 
             C 152,40 155,54 153,68 
             C 151,80 144,92 136,106 
             C 148,90 156,80 162,74 
             C 159,90 152,112 141,130 
             C 152,122 160,116 168,114 
             C 162,130 152,152 141,170 
             C 154,156 166,150 174,152 
             C 184,155 190,166 186,182 
             C 180,212 162,242 142,264 
             C 122,286 98,298 76,288 
             C 52,278 38,250 35,220 
             C 32,182 48,140 74,90 
             C 86,68 98,38 112,12 Z
             
             M 88,115 
             C 70,152 60,182 62,208 
             C 64,228 76,248 92,254 
             C 108,260 126,250 140,232 
             C 156,212 168,186 172,162 
             C 164,170 154,174 140,178 
             C 144,158 150,134 158,116 
             C 152,122 144,130 134,140 
             C 138,122 144,104 148,88 
             C 140,98 130,112 120,128 
             C 124,110 130,92 134,74 
             C 124,88 110,114 88,115 Z"
        />

        {/* Inner Tribal Lettering 'N' 'C' 'S' Flame Strokes */}
        <path
          d="M 82,160 
             C 88,150 96,144 105,140 
             C 102,154 99,170 99,186 
             C 99,208 105,228 114,244 
             L 102,234 
             C 94,222 88,204 85,186 
             C 82,176 82,168 82,160 Z"
        />
        <path
          d="M 112,170 
             L 126,164 
             L 126,218 
             C 120,212 115,202 112,190 
             L 112,170 Z"
        />
        <path
          d="M 136,178 
             C 144,175 152,178 158,186 
             C 152,202 145,218 136,232 
             C 142,218 145,204 145,190 
             C 145,185 142,181 136,178 Z"
        />
      </g>
    </svg>
  );
};

