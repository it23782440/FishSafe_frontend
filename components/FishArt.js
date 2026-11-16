'use client';
import { useId, useState } from 'react';

/*
 * Fish illustration. If the species has an `imageUrl` (set in Settings) the real
 * photo is shown; otherwise a vector illustration is drawn. The silhouette
 * (deep-bodied / long-bodied / whiskered) and colours are derived from the species
 * id so every registered species looks distinct and stable.
 */
const PALETTES = {
  tilapia: ['#8fc3df', '#2f6f9a', '#1d4f75'],
  carp: ['#efc46a', '#b8741f', '#8a5314'],
  catfish: ['#9aa6b6', '#556072', '#363f4e'],
};

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function paletteFor(id) {
  if (PALETTES[id]) return PALETTES[id];
  const hue = hash(id) % 360;
  return [`hsl(${hue} 55% 68%)`, `hsl(${hue} 50% 40%)`, `hsl(${hue} 55% 27%)`];
}

const VARIANTS = ['deep', 'long', 'whisker'];
const variantFor = (id) => ({ tilapia: 'deep', carp: 'long', catfish: 'whisker' }[id] || VARIANTS[hash(id) % 3]);

function Drawing({ id, light, mid, dark, uid }) {
  const v = variantFor(id);
  const grad = `url(#body-${uid})`;
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" role="img" aria-label={`${id} illustration`}>
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mid} />
          <stop offset="0.55" stopColor={light} />
          <stop offset="1" stopColor={light} stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* bubbles */}
      <g fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.500">
        <circle cx="26" cy="30" r="4" /><circle cx="36" cy="18" r="2.500" /><circle cx="170" cy="22" r="3.500" /><circle cx="180" cy="36" r="2" />
      </g>
      {v === 'deep' && (
        <g>
          <path d="M150 62 L186 36 Q177 62 186 88 Z" fill={dark} />
          <path d="M66 30 Q98 4 142 38 Z" fill={dark} opacity="0.9" />
          <path d="M72 92 Q96 108 122 90 Z" fill={dark} opacity="0.8" />
          <path d="M30 62 C48 24 118 12 152 46 C160 54 161 70 152 78 C118 108 48 100 30 62 Z" fill={grad} />
          <path d="M60 40 C80 30 120 32 142 52" fill="none" stroke={dark} strokeOpacity="0.25" strokeWidth="2" />
          <path d="M70 50 Q64 62 70 76" fill="none" stroke={dark} strokeOpacity="0.4" strokeWidth="2" />
          <circle cx="50" cy="57" r="4.500" fill="#fff" /><circle cx="49" cy="57" r="2.400" fill="#0b1f33" />
        </g>
      )}
      {v === 'long' && (
        <g>
          <path d="M152 62 L188 40 Q180 62 188 84 Z" fill={dark} />
          <path d="M58 42 Q100 20 146 50 Z" fill={dark} opacity="0.9" />
          <path d="M76 84 Q98 98 120 84 Z" fill={dark} opacity="0.8" />
          <path d="M20 62 C44 34 120 28 154 54 C162 60 162 66 154 72 C120 98 44 92 20 62 Z" fill={grad} />
          <path d="M22 66 q-8 6 -10 14 M24 70 q-6 8 -6 15" fill="none" stroke={dark} strokeWidth="1.800" strokeLinecap="round" />
          <path d="M82 46 q10 14 0 32 M96 44 q10 16 0 36 M110 46 q10 14 0 32" fill="none" stroke={dark} strokeOpacity="0.2" strokeWidth="1.600" />
          <circle cx="44" cy="58" r="4" fill="#fff" /><circle cx="43" cy="58" r="2.200" fill="#0b1f33" />
        </g>
      )}
      {v === 'whisker' && (
        <g>
          <path d="M150 66 Q184 48 188 66 Q184 84 150 66 Z" fill={dark} />
          <path d="M62 52 Q104 38 146 58 Z" fill={dark} opacity="0.85" />
          <path d="M118 58 q12 -10 24 -2" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          <path d="M18 68 C40 46 112 46 152 60 C161 63 161 69 152 72 C112 88 40 86 18 68 Z" fill={grad} />
          <path d="M20 66 Q6 52 4 40 M20 69 Q4 62 2 56 M20 72 Q6 84 6 96 M22 70 Q10 78 10 88" fill="none" stroke={dark} strokeWidth="2" strokeLinecap="round" />
          <circle cx="40" cy="61" r="3.600" fill="#fff" /><circle cx="39" cy="61" r="2" fill="#0b1f33" />
        </g>
      )}
    </svg>
  );
}

export default function FishArt({ id, name, imageUrl, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const [broken, setBroken] = useState(false);
  const [light, mid, dark] = paletteFor(id);
  const showPhoto = imageUrl && !broken;
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-sky-200 dark:from-[#0d2a4a] dark:via-[#0b2240] dark:to-[#08182e] ${className}`}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name || id} onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : (
        <Drawing id={id} light={light} mid={mid} dark={dark} uid={uid} />
      )}
    </div>
  );
}
