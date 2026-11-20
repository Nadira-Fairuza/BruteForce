/**
 * EcoLoop Reward and Weight Estimation Type Definitions
 */

export type MaterialCategory = "plastic" | "metal" | "paper" | "organic" | "general";

// Item Subtypes with typical estimated weights
export type PlasticSubtype =
  | "pet_bottle_500ml"
  | "pet_bottle_1l"
  | "plastic_wrapper"
  | "plastic_cup";

export type MetalSubtype =
  | "aluminium_can"
  | "tin_can"
  | "foil_container";

export type PaperSubtype =
  | "paper_cup"
  | "cardboard_box_small"
  | "notebook"
  | "tissue_snack_carton";

export type OrganicSubtype = "organic_waste";

export type GeneralSubtype = "general_waste" | "empty_background";

export type ItemSubtype =
  | PlasticSubtype
  | MetalSubtype
  | PaperSubtype
  | OrganicSubtype
  | GeneralSubtype;

export interface SubtypeWeightConfig {
  id: ItemSubtype;
  category: MaterialCategory;
  name: string;
  typicalWeightGrams: number;
  binName: string;
  description: string;
  brandExamples?: string[];
}

export interface RewardCalculationInput {
  material: string;
  subtype?: string;
  confidenceScore: number;
  manualWeightGrams?: number;
  isVerified?: boolean;
  submissionId?: string;
}

export interface RewardCalculationOutput {
  success: boolean;
  eligible: boolean;
  material: MaterialCategory;
  subtype: ItemSubtype;
  subtypeName: string;
  estimatedWeightGrams: number;
  rewardRatePerKg: number;
  rewardBdt: number;
  ecoPoints: number;
  confidenceScore: number;
  binName: string;
  isEstimate: boolean;
  verificationStatus: "ai_inferred" | "user_verified" | "conservative_fallback";
  requiresReview?: boolean;
  reason?: string;
}

export interface WalletSummary {
  cardId: string;
  name: string;
  ecoPoints: number;
  balanceBdt: number;
  totalSubmissions: number;
}
