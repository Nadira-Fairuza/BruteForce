/**
 * Scan-path helpers shared by the kiosk camera and its tests.
 *
 * The important rule: "the vision service is down" and "the vision service
 * answered but found nothing / something unknown" are different outcomes.
 * Only the first may fall back to the in-browser model or the demo value —
 * the second must stop, or an empty frame gets paid.
 */

import type { TrashMaterial } from "./rewards";

export interface ScanDetectionResult {
  materialType: TrashMaterial;
  rawLabel: string;
  confidenceScore: number;
  subtype?: string;
  reason?: string;
}

export type VisionOutcome =
  | { status: "detected"; detection: ScanDetectionResult }
  | { status: "unavailable" }
  | { status: "stop"; message: string };

export const DEMO_DETECTION: ScanDetectionResult = {
  materialType: "plastic",
  rawLabel: "plastic item (demo)",
  confidenceScore: 0.94,
  reason: "demo_fallback",
};

export function resolveScanDetection(
  vision: VisionOutcome,
  tfDetection: ScanDetectionResult | null
): { detection: ScanDetectionResult } | { message: string } {
  if (vision.status === "detected") return { detection: vision.detection };
  if (vision.status === "stop") return { message: vision.message };
  return { detection: tfDetection ?? DEMO_DETECTION };
}

export function depositKey(detection: {
  materialType: string;
  subtype?: string;
  confidenceScore: number;
}): string {
  return `${detection.materialType}:${detection.subtype ?? ""}:${detection.confidenceScore}`;
}

/**
 * False when the item currently on screen is the one already auto-deposited,
 * so the manual Confirm button cannot credit it twice.
 */
export function allowManualConfirm(
  depositedKey: string | null,
  currentKey: string
): boolean {
  return depositedKey === null || depositedKey !== currentKey;
}
