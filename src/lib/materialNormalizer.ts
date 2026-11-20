/**
 * EcoLoop Material Normalizer
 *
 * Preserves the Teachable Machine model's exact 4 class names:
 * "plastic" | "metal" | "paper" | "general"
 *
 * Adds separate handling for "organic" waste and detects empty background states.
 */

import type { MaterialCategory } from "../types/reward.ts";

/**
 * Checks whether a raw label indicates an empty background (no item present).
 */
export function isEmptyBackground(raw: string): boolean {
  if (!raw || typeof raw !== "string") return true;
  const cleaned = raw.trim().toLowerCase();
  const emptyKeywords = [
    "empty",
    "background",
    "no item",
    "nothing",
    "none",
    "empty background",
    "void",
    "class 3", // Common TM index if trained as background
  ];
  return emptyKeywords.some((kw) => cleaned === kw || cleaned.includes("empty background"));
}

/**
 * Normalizes raw labels into one of the 5 EcoLoop material categories.
 * Preserves compatibility with the 4 AI classes (plastic, metal, paper, general)
 * while treating organic waste separately.
 */
export function normalizeMaterialCategory(raw: string): MaterialCategory {
  if (!raw || typeof raw !== "string") return "general";
  const cleaned = raw.trim().toLowerCase();

  if (isEmptyBackground(cleaned)) {
    return "general";
  }

  // Organic MUST be treated separately and never confused with general
  if (
    cleaned.includes("organic") ||
    cleaned.includes("banana") ||
    cleaned.includes("peel") ||
    cleaned.includes("food waste") ||
    cleaned.includes("vegetable") ||
    cleaned.includes("fruit") ||
    cleaned.includes("biodegradable")
  ) {
    return "organic";
  }

  // Exact Teachable Machine classes & keywords
  if (
    cleaned === "plastic" ||
    cleaned.includes("plastic") ||
    cleaned.includes("pet") ||
    cleaned.includes("bottle") ||
    cleaned.includes("wrapper") ||
    cleaned.includes("hdpe")
  ) {
    return "plastic";
  }

  if (
    cleaned === "metal" ||
    cleaned.includes("metal") ||
    cleaned.includes("aluminium") ||
    cleaned.includes("aluminum") ||
    cleaned.includes("can") ||
    cleaned.includes("tin") ||
    cleaned.includes("foil") ||
    cleaned.includes("steel")
  ) {
    return "metal";
  }

  if (
    cleaned === "paper" ||
    cleaned.includes("paper") ||
    cleaned.includes("cardboard") ||
    cleaned.includes("carton") ||
    cleaned.includes("notebook") ||
    cleaned.includes("book") ||
    cleaned.includes("cup")
  ) {
    return "paper";
  }

  return "general";
}

/**
 * Backwards-compatible export mapping directly to the 4 core AI categories.
 */
export function normalizeAiCategory(raw: string): "plastic" | "metal" | "paper" | "general" {
  const cat = normalizeMaterialCategory(raw);
  if (cat === "organic") {
    // When strictly constraining to the 4 AI classes, organic is flagged separately
    return "general";
  }
  return cat;
}
