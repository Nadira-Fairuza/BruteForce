/**
 * EcoLoop Reward Calculator
 *
 * Implements the formula:
 * rewardBDT = (estimatedWeightGrams / 1000) * rewardRatePerKg
 * ecoPoints = rewardBDT * 100 = (estimatedWeightGrams * rewardRatePerKg) / 10
 *
 * Calculates in integer EcoPoints (1 EcoPoint = ৳0.01) to eliminate floating-point precision errors.
 */

import type {
  RewardCalculationInput,
  RewardCalculationOutput,
} from "../types/reward.ts";
import {
  REWARD_RATES_PER_KG,
  ITEM_SUBTYPES,
  MIN_CONFIDENCE_THRESHOLD,
  MAX_ESTIMATED_WEIGHT_GRAMS,
} from "./rewardConfig.ts";
import { estimateItemWeight } from "./weightEstimator.ts";
import { isEmptyBackground, normalizeMaterialCategory } from "./materialNormalizer.ts";

/**
 * Calculates integer EcoPoints given weight in grams and rate per kg.
 * Avoids floating-point precision errors by computing directly in integer poisha:
 * (grams * ratePerKg) / 10
 */
export function calculateEcoPoints(estimatedWeightGrams: number, rewardRatePerKg: number): number {
  if (!Number.isFinite(estimatedWeightGrams) || estimatedWeightGrams <= 0) return 0;
  if (!Number.isFinite(rewardRatePerKg) || rewardRatePerKg <= 0) return 0;
  // (grams / 1000) * ratePerKg * 100 = (grams * ratePerKg) / 10
  return Math.round((estimatedWeightGrams * rewardRatePerKg) / 10);
}

/**
 * Converts integer EcoPoints into BDT currency.
 * 100 EcoPoints = ৳1.00
 */
export function ecoPointsToBdt(ecoPoints: number): number {
  return Math.round(ecoPoints) / 100;
}

/**
 * Formats EcoPoints and BDT for clean display.
 */
export function formatRewardDisplay(ecoPoints: number): {
  pointsText: string;
  bdtText: string;
} {
  const bdt = ecoPointsToBdt(ecoPoints);
  return {
    pointsText: `${ecoPoints.toLocaleString()} EcoPoints`,
    bdtText: `৳${bdt.toFixed(2)}`,
  };
}

/**
 * Validates submission parameters and calculates EcoPoints and BDT reward.
 */
export function calculateEcoLoopReward(input: RewardCalculationInput): RewardCalculationOutput {
  const isEstimate = true;

  // 1. Check for Empty Background (Strict rejection)
  if (isEmptyBackground(input.material)) {
    return {
      success: false,
      eligible: false,
      material: "general",
      subtype: "empty_background",
      subtypeName: "Empty Background / No Item",
      estimatedWeightGrams: 0,
      rewardRatePerKg: 0,
      rewardBdt: 0,
      ecoPoints: 0,
      confidenceScore: typeof input.confidenceScore === "number" ? input.confidenceScore : 0,
      binName: "Grey Bin — General",
      isEstimate,
      verificationStatus: "conservative_fallback",
      requiresReview: false,
      reason: "Empty background detected. Please place an item in the chute to receive a reward.",
    };
  }

  // 2. Validate Confidence Score
  const rawConfidence =
    typeof input.confidenceScore === "number" && Number.isFinite(input.confidenceScore)
      ? Math.max(0, Math.min(1, input.confidenceScore))
      : 0;

  // 3. Weight Estimation / Resolution
  const category = normalizeMaterialCategory(input.material);
  const estimation = estimateItemWeight(
    input.material,
    category,
    input.subtype,
    rawConfidence
  );

  // Manual weight override if provided and valid
  let finalWeightGrams = estimation.estimatedWeightGrams;
  if (typeof input.manualWeightGrams === "number") {
    // 4. Validate Weight: Negative, NaN, or non-finite weights must be rejected
    if (!Number.isFinite(input.manualWeightGrams) || input.manualWeightGrams <= 0) {
      return {
        success: false,
        eligible: false,
        material: category,
        subtype: estimation.subtype,
        subtypeName: estimation.subtypeName,
        estimatedWeightGrams: 0,
        rewardRatePerKg: REWARD_RATES_PER_KG[category],
        rewardBdt: 0,
        ecoPoints: 0,
        confidenceScore: rawConfidence,
        binName: ITEM_SUBTYPES[estimation.subtype]?.binName ?? "General Bin",
        isEstimate,
        verificationStatus: estimation.verificationStatus,
        requiresReview: false,
        reason: "Invalid weight. Deposit weight must be a positive finite number.",
      };
    }
    finalWeightGrams = input.manualWeightGrams;
  }

  // 5. Weight Cap Validation: Flag excessively large estimated weights (> 5000g)
  let requiresReview = false;
  if (finalWeightGrams > MAX_ESTIMATED_WEIGHT_GRAMS) {
    requiresReview = true;
  }

  const rewardRatePerKg = REWARD_RATES_PER_KG[category] ?? 0;
  const config = ITEM_SUBTYPES[estimation.subtype] ?? ITEM_SUBTYPES.general_waste;

  // 6. Confidence Gate: Predictions below 60% threshold must not receive automatic rewards
  if (rawConfidence < MIN_CONFIDENCE_THRESHOLD && !input.isVerified) {
    return {
      success: true,
      eligible: false,
      material: category,
      subtype: estimation.subtype,
      subtypeName: estimation.subtypeName,
      estimatedWeightGrams: finalWeightGrams,
      rewardRatePerKg,
      rewardBdt: 0,
      ecoPoints: 0,
      confidenceScore: rawConfidence,
      binName: config.binName,
      isEstimate,
      verificationStatus: estimation.verificationStatus,
      requiresReview: true,
      reason: `AI confidence (${Math.round(rawConfidence * 100)}%) is below the ${Math.round(
        MIN_CONFIDENCE_THRESHOLD * 100
      )}% threshold. Subtype verification or attendant review is required.`,
    };
  }

  // 7. General Waste: Always 0 EcoPoints
  if (category === "general" || estimation.subtype === "general_waste") {
    return {
      success: true,
      eligible: false,
      material: "general",
      subtype: "general_waste",
      subtypeName: "General / Non-Recyclable",
      estimatedWeightGrams: finalWeightGrams,
      rewardRatePerKg: 0,
      rewardBdt: 0,
      ecoPoints: 0,
      confidenceScore: rawConfidence,
      binName: config.binName,
      isEstimate,
      verificationStatus: estimation.verificationStatus,
      requiresReview: false,
      reason: "General non-recyclable waste earns 0 EcoPoints.",
    };
  }

  // 8. Calculate Integer EcoPoints and BDT
  const ecoPoints = calculateEcoPoints(finalWeightGrams, rewardRatePerKg);
  const rewardBdt = ecoPointsToBdt(ecoPoints);

  const verificationStatus = input.isVerified
    ? "user_verified"
    : estimation.verificationStatus;

  return {
    success: true,
    eligible: true,
    material: category,
    subtype: estimation.subtype,
    subtypeName: estimation.subtypeName,
    estimatedWeightGrams: finalWeightGrams,
    rewardRatePerKg,
    rewardBdt,
    ecoPoints,
    confidenceScore: rawConfidence,
    binName: config.binName,
    isEstimate,
    verificationStatus,
    requiresReview,
    reason: `Awarded +${ecoPoints} EcoPoints (৳${rewardBdt.toFixed(2)}) for estimated ${finalWeightGrams}g ${estimation.subtypeName}.`,
  };
}
