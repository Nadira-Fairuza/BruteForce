export type TrashMaterial = "plastic" | "metal" | "paper" | "general";

export interface MaterialRule {
  material: TrashMaterial;
  label: string;
  binName: string;
  rewardBdt: number;
}

export const MATERIAL_RULES: Record<TrashMaterial, MaterialRule> = {
  plastic: {
    material: "plastic",
    label: "Plastic Bottle / Container",
    binName: "Blue Bin — Plastic",
    rewardBdt: 2,
  },
  metal: {
    material: "metal",
    label: "Aluminum Can / Tin",
    binName: "Yellow Bin — Metal",
    rewardBdt: 5,
  },
  paper: {
    material: "paper",
    label: "Paper / Cardboard Cup",
    binName: "Green Bin — Paper",
    rewardBdt: 1,
  },
  general: {
    material: "general",
    label: "General / Mixed Waste",
    binName: "Grey Bin — General",
    rewardBdt: 0,
  },
};

export function normalizeMaterial(raw: string): TrashMaterial {
  const cleaned = raw.trim().toLowerCase();
  if (cleaned.includes("plastic") || cleaned.includes("pet") || cleaned.includes("bottle")) {
    return "plastic";
  }
  if (cleaned.includes("metal") || cleaned.includes("can") || cleaned.includes("aluminum")) {
    return "metal";
  }
  if (cleaned.includes("paper") || cleaned.includes("cardboard") || cleaned.includes("cup")) {
    return "paper";
  }
  return "general";
}

export function getRewardForMaterial(material: TrashMaterial, confidenceScore: number): number {
  const clampedConfidence = Number.isFinite(confidenceScore)
    ? Math.max(0, Math.min(1, confidenceScore))
    : 0;

  // Require at least 60% AI confidence before awarding BDT
  if (clampedConfidence < 0.6) {
    return 0;
  }

  return MATERIAL_RULES[material]?.rewardBdt ?? 0;
}