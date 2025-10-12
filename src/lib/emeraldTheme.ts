// GreenScape Lux Unified Emerald Theme System
// This file contains all emerald color mappings to ensure consistency

export const emeraldTheme = {
  // Primary emerald colors
  primary: 'emerald-500',
  primaryHover: 'emerald-600',
  primaryLight: 'emerald-400',
  primaryDark: 'emerald-700',
  
  // Text colors
  text: 'emerald-300',
  textLight: 'emerald-200',
  textDark: 'emerald-400',
  
  // Background colors
  bg: 'emerald-500/10',
  bgHover: 'emerald-500/20',
  bgStrong: 'emerald-500/30',
  
  // Border colors
  border: 'emerald-500/30',
  borderHover: 'emerald-400/50',
  borderStrong: 'emerald-500/50',
  
  // Shadow colors
  shadow: 'emerald-500/20',
  shadowStrong: 'emerald-500/40',
  
  // Glow effects
  glow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
  glowStrong: 'shadow-[0_0_30px_rgba(16,185,129,0.6)]',
  glowHover: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
};

// Button variants using unified emerald
export const emeraldButtons = {
  primary: `bg-${emeraldTheme.primary} hover:bg-${emeraldTheme.primaryHover} text-black`,
  secondary: `bg-transparent border-2 border-${emeraldTheme.primary} text-${emeraldTheme.primary} hover:bg-${emeraldTheme.primary} hover:text-black`,
  ghost: `text-${emeraldTheme.text} hover:text-${emeraldTheme.textLight} hover:bg-${emeraldTheme.bg}`,
  outline: `border border-${emeraldTheme.border} text-${emeraldTheme.text} hover:border-${emeraldTheme.borderHover} hover:bg-${emeraldTheme.bg}`
};

// Card variants using unified emerald
export const emeraldCards = {
  default: `bg-black/60 border border-${emeraldTheme.border} hover:border-${emeraldTheme.borderHover}`,
  glow: `bg-black/60 border border-${emeraldTheme.border} hover:border-${emeraldTheme.borderHover} ${emeraldTheme.glow}`,
  strong: `bg-black/60 border border-${emeraldTheme.borderStrong} ${emeraldTheme.shadowStrong}`
};

// Input variants using unified emerald
export const emeraldInputs = {
  default: `bg-black/50 border-${emeraldTheme.border} focus:border-${emeraldTheme.primary} focus:ring-2 focus:ring-${emeraldTheme.primary}/50`,
  glow: `bg-black/50 border-${emeraldTheme.border} focus:border-${emeraldTheme.primary} focus:ring-2 focus:ring-${emeraldTheme.primary}/50 focus:${emeraldTheme.glow}`
};