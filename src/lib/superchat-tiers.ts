export type TierName = "BASIC" | "HYPE" | "EPIC" | "LEGENDARY" | "ULTRA";

export interface SuperchatTier {
  name: TierName;
  label: string;
  minAmount: number;
  // Card background gradient (CSS value)
  bg: string;
  // Border color class
  borderClass: string;
  // Amount text color class
  amountClass: string;
  // Name text color class
  nameClass: string;
  // Animation class applied to the card on mount
  animationClass: string;
  // Glow/shadow style (inline, for OBS compat)
  glowStyle?: string;
  // Whether to show the shimmer sweep effect
  shimmer: boolean;
  // Whether to show the pulse ring effect
  pulse: boolean;
}

export const SUPERCHAT_TIERS: SuperchatTier[] = [
  {
    name: "BASIC",
    label: "Basic",
    minAmount: 10,
    bg: "linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)",
    borderClass: "border-purple-500/30",
    amountClass: "text-purple-300",
    nameClass: "text-white",
    animationClass: "sc-anim-basic",
    shimmer: false,
    pulse: false,
  },
  {
    name: "HYPE",
    label: "Hype",
    minAmount: 50,
    bg: "linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%)",
    borderClass: "border-violet-400/60",
    amountClass: "text-violet-300",
    nameClass: "text-white",
    animationClass: "sc-anim-hype",
    glowStyle: "0 0 12px 2px rgba(139,92,246,0.35)",
    shimmer: true,
    pulse: false,
  },
  {
    name: "EPIC",
    label: "Epic",
    minAmount: 100,
    bg: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
    borderClass: "border-blue-400/70",
    amountClass: "text-blue-300",
    nameClass: "text-white",
    animationClass: "sc-anim-epic",
    glowStyle: "0 0 18px 4px rgba(59,130,246,0.45)",
    shimmer: true,
    pulse: true,
  },
  {
    name: "LEGENDARY",
    label: "Legendary",
    minAmount: 250,
    bg: "linear-gradient(135deg, #1a0a00 0%, #7c2d12 40%, #1a0a00 100%)",
    borderClass: "border-orange-400/80",
    amountClass: "text-orange-300",
    nameClass: "text-orange-100",
    animationClass: "sc-anim-legendary",
    glowStyle: "0 0 24px 6px rgba(251,146,60,0.5)",
    shimmer: true,
    pulse: true,
  },
  {
    name: "ULTRA",
    label: "Ultra",
    minAmount: 500,
    bg: "linear-gradient(135deg, #0a0a0a 0%, #4a0080 30%, #800040 60%, #0a0a0a 100%)",
    borderClass: "border-fuchsia-400/90",
    amountClass: "text-fuchsia-200",
    nameClass: "text-fuchsia-100",
    animationClass: "sc-anim-ultra",
    glowStyle: "0 0 32px 8px rgba(217,70,239,0.6)",
    shimmer: true,
    pulse: true,
  },
];

export function getSuperchatTier(amount: number): SuperchatTier {
  // Walk tiers from highest to lowest, return first match
  for (let i = SUPERCHAT_TIERS.length - 1; i >= 0; i--) {
    if (amount >= SUPERCHAT_TIERS[i].minAmount) {
      return SUPERCHAT_TIERS[i];
    }
  }
  // Below ₹10 — still show as BASIC
  return SUPERCHAT_TIERS[0];
}

export const currencySymbol = (c: string) => (c === "INR" ? "₹" : c);
