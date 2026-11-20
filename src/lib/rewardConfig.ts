/**
 * EcoLoop Central Reward & Weight Estimation Configuration
 *
 * All rates and typical item weights are centrally defined here
 * so administrators can adjust them without modifying calculation logic.
 */

import type { MaterialCategory, ItemSubtype, SubtypeWeightConfig } from "../types/reward.ts";

/**
 * Prototype reward rates per kilogram in Bangladeshi Taka (BDT)
 */
export const REWARD_RATES_PER_KG: Record<MaterialCategory, number> = {
  plastic: 10, // ৳10 / kg
  metal: 20,   // ৳20 / kg
  paper: 5,    // ৳5 / kg
  organic: 2,  // ৳2 / kg
  general: 0,  // ৳0 / kg
};

/**
 * Currency and EcoPoints Conversion
 * 1 EcoPoint = ৳0.01 (1 poisha)
 * 100 EcoPoints = ৳1.00
 */
export const ECO_POINTS_PER_BDT = 100;
export const POISHA_PER_ECO_POINT = 1;

/**
 * Minimum redemption threshold
 * 1,000 EcoPoints = ৳10.00
 */
export const MIN_REDEMPTION_ECO_POINTS = 1000;
export const MIN_REDEMPTION_BDT = MIN_REDEMPTION_ECO_POINTS / ECO_POINTS_PER_BDT; // ৳10.00

/**
 * AI Confidence threshold for automatic reward crediting
 */
export const MIN_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Maximum estimated weight cap for a single roadside deposit (in grams)
 * Submissions exceeding this threshold are flagged for manual review.
 */
export const MAX_ESTIMATED_WEIGHT_GRAMS = 5000; // 5 kg

/**
 * Configurable typical estimated weights for item subtypes (in grams)
 * Note: A standard camera cannot measure physical weight; these are prototype averages.
 */
export const ITEM_SUBTYPES: Record<ItemSubtype, SubtypeWeightConfig> = {
  // --- PLASTIC ---
  pet_bottle_500ml: {
    id: "pet_bottle_500ml",
    category: "plastic",
    name: "500 ml PET Bottle",
    typicalWeightGrams: 15,
    binName: "Blue Bin — Plastic",
    description: "Standard single-serve water or soft-drink bottle (Mum, Spa, Pran, etc.)",
    brandExamples: ["Mum", "Spa", "Pran", "Kinley", "Fresh"],
  },
  pet_bottle_1l: {
    id: "pet_bottle_1l",
    category: "plastic",
    name: "1 L PET Bottle",
    typicalWeightGrams: 25,
    binName: "Blue Bin — Plastic",
    description: "Large 1L to 1.5L soft-drink or mineral water bottle (Mojo, RC, etc.)",
    brandExamples: ["Mojo", "RC Cola", "7Up", "Speed", "Fresh Large"],
  },
  plastic_wrapper: {
    id: "plastic_wrapper",
    category: "plastic",
    name: "Plastic Wrapper",
    typicalWeightGrams: 3,
    binName: "Blue Bin — Plastic",
    description: "Snack wrappers, biscuit packets, or food film",
  },
  plastic_cup: {
    id: "plastic_cup",
    category: "plastic",
    name: "Plastic Cup",
    typicalWeightGrams: 5,
    binName: "Blue Bin — Plastic",
    description: "Disposable clear plastic tea, lassi, or juice cup",
  },

  // --- METAL ---
  aluminium_can: {
    id: "aluminium_can",
    category: "metal",
    name: "Aluminium Can",
    typicalWeightGrams: 15,
    binName: "Yellow Bin — Metal",
    description: "Aluminium beverage drink can (soda, energy drink)",
    brandExamples: ["Mojo Can", "Coca-Cola Can", "Sprite Can", "Tiger Can"],
  },
  tin_can: {
    id: "tin_can",
    category: "metal",
    name: "Tin Can",
    typicalWeightGrams: 40,
    binName: "Yellow Bin — Metal",
    description: "Steel/tin food container, condensed milk tin, or fruit tin",
  },
  foil_container: {
    id: "foil_container",
    category: "metal",
    name: "Foil Container",
    typicalWeightGrams: 10,
    binName: "Yellow Bin — Metal",
    description: "Aluminium foil food takeaway container or pie plate",
  },

  // --- PAPER ---
  paper_cup: {
    id: "paper_cup",
    category: "paper",
    name: "Paper Cup",
    typicalWeightGrams: 10,
    binName: "Green Bin — Paper",
    description: "Disposable roadside tea cup or coffee cup",
  },
  cardboard_box_small: {
    id: "cardboard_box_small",
    category: "paper",
    name: "Small Cardboard Box",
    typicalWeightGrams: 100,
    binName: "Green Bin — Paper",
    description: "Small corrugated packaging carton or parcel box",
  },
  notebook: {
    id: "notebook",
    category: "paper",
    name: "Notebook",
    typicalWeightGrams: 250,
    binName: "Green Bin — Paper",
    description: "School notebook, khata, or reading booklet",
  },
  tissue_snack_carton: {
    id: "tissue_snack_carton",
    category: "paper",
    name: "Tissue/Snack Carton",
    typicalWeightGrams: 15,
    binName: "Green Bin — Paper",
    description: "Thin paperboard tissue box, biscuit box, or cereal carton",
  },

  // --- ORGANIC ---
  organic_waste: {
    id: "organic_waste",
    category: "organic",
    name: "Organic Waste",
    typicalWeightGrams: 50,
    binName: "Brown Bin — Organic",
    description: "Banana peel, fruit skin, vegetable leftover, or food scrap",
    brandExamples: ["Banana peel", "Fruit peel", "Vegetable leftover"],
  },

  // --- GENERAL / OTHER ---
  general_waste: {
    id: "general_waste",
    category: "general",
    name: "General Material",
    typicalWeightGrams: 0,
    binName: "Grey Bin — General",
    description: "Polythene, mixed non-recyclables, or unrecognized materials",
  },
  empty_background: {
    id: "empty_background",
    category: "general",
    name: "Empty Background / No Item",
    typicalWeightGrams: 0,
    binName: "Grey Bin — General",
    description: "Camera view with no waste item present",
  },
};

/**
 * Conservative Fallbacks when subtype cannot be identified confidently.
 * Rule: Never guess a high-value or high-weight subtype.
 */
export const CONSERVATIVE_FALLBACK_SUBTYPES: Record<MaterialCategory, ItemSubtype> = {
  plastic: "plastic_wrapper",     // 3 g (lowest non-zero plastic)
  metal: "foil_container",        // 10 g (lowest metal)
  paper: "paper_cup",             // 10 g (conservative paper)
  organic: "organic_waste",       // 50 g
  general: "general_waste",       // 0 g
};
