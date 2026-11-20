/**
 * EcoLoop Bangladesh — Reward & Material Classification Engine
 *
 * Coordinates material categorization, AI classification compatibility,
 * typical weight estimation, and EcoPoints reward calculations.
 */

export type * from "../types/reward.ts";
export * from "./rewardConfig.ts";
export * from "./materialNormalizer.ts";
export * from "./weightEstimator.ts";
export * from "./rewardCalculator.ts";

import type { MaterialCategory } from "../types/reward.ts";
import {
  REWARD_RATES_PER_KG,
  ITEM_SUBTYPES,
  MIN_CONFIDENCE_THRESHOLD,
  ECO_POINTS_PER_BDT,
} from "./rewardConfig.ts";
import { calculateEcoLoopReward, calculateEcoPoints } from "./rewardCalculator.ts";
import { normalizeMaterialCategory, isEmptyBackground } from "./materialNormalizer.ts";

// Legacy broad categories compatible with existing TF.js model
export type TrashMaterial = "plastic" | "metal" | "paper" | "organic" | "general";

export interface MaterialRule {
  material: TrashMaterial;
  label: string;
  binName: string;
  rewardBdt: number;
  rewardRatePerKg: number;
  ratePerKgText: string;
}

/**
 * Backwards-compatible MATERIAL_RULES Record
 * Used by existing homepage and kiosk bin visualizer.
 */
export const MATERIAL_RULES: Record<TrashMaterial, MaterialRule> = {
  plastic: {
    material: "plastic",
    label: "Plastic (Bottles / Cups / Wrappers)",
    binName: "Blue Bin — Plastic",
    rewardBdt: REWARD_RATES_PER_KG.plastic,
    rewardRatePerKg: REWARD_RATES_PER_KG.plastic, // ৳10 / kg
    ratePerKgText: "৳10/kg",
  },
  metal: {
    material: "metal",
    label: "Metal (Aluminium Cans / Tins / Foil)",
    binName: "Yellow Bin — Metal",
    rewardBdt: REWARD_RATES_PER_KG.metal,
    rewardRatePerKg: REWARD_RATES_PER_KG.metal, // ৳20 / kg
    ratePerKgText: "৳20/kg",
  },
  paper: {
    material: "paper",
    label: "Paper (Cups / Boxes / Notebooks)",
    binName: "Green Bin — Paper",
    rewardBdt: REWARD_RATES_PER_KG.paper,
    rewardRatePerKg: REWARD_RATES_PER_KG.paper, // ৳5 / kg
    ratePerKgText: "৳5/kg",
  },
  organic: {
    material: "organic",
    label: "Organic (Peels / Biodegradable)",
    binName: "Brown Bin — Organic",
    rewardBdt: REWARD_RATES_PER_KG.organic,
    rewardRatePerKg: REWARD_RATES_PER_KG.organic, // ৳2 / kg
    ratePerKgText: "৳2/kg",
  },
  general: {
    material: "general",
    label: "General / Mixed Waste",
    binName: "Grey Bin — General",
    rewardBdt: 0,
    rewardRatePerKg: 0,
    ratePerKgText: "৳0/kg",
  },
};

/**
 * Preserved normalizeMaterial function
 */
export function normalizeMaterial(raw: string): TrashMaterial {
  return normalizeMaterialCategory(raw);
}

/**
 * Helper to round BDT and poisha avoiding float inaccuracies.
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Format currency for display
 */
export function formatBdt(amount: number): string {
  return `৳${amount.toFixed(2)}`;
}

/**
 * Backward-compatible calculateReward that accepts weight in kilograms or grams,
 * internally delegates to calculateEcoLoopReward, and returns structured data.
 */
export function calculateReward(
  material: string,
  weightKg: number,
  confidenceScore: number,
  options?: {
    subtype?: string;
    isVerified?: boolean;
    rawLabel?: string;
    submissionId?: string;
  }
) {
  // Check empty background
  if (isEmptyBackground(material) || (options?.rawLabel && isEmptyBackground(options.rawLabel))) {
    return {
      success: false,
      eligible: false,
      material: "general" as TrashMaterial,
      subtype: "empty_background",
      subtypeLabel: "Empty Background / No Item",
      binName: "Grey Bin — General",
      weightKg: 0,
      estimatedWeightGrams: 0,
      rewardRateBdtPerKg: 0,
      rewardBdt: 0,
      ecoPoints: 0,
      confidenceScore: typeof confidenceScore === "number" ? confidenceScore : 0,
      verificationStatus: "conservative_fallback" as const,
      isEstimate: true,
      reason: "Empty background detected. Please place an item in the chute.",
    };
  }

  // Weight validation: Weight must be finite, non-NaN, strictly > 0
  if (typeof weightKg !== "number" || !Number.isFinite(weightKg) || Number.isNaN(weightKg) || weightKg <= 0) {
    let reason = "Weight must be a positive finite number in kilograms.";
    if (typeof weightKg === "number" && weightKg <= 0) {
      reason = "Weight must be strictly greater than 0 kg.";
    } else if (typeof weightKg === "number" && !Number.isFinite(weightKg)) {
      reason = "Infinite or NaN weight is rejected.";
    }

    return {
      success: false,
      eligible: false,
      material: normalizeMaterialCategory(material),
      subtype: "general_waste",
      subtypeLabel: "Invalid Weight",
      binName: "Grey Bin — General",
      weightKg: typeof weightKg === "number" && Number.isFinite(weightKg) ? weightKg : 0,
      estimatedWeightGrams: 0,
      rewardRateBdtPerKg: 0,
      rewardBdt: 0,
      ecoPoints: 0,
      confidenceScore: typeof confidenceScore === "number" ? confidenceScore : 0,
      verificationStatus: "conservative_fallback" as const,
      isEstimate: true,
      reason,
    };
  }

  const weightGrams = Math.round(weightKg * 1000);
  const ecoResult = calculateEcoLoopReward({
    material: options?.rawLabel ? `${material} ${options.rawLabel}` : material,
    subtype: options?.subtype,
    confidenceScore,
    manualWeightGrams: weightGrams,
    isVerified: options?.isVerified,
    submissionId: options?.submissionId,
  });

  return {
    success: ecoResult.success,
    eligible: ecoResult.eligible,
    material: ecoResult.material,
    subtype: ecoResult.subtype,
    subtypeLabel: ecoResult.subtypeName,
    binName: ecoResult.binName,
    weightKg: roundToDecimals(ecoResult.estimatedWeightGrams / 1000, 3),
    estimatedWeightGrams: ecoResult.estimatedWeightGrams,
    rewardRateBdtPerKg: ecoResult.rewardRatePerKg,
    rewardBdt: ecoResult.rewardBdt,
    ecoPoints: ecoResult.ecoPoints,
    confidenceScore: ecoResult.confidenceScore,
    verificationStatus: ecoResult.verificationStatus,
    isEstimate: ecoResult.isEstimate,
    requiresReview: ecoResult.requiresReview,
    reason: ecoResult.reason,
  };
}

/**
 * Backwards-compatible getRewardForMaterial
 */
export function getRewardForMaterial(
  material: TrashMaterial,
  confidenceScore: number,
  weightKg: number = 0.05 // default 50g
): number {
  const result = calculateReward(material, weightKg, confidenceScore);
  return result.rewardBdt;
}
