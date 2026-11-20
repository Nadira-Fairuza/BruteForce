/**
 * EcoLoop Weight Estimation System
 *
 * Estimates item weight based on identified subtype and typical item weights.
 *
 * IMPORTANT: Standard cameras cannot physically weigh an object.
 * All estimated weights are labeled approximate and derive from configurable averages.
 */

import type { MaterialCategory, ItemSubtype } from "../types/reward.ts";
import {
  ITEM_SUBTYPES,
  CONSERVATIVE_FALLBACK_SUBTYPES,
} from "./rewardConfig.ts";
import { isEmptyBackground, normalizeMaterialCategory } from "./materialNormalizer.ts";

export interface WeightEstimationResult {
  category: MaterialCategory;
  subtype: ItemSubtype;
  subtypeName: string;
  estimatedWeightGrams: number;
  confidenceScore: number;
  isEstimate: boolean;
  verificationStatus: "ai_inferred" | "user_verified" | "conservative_fallback";
  requiresSelection: boolean;
  isEmpty: boolean;
}

/**
 * Estimates the item subtype and typical weight in grams.
 */
export function estimateItemWeight(
  rawLabel: string,
  categoryHint?: MaterialCategory,
  explicitSubtype?: string,
  confidenceScore: number = 0.9
): WeightEstimationResult {
  const isEstimate = true;

  // 1. Check for empty background
  if (isEmptyBackground(rawLabel)) {
    const emptyConfig = ITEM_SUBTYPES.empty_background;
    return {
      category: "general",
      subtype: "empty_background",
      subtypeName: emptyConfig.name,
      estimatedWeightGrams: 0,
      confidenceScore,
      isEstimate,
      verificationStatus: "conservative_fallback",
      requiresSelection: false,
      isEmpty: true,
    };
  }

  // 2. Explicit Subtype (e.g. from user verification or UI selection)
  if (explicitSubtype && explicitSubtype in ITEM_SUBTYPES) {
    const config = ITEM_SUBTYPES[explicitSubtype as ItemSubtype];
    return {
      category: config.category,
      subtype: config.id,
      subtypeName: config.name,
      estimatedWeightGrams: config.typicalWeightGrams,
      confidenceScore,
      isEstimate,
      verificationStatus: "user_verified",
      requiresSelection: false,
      isEmpty: false,
    };
  }

  const cleaned = (rawLabel ?? "").trim().toLowerCase();
  const category = categoryHint ?? normalizeMaterialCategory(cleaned);

  // 3. Subtype keyword matching based on typical roadside items in Bangladesh
  // --- PLASTIC SUBTYPES ---
  if (category === "plastic") {
    // 1 L / Large bottles (Mojo, RC, 1L, 1.5L)
    if (
      cleaned.includes("1l") ||
      cleaned.includes("1 liter") ||
      cleaned.includes("1.5l") ||
      cleaned.includes("large") ||
      cleaned.includes("mojo") ||
      cleaned.includes("rc cola")
    ) {
      const cfg = ITEM_SUBTYPES.pet_bottle_1l;
      return {
        category: "plastic",
        subtype: "pet_bottle_1l",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // 500 ml bottles (Mum, Spa, Pran, standard water/soda)
    if (
      cleaned.includes("500ml") ||
      cleaned.includes("mum") ||
      cleaned.includes("spa") ||
      cleaned.includes("pran") ||
      cleaned.includes("bottle") ||
      cleaned.includes("pet")
    ) {
      const cfg = ITEM_SUBTYPES.pet_bottle_500ml;
      return {
        category: "plastic",
        subtype: "pet_bottle_500ml",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // Plastic cups
    if (cleaned.includes("cup") || cleaned.includes("glass")) {
      const cfg = ITEM_SUBTYPES.plastic_cup;
      return {
        category: "plastic",
        subtype: "plastic_cup",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // Plastic wrappers
    if (cleaned.includes("wrapper") || cleaned.includes("packet") || cleaned.includes("chip") || cleaned.includes("biscuit")) {
      const cfg = ITEM_SUBTYPES.plastic_wrapper;
      return {
        category: "plastic",
        subtype: "plastic_wrapper",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }
  }

  // --- METAL SUBTYPES ---
  if (category === "metal") {
    // Tin cans
    if (cleaned.includes("tin") || cleaned.includes("food tin") || cleaned.includes("milk")) {
      const cfg = ITEM_SUBTYPES.tin_can;
      return {
        category: "metal",
        subtype: "tin_can",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // Foil containers
    if (cleaned.includes("foil") || cleaned.includes("tray") || cleaned.includes("takeaway")) {
      const cfg = ITEM_SUBTYPES.foil_container;
      return {
        category: "metal",
        subtype: "foil_container",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // Aluminium drink cans
    if (
      cleaned.includes("aluminium") ||
      cleaned.includes("aluminum") ||
      cleaned.includes("can") ||
      cleaned.includes("soda can") ||
      cleaned.includes("coke")
    ) {
      const cfg = ITEM_SUBTYPES.aluminium_can;
      return {
        category: "metal",
        subtype: "aluminium_can",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }
  }

  // --- PAPER SUBTYPES ---
  if (category === "paper") {
    // Notebooks (250g)
    if (cleaned.includes("notebook") || cleaned.includes("khata") || cleaned.includes("book") || cleaned.includes("exercise")) {
      const cfg = ITEM_SUBTYPES.notebook;
      return {
        category: "paper",
        subtype: "notebook",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // Cardboard boxes (100g)
    if (cleaned.includes("cardboard") || cleaned.includes("box") || cleaned.includes("carton box") || cleaned.includes("parcel")) {
      const cfg = ITEM_SUBTYPES.cardboard_box_small;
      return {
        category: "paper",
        subtype: "cardboard_box_small",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // Tissue / snack cartons (15g)
    if (cleaned.includes("tissue") || cleaned.includes("snack carton") || cleaned.includes("cereal")) {
      const cfg = ITEM_SUBTYPES.tissue_snack_carton;
      return {
        category: "paper",
        subtype: "tissue_snack_carton",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }

    // Paper cups (10g)
    if (cleaned.includes("cup") || cleaned.includes("tea cup") || cleaned.includes("coffee")) {
      const cfg = ITEM_SUBTYPES.paper_cup;
      return {
        category: "paper",
        subtype: "paper_cup",
        subtypeName: cfg.name,
        estimatedWeightGrams: cfg.typicalWeightGrams,
        confidenceScore,
        isEstimate,
        verificationStatus: "ai_inferred",
        requiresSelection: false,
        isEmpty: false,
      };
    }
  }

  // --- ORGANIC SUBTYPES ---
  if (category === "organic") {
    const cfg = ITEM_SUBTYPES.organic_waste;
    return {
      category: "organic",
      subtype: "organic_waste",
      subtypeName: cfg.name,
      estimatedWeightGrams: cfg.typicalWeightGrams,
      confidenceScore,
      isEstimate,
      verificationStatus: "ai_inferred",
      requiresSelection: false,
      isEmpty: false,
    };
  }

  // 4. Conservative Fallback when subtype cannot be identified confidently
  const fallbackSubtype = CONSERVATIVE_FALLBACK_SUBTYPES[category] ?? "general_waste";
  const fallbackConfig = ITEM_SUBTYPES[fallbackSubtype];

  return {
    category,
    subtype: fallbackSubtype,
    subtypeName: fallbackConfig.name,
    estimatedWeightGrams: fallbackConfig.typicalWeightGrams,
    confidenceScore,
    isEstimate,
    verificationStatus: "conservative_fallback",
    requiresSelection: category !== "general",
    isEmpty: false,
  };
}
