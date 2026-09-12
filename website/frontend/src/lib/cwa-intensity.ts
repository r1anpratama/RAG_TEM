/**
 * Central Weather Administration (CWA / 中央氣象署) Taiwan Seismic Intensity Scale
 * Official 10-tier standard established in Jan 2020.
 */

export interface CwaLevelInfo {
  level: string;
  nameEn: string;
  nameZh: string;
  pgaRange: string;
  pgvRange?: string;
  color: string;
  textColor: string;
  bgClass: string;
  borderClass: string;
  glowColor: string;
  description: string;
}

export const CWA_INTENSITY_SCALE: Record<string, CwaLevelInfo> = {
  "0": {
    level: "0",
    nameEn: "Micro",
    nameZh: "無感",
    pgaRange: "< 0.8 Gal",
    color: "#94a3b8",
    textColor: "#0f172a",
    bgClass: "bg-slate-400",
    borderClass: "border-slate-400",
    glowColor: "rgba(148, 163, 184, 0.4)",
    description: "Not felt by people; recorded only by seismometers.",
  },
  "1": {
    level: "1",
    nameEn: "Very Minor",
    nameZh: "微震",
    pgaRange: "0.8 - 2.5 Gal",
    color: "#38bdf8",
    textColor: "#0f172a",
    bgClass: "bg-sky-400",
    borderClass: "border-sky-400",
    glowColor: "rgba(56, 189, 248, 0.5)",
    description: "Felt slightly by a few quiet individuals indoors.",
  },
  "2": {
    level: "2",
    nameEn: "Minor",
    nameZh: "輕震",
    pgaRange: "2.5 - 8.0 Gal",
    color: "#4ade80",
    textColor: "#0f172a",
    bgClass: "bg-emerald-400",
    borderClass: "border-emerald-400",
    glowColor: "rgba(74, 222, 128, 0.5)",
    description: "Felt by most people indoors; hanging objects swing slightly.",
  },
  "3": {
    level: "3",
    nameEn: "Light",
    nameZh: "弱震",
    pgaRange: "8.0 - 25.0 Gal",
    color: "#facc15",
    textColor: "#0f172a",
    bgClass: "bg-yellow-400",
    borderClass: "border-yellow-400",
    glowColor: "rgba(250, 204, 21, 0.5)",
    description: "Felt by nearly everyone; dishes rattle, doors shake.",
  },
  "4": {
    level: "4",
    nameEn: "Moderate",
    nameZh: "中震",
    pgaRange: "25.0 - 80.0 Gal",
    color: "#fb923c",
    textColor: "#0f172a",
    bgClass: "bg-orange-400",
    borderClass: "border-orange-400",
    glowColor: "rgba(251, 146, 60, 0.6)",
    description: "Considerable shaking; unstable objects topple; slight building stress.",
  },
  "5-": {
    level: "5-",
    nameEn: "5 Weak",
    nameZh: "5弱",
    pgaRange: "80 - 140 Gal",
    pgvRange: "15 - 30 cm/s",
    color: "#f87171",
    textColor: "#ffffff",
    bgClass: "bg-red-400",
    borderClass: "border-red-400",
    glowColor: "rgba(248, 113, 113, 0.7)",
    description: "Most people frightened; heavy furniture moves; minor structural cracking.",
  },
  "5+": {
    level: "5+",
    nameEn: "5 Strong",
    nameZh: "5強",
    pgaRange: "140 - 250 Gal",
    pgvRange: "30 - 50 cm/s",
    color: "#dc2626",
    textColor: "#ffffff",
    bgClass: "bg-red-600",
    borderClass: "border-red-600",
    glowColor: "rgba(220, 38, 38, 0.8)",
    description: "Hard to walk; furniture falls; poorly reinforced walls crack severely.",
  },
  "6-": {
    level: "6-",
    nameEn: "6 Weak",
    nameZh: "6弱",
    pgaRange: "250 - 440 Gal",
    pgvRange: "50 - 80 cm/s",
    color: "#b91c1c",
    textColor: "#ffffff",
    bgClass: "bg-red-700",
    borderClass: "border-red-700",
    glowColor: "rgba(185, 28, 28, 0.85)",
    description: "Standing impossible; heavy doors break open; walls and chimneys collapse.",
  },
  "6+": {
    level: "6+",
    nameEn: "6 Strong",
    nameZh: "6強",
    pgaRange: "440 - 800 Gal",
    pgvRange: "80 - 140 cm/s",
    color: "#9333ea",
    textColor: "#ffffff",
    bgClass: "bg-purple-600",
    borderClass: "border-purple-600",
    glowColor: "rgba(147, 51, 234, 0.9)",
    description: "Severe damage; masonry buildings crumble; major ground fissures.",
  },
  "7": {
    level: "7",
    nameEn: "Great",
    nameZh: "劇震",
    pgaRange: "≥ 800 Gal",
    pgvRange: "≥ 140 cm/s",
    color: "#581c87",
    textColor: "#ffffff",
    bgClass: "bg-purple-900",
    borderClass: "border-purple-900",
    glowColor: "rgba(88, 28, 135, 0.95)",
    description: "Catastrophic damage; high-strength buildings severely damaged or destroyed.",
  },
};

export function getCwaLevelInfo(intensity: string | number): CwaLevelInfo {
  const clean = String(intensity)
    .replace(/^Int\s*/i, "")
    .replace(/^Level\s*/i, "")
    .replace(/^等級\s*/i, "")
    .trim();

  return CWA_INTENSITY_SCALE[clean] || CWA_INTENSITY_SCALE["2"];
}

export function pgaToCwaIntensity(pgaGal: number): string {
  if (pgaGal < 0.8) return "0";
  if (pgaGal < 2.5) return "1";
  if (pgaGal < 8.0) return "2";
  if (pgaGal < 25.0) return "3";
  if (pgaGal < 80.0) return "4";
  if (pgaGal < 140.0) return "5-";
  if (pgaGal < 250.0) return "5+";
  if (pgaGal < 440.0) return "6-";
  if (pgaGal < 800.0) return "6+";
  return "7";
}
