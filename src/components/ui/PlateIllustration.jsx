import React from 'react';

export function TopDownPlateSVG({ styleType = 'buffet', size = 'large' }) {
  const dim =
    size === 'large'
      ? 'w-64 h-64 sm:w-80 sm:h-80 lg:w-[340px] lg:h-[340px]'
      : size === 'medium'
        ? 'w-24 h-24'
        : 'w-14 h-14';

  return (
    <div className={`relative select-none ${dim} flex items-center justify-center`}>
      <div
        className={`absolute rounded-full bg-stone-900/20 blur-xl ${
          size === 'large' ? 'inset-4 translate-y-5 -translate-x-2' : 'inset-1 translate-y-1.5'
        }`}
      />
      <svg viewBox="0 0 300 300" className="w-full h-full relative z-10 overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="plateRim" cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="72%" stopColor="#F5F3EE" />
            <stop offset="92%" stopColor="#E4DFD3" />
            <stop offset="100%" stopColor="#D0C9B8" />
          </radialGradient>
          <radialGradient id="plateInner" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="85%" stopColor="#FAF8F5" />
            <stop offset="100%" stopColor="#EAE5D9" />
          </radialGradient>
          <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          <radialGradient id="tumpengCone" cx="45%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="60%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#CA8A04" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="142" fill="url(#plateRim)" />
        <circle cx="150" cy="150" r="136" fill="none" stroke="url(#goldTrim)" strokeWidth="2.5" opacity="0.75" />
        <circle cx="150" cy="150" r="108" fill="url(#plateInner)" stroke="#E5E0D5" strokeWidth="2" />

        {styleType === 'buffet' && (
          <g>
            <path d="M 65 140 Q 95 70 175 75 Q 230 105 220 175 Q 165 235 85 205 Z" fill="#065F46" opacity="0.9" />
            <circle cx="122" cy="125" r="42" fill="#FFFDF9" stroke="#E7E5E4" strokeWidth="2" />
            <circle cx="116" cy="120" r="3" fill="#047857" />
            <circle cx="126" cy="126" r="2.5" fill="#047857" />
            <path d="M 114 114 Q 122 105 130 116" stroke="#059669" strokeWidth="3" fill="none" strokeLinecap="round" />
            <g transform="translate(155, 92)">
              <path d="M 0 18 Q 20 -5 45 10 Q 55 32 32 46 Q 8 48 0 18 Z" fill="#451A03" />
              <path d="M 6 20 Q 22 4 38 14 Q 44 28 28 38 Z" fill="#78350F" />
              <path d="M -8 40 Q 12 25 34 38 Q 42 58 18 65 Q -5 62 -8 40 Z" fill="#571D06" />
              <circle cx="20" cy="24" r="2" fill="#F59E0B" />
              <circle cx="28" cy="30" r="1.8" fill="#EF4444" />
            </g>
            <g transform="translate(88, 162)">
              <path d="M 0 15 Q 35 -5 72 12 Q 82 36 52 50 Q 15 48 0 15 Z" fill="#9A3412" />
              <path d="M 10 18 Q 38 5 62 18 Q 66 32 45 40 Z" fill="#C2410C" />
              <line x1="20" y1="14" x2="30" y2="38" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
              <line x1="36" y1="12" x2="46" y2="38" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
              <line x1="52" y1="15" x2="58" y2="34" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
            </g>
            <circle cx="195" cy="182" r="11" fill="#DC2626" />
            <circle cx="176" cy="198" r="10" fill="#EF4444" />
            <circle cx="210" cy="164" r="9" fill="#16A34A" />
          </g>
        )}

        {styleType === 'bento' && (
          <g>
            <circle cx="115" cy="110" r="34" fill="#15803D" />
            <circle cx="135" cy="95" r="26" fill="#16A34A" />
            <circle cx="95" cy="128" r="25" fill="#22C55E" />
            <rect x="110" y="112" width="106" height="64" rx="14" transform="rotate(14 160 144)" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <rect x="118" y="118" width="90" height="50" rx="10" transform="rotate(14 160 144)" fill="#FBBF24" />
            <circle cx="162" cy="142" r="7" fill="#15803D" />
            <g stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M 92 175 Q 115 162 138 184" />
              <path d="M 102 188 Q 130 172 152 196" />
              <path d="M 88 195 Q 118 188 142 208" />
            </g>
          </g>
        )}

        {styleType === 'tumpeng' && (
          <g>
            <circle cx="150" cy="150" r="96" fill="#064E3B" />
            <circle cx="150" cy="150" r="88" fill="#047857" stroke="#F59E0B" strokeWidth="2" strokeDasharray="8 4" />
            <circle cx="95" cy="110" r="20" fill="#16A34A" />
            <ellipse cx="204" cy="112" rx="22" ry="15" transform="rotate(25 204 112)" fill="#9A3412" />
            <circle cx="206" cy="184" r="19" fill="#DC2626" />
            <circle cx="94" cy="186" r="18" fill="#D97706" />
            <circle cx="150" cy="216" r="16" fill="#FDE047" />
            <circle cx="150" cy="150" r="52" fill="url(#tumpengCone)" stroke="#B45309" strokeWidth="2" />
            <circle cx="150" cy="150" r="10" fill="#DC2626" />
          </g>
        )}

        {styleType === 'roast' && (
          <g>
            <circle cx="150" cy="150" r="88" fill="#FDE68A" />
            <path d="M 118 145 A 34 34 0 1 1 182 155" stroke="#B45309" strokeWidth="6" fill="none" strokeLinecap="round" />
            <g transform="translate(115, 110)">
              <rect x="0" y="12" width="38" height="24" rx="8" transform="rotate(-12)" fill="#78350F" />
              <rect x="26" y="4" width="42" height="26" rx="8" transform="rotate(15)" fill="#451A03" />
              <rect x="10" y="34" width="44" height="25" rx="8" transform="rotate(6)" fill="#92400E" />
            </g>
            <circle cx="96" cy="165" r="14" fill="#ECFCCB" stroke="#15803D" strokeWidth="4" />
            <circle cx="198" cy="168" r="14" fill="#ECFCCB" stroke="#15803D" strokeWidth="4" />
          </g>
        )}

        {styleType === 'snack' && (
          <g>
            <circle cx="150" cy="150" r="90" fill="#FEF3C7" />
            <rect x="85" y="95" width="60" height="44" rx="14" fill="#B45309" />
            <rect x="92" y="102" width="46" height="30" rx="10" fill="#F59E0B" />
            <circle cx="185" cy="118" r="24" fill="#15803D" />
            <circle cx="185" cy="118" r="14" fill="#FEF08A" />
            <path d="M 105 182 Q 150 148 195 182 Q 175 215 125 215 Z" fill="#78350F" />
            <circle cx="150" cy="182" r="8" fill="#FDE68A" />
          </g>
        )}
      </svg>
    </div>
  );
}
