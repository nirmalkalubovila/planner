export interface InsightTheme {
  id: string;
  name: string;
  gradientClass: string;
  canvasGradient: [string, string, string]; // [from, via, to]
  textColor: string;
  accentTextColor: string;
  accentStroke: string;
  accentBg: string;
  glowColor: string;
}

export const INSIGHT_THEMES: InsightTheme[] = [
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    gradientClass: 'bg-gradient-to-br from-[#0B3C5D] via-[#328CC1] to-[#1D2731]',
    canvasGradient: ['#0B3C5D', '#328CC1', '#1D2731'],
    textColor: 'text-slate-100',
    accentTextColor: 'text-emerald-400',
    accentStroke: 'stroke-emerald-400',
    accentBg: 'bg-emerald-500/10 border-emerald-500/20',
    glowColor: 'rgba(52, 211, 153, 0.2)',
  },
  {
    id: 'sunset',
    name: 'Sunset Coral',
    gradientClass: 'bg-gradient-to-br from-[#FE5F55] via-[#F0B67F] to-[#7A306C]',
    canvasGradient: ['#FE5F55', '#F0B67F', '#7A306C'],
    textColor: 'text-rose-50',
    accentTextColor: 'text-amber-300',
    accentStroke: 'stroke-amber-300',
    accentBg: 'bg-amber-500/10 border-amber-500/20',
    glowColor: 'rgba(251, 191, 36, 0.2)',
  },
  {
    id: 'ocean',
    name: 'Ocean Depth',
    gradientClass: 'bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364]',
    canvasGradient: ['#0F2027', '#203A43', '#2C5364'],
    textColor: 'text-sky-50',
    accentTextColor: 'text-cyan-400',
    accentStroke: 'stroke-cyan-400',
    accentBg: 'bg-cyan-500/10 border-cyan-500/20',
    glowColor: 'rgba(34, 211, 238, 0.2)',
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    gradientClass: 'bg-gradient-to-br from-[#000000] via-[#1A1A1A] to-[#C5A059]',
    canvasGradient: ['#000000', '#1A1A1A', '#C5A059'],
    textColor: 'text-[#F5F5F5]',
    accentTextColor: 'text-[#D4AF37]',
    accentStroke: 'stroke-[#D4AF37]',
    accentBg: 'bg-[#D4AF37]/10 border-[#D4AF37]/20',
    glowColor: 'rgba(212, 175, 55, 0.2)',
  },
  {
    id: 'neon',
    name: 'Neon Dreams',
    gradientClass: 'bg-gradient-to-br from-[#12072B] via-[#410F4D] to-[#0A1128]',
    canvasGradient: ['#12072B', '#410F4D', '#0A1128'],
    textColor: 'text-fuchsia-50',
    accentTextColor: 'text-fuchsia-400',
    accentStroke: 'stroke-fuchsia-400',
    accentBg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
    glowColor: 'rgba(240, 119, 240, 0.25)',
  },
  {
    id: 'forest',
    name: 'Forest Mist',
    gradientClass: 'bg-gradient-to-br from-[#132612] via-[#2A4D2A] to-[#0F1410]',
    canvasGradient: ['#132612', '#2A4D2A', '#0F1410'],
    textColor: 'text-emerald-50',
    accentTextColor: 'text-lime-400',
    accentStroke: 'stroke-lime-400',
    accentBg: 'bg-lime-500/10 border-lime-500/20',
    glowColor: 'rgba(163, 230, 53, 0.2)',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Dust',
    gradientClass: 'bg-gradient-to-br from-[#0D0221] via-[#261447] to-[#540B0E]',
    canvasGradient: ['#0D0221', '#261447', '#540B0E'],
    textColor: 'text-rose-50',
    accentTextColor: 'text-violet-400',
    accentStroke: 'stroke-violet-400',
    accentBg: 'bg-violet-500/10 border-violet-500/20',
    glowColor: 'rgba(167, 139, 250, 0.25)',
  },
  {
    id: 'desert',
    name: 'Desert Glow',
    gradientClass: 'bg-gradient-to-br from-[#3D0C11] via-[#851C20] to-[#E3B04B]',
    canvasGradient: ['#3D0C11', '#851C20', '#E3B04B'],
    textColor: 'text-[#FCF6EC]',
    accentTextColor: 'text-[#E3B04B]',
    accentStroke: 'stroke-[#E3B04B]',
    accentBg: 'bg-[#E3B04B]/10 border-[#E3B04B]/20',
    glowColor: 'rgba(227, 176, 75, 0.2)',
  },
  {
    id: 'frozen',
    name: 'Frozen Lake',
    gradientClass: 'bg-gradient-to-br from-[#1D3557] via-[#457B9D] to-[#A8DADC]',
    canvasGradient: ['#1D3557', '#457B9D', '#A8DADC'],
    textColor: 'text-slate-100',
    accentTextColor: 'text-sky-300',
    accentStroke: 'stroke-sky-300',
    accentBg: 'bg-sky-500/10 border-sky-500/20',
    glowColor: 'rgba(14, 165, 233, 0.15)',
  },
  {
    id: 'cherry',
    name: 'Cherry Blossom',
    gradientClass: 'bg-gradient-to-br from-[#2D0B16] via-[#6B2D5C] to-[#E0A899]',
    canvasGradient: ['#2D0B16', '#6B2D5C', '#E0A899'],
    textColor: 'text-pink-50',
    accentTextColor: 'text-pink-400',
    accentStroke: 'stroke-pink-400',
    accentBg: 'bg-pink-500/10 border-pink-500/20',
    glowColor: 'rgba(244, 114, 182, 0.2)',
  },
  {
    id: 'volcanic',
    name: 'Volcanic Alert',
    gradientClass: 'bg-gradient-to-br from-[#150707] via-[#4A1515] to-[#FF4B3E]',
    canvasGradient: ['#150707', '#4A1515', '#FF4B3E'],
    textColor: 'text-red-50',
    accentTextColor: 'text-orange-400',
    accentStroke: 'stroke-orange-400',
    accentBg: 'bg-orange-500/10 border-orange-500/20',
    glowColor: 'rgba(251, 146, 60, 0.25)',
  },
  {
    id: 'aurora-green',
    name: 'Northern Lights',
    gradientClass: 'bg-gradient-to-br from-[#031B19] via-[#0A4B3A] to-[#1EE3B4]',
    canvasGradient: ['#031B19', '#0A4B3A', '#1EE3B4'],
    textColor: 'text-teal-50',
    accentTextColor: 'text-[#1EE3B4]',
    accentStroke: 'stroke-[#1EE3B4]',
    accentBg: 'bg-[#1EE3B4]/10 border-[#1EE3B4]/20',
    glowColor: 'rgba(30, 227, 180, 0.25)',
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    gradientClass: 'bg-gradient-to-br from-[#020205] via-[#0D0B1C] to-[#251F47]',
    canvasGradient: ['#020205', '#0D0B1C', '#251F47'],
    textColor: 'text-slate-100',
    accentTextColor: 'text-indigo-400',
    accentStroke: 'stroke-indigo-400',
    accentBg: 'bg-indigo-500/10 border-indigo-500/20',
    glowColor: 'rgba(129, 140, 248, 0.2)',
  },
  {
    id: 'tropical',
    name: 'Tropical Storm',
    gradientClass: 'bg-gradient-to-br from-[#08203E] via-[#557A95] to-[#B1A296]',
    canvasGradient: ['#08203E', '#557A95', '#B1A296'],
    textColor: 'text-slate-50',
    accentTextColor: 'text-cyan-300',
    accentStroke: 'stroke-cyan-300',
    accentBg: 'bg-cyan-500/10 border-cyan-500/20',
    glowColor: 'rgba(6, 182, 212, 0.15)',
  },
  {
    id: 'autumn',
    name: 'Autumn Fire',
    gradientClass: 'bg-gradient-to-br from-[#2D1600] via-[#5C2E00] to-[#E65C00]',
    canvasGradient: ['#2D1600', '#5C2E00', '#E65C00'],
    textColor: 'text-amber-50',
    accentTextColor: 'text-amber-400',
    accentStroke: 'stroke-amber-400',
    accentBg: 'bg-amber-500/10 border-amber-500/20',
    glowColor: 'rgba(245, 158, 11, 0.2)',
  },
  {
    id: 'royal',
    name: 'Royal Night',
    gradientClass: 'bg-gradient-to-br from-[#0B0C10] via-[#1F2833] to-[#45A29E]',
    canvasGradient: ['#0B0C10', '#1F2833', '#45A29E'],
    textColor: 'text-teal-50',
    accentTextColor: 'text-teal-400',
    accentStroke: 'stroke-teal-400',
    accentBg: 'bg-teal-500/10 border-teal-500/20',
    glowColor: 'rgba(20, 184, 166, 0.2)',
  },
  {
    id: 'emerald',
    name: 'Emerald City',
    gradientClass: 'bg-gradient-to-br from-[#051C05] via-[#0E470E] to-[#4DDE4D]',
    canvasGradient: ['#051C05', '#0E470E', '#4DDE4D'],
    textColor: 'text-emerald-50',
    accentTextColor: 'text-emerald-400',
    accentStroke: 'stroke-emerald-400',
    accentBg: 'bg-emerald-500/10 border-emerald-500/20',
    glowColor: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    gradientClass: 'bg-gradient-to-br from-[#0D0000] via-[#3A0007] to-[#780016]',
    canvasGradient: ['#0D0000', '#3A0007', '#780016'],
    textColor: 'text-rose-100',
    accentTextColor: 'text-rose-400',
    accentStroke: 'stroke-rose-400',
    accentBg: 'bg-rose-500/10 border-rose-500/20',
    glowColor: 'rgba(244, 63, 94, 0.25)',
  },
  {
    id: 'arctic',
    name: 'Arctic Dawn',
    gradientClass: 'bg-gradient-to-br from-[#101F30] via-[#2F4F70] to-[#E2E8F0]',
    canvasGradient: ['#101F30', '#2F4F70', '#E2E8F0'],
    textColor: 'text-slate-100',
    accentTextColor: 'text-sky-300',
    accentStroke: 'stroke-sky-300',
    accentBg: 'bg-sky-500/10 border-sky-500/20',
    glowColor: 'rgba(56, 189, 248, 0.15)',
  },
  {
    id: 'electric',
    name: 'Electric Storm',
    gradientClass: 'bg-gradient-to-br from-[#0C0220] via-[#350A6E] to-[#EEDF18]',
    canvasGradient: ['#0C0220', '#350A6E', '#EEDF18'],
    textColor: 'text-yellow-50',
    accentTextColor: 'text-yellow-300',
    accentStroke: 'stroke-yellow-300',
    accentBg: 'bg-yellow-500/10 border-yellow-500/20',
    glowColor: 'rgba(234, 179, 8, 0.2)',
  },
];

/**
 * Deterministically retrieves a theme based on a string hash (e.g. week key) and card index
 */
export function getInsightTheme(cardIndex: number, hashSeed: string): InsightTheme {
  if (!hashSeed) {
    return INSIGHT_THEMES[cardIndex % INSIGHT_THEMES.length];
  }
  
  let hash = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hash = hashSeed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const themeIndex = Math.abs(hash + cardIndex) % INSIGHT_THEMES.length;
  return INSIGHT_THEMES[themeIndex];
}
