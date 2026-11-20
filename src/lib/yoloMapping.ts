/**
 * YOLO detector class -> EcoLoop app category/subtype.
 *
 * Class names and their order are fixed by the training pipeline
 * (recycling-bin-yolo-kit/bin-yolo/AGENTS.md):
 * plastic_bottle, aluminum_can, glass, paper_cardboard, e_waste, non_recyclable
 */

import type { MaterialCategory, ItemSubtype } from "../types/reward.ts";

export interface YoloClassMapping {
  category: MaterialCategory;
  subtype: ItemSubtype;
  recyclable: boolean;
}

export const YOLO_CLASS_MAP: Record<string, YoloClassMapping> = {
  plastic_bottle: { category: "plastic", subtype: "pet_bottle_500ml", recyclable: true },
  aluminum_can: { category: "metal", subtype: "aluminium_can", recyclable: true },
  glass: { category: "glass", subtype: "glass_bottle", recyclable: true },
  paper_cardboard: { category: "paper", subtype: "cardboard_box_small", recyclable: true },
  e_waste: { category: "ewaste", subtype: "ewaste_general", recyclable: true },
  non_recyclable: { category: "general", subtype: "general_waste", recyclable: false },
};

export function mapYoloClass(rawLabel: string | null | undefined): YoloClassMapping | null {
  if (typeof rawLabel !== "string" || !rawLabel) return null;
  const key = rawLabel.trim().toLowerCase().replace(/\s+/g, "_");
  return YOLO_CLASS_MAP[key] ?? null;
}

/**
 * Coerces a classifier confidence into a finite number in [0, 1].
 * Anything unusable becomes 0 — the reward gate then holds the deposit
 * instead of paying it.
 */
export function toConfidence(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(1, numeric));
}
