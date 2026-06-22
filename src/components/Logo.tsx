import React from 'react';

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export default function Logo({ showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Golden Goat Head SVG Icon */}
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-[#0d1527] border border-white/10 shadow-lg group-hover:border-indigo-500/30 transition-all duration-300">
        <svg
          viewBox="0 0 100 100"
          className="h-9 w-9 filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.2)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Metallic Gold Gradients */}
            <linearGradient id="gold-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="30%" stopColor="#FFD54F" />
              <stop offset="70%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#AA7C11" />
            </linearGradient>
            
            <linearGradient id="gold-light" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFF9C4" />
              <stop offset="50%" stopColor="#FDD835" />
              <stop offset="100%" stopColor="#F57F17" />
            </linearGradient>

            <linearGradient id="gold-horn" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF59D" />
              <stop offset="50%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#FF6F00" />
            </linearGradient>
          </defs>

          {/* Goat Horn Left representing ridges */}
          <path
            d="M 45,35 Q 20,20 18,5 C 22,12 30,22 47,38 Z"
            fill="url(#gold-horn)"
            opacity="0.95"
          />
          {/* Horn Ridge Lines Left */}
          <path d="M 23,15 Q 30,17 38,28" stroke="#5D4037" strokeWidth="0.75" opacity="0.3" />
          <path d="M 19,8 Q 26,11 31,19" stroke="#5D4037" strokeWidth="0.75" opacity="0.3" />

          {/* Goat Horn Right representing ridges */}
          <path
            d="M 55,35 Q 80,20 82,5 C 78,12 70,22 53,38 Z"
            fill="url(#gold-horn)"
            opacity="0.95"
          />
          {/* Horn Ridge Lines Right */}
          <path d="M 77,15 Q 70,17 62,28" stroke="#5D4037" strokeWidth="0.75" opacity="0.3" />
          <path d="M 81,8 Q 74,11 69,19" stroke="#5D4037" strokeWidth="0.75" opacity="0.3" />

          {/* Goat Face Center Head Shield */}
          <path
            d="M 50,32 L 67,48 L 56,80 L 50,92 L 44,80 L 33,48 Z"
            fill="url(#gold-primary)"
          />

          {/* Goat Nose/Muzzle contour */}
          <path
            d="M 50,32 L 64,48 L 54,75 L 50,86 L 46,75 L 36,48 Z"
            fill="url(#gold-light)"
            opacity="0.9"
          />

          {/* Goat Ears Left */}
          <path
            d="M 33,48 L 15,50 C 25,56 30,58 37,55 Z"
            fill="url(#gold-primary)"
          />

          {/* Goat Ears Right */}
          <path
            d="M 67,48 L 85,50 C 75,56 70,58 63,55 Z"
            fill="url(#gold-primary)"
          />

          {/* Goat Eyes (Abstract angled cuts) */}
          <polygon points="41,52 46,55 42,57" fill="#1E293B" />
          <polygon points="59,52 54,55 58,57" fill="#1E293B" />

          {/* Goat Beard (bottom spike) */}
          <path
            d="M 50,86 L 54,98 L 50,95 L 46,98 Z"
            fill="url(#gold-primary)"
          />

          {/* Subtle forehead crown detail */}
          <path
            d="M 50,32 L 46,38 L 50,42 L 54,38 Z"
            fill="#FFF59D"
            opacity="0.8"
          />
        </svg>

        {/* Outer ambient gold ring */}
        <div className="absolute inset-0 rounded-xl border border-amber-400/20 group-hover:border-amber-400/50 transition-colors duration-300 pointer-events-none" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-extrabold tracking-tight text-white">
              Liga
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              Bandot
            </span>
          </div>
          <span className="text-[9px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold leading-none mt-0.5">
            PREMIUM PARTNER
          </span>
        </div>
      )}
    </div>
  );
}
