import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateEcoPoints,
  calculateEcoLoopReward,
  ecoPointsToBdt,
  formatRewardDisplay,
} from "../src/lib/rewardCalculator.ts";

import {
  REWARD_RATES_PER_KG,
  ITEM_SUBTYPES,
  ECO_POINTS_PER_BDT,
  MIN_REDEMPTION_ECO_POINTS,
  MIN_CONFIDENCE_THRESHOLD,
  CONSERVATIVE_FALLBACK_SUBTYPES,
} from "../src/lib/rewardConfig.ts";

import {
  normalizeMaterialCategory,
  isEmptyBackground,
} from "../src/lib/materialNormalizer.ts";

import { estimateItemWeight } from "../src/lib/weightEstimator.ts";

test("1. Rates Configuration Check", () => {
  assert.equal(REWARD_RATES_PER_KG.plastic, 10);
  assert.equal(REWARD_RATES_PER_KG.metal, 20);
  assert.equal(REWARD_RATES_PER_KG.paper, 5);
  assert.equal(REWARD_RATES_PER_KG.organic, 2);
  assert.equal(REWARD_RATES_PER_KG.general, 0);

  assert.equal(ECO_POINTS_PER_BDT, 100);
  assert.equal(MIN_REDEMPTION_ECO_POINTS, 1000);
  assert.equal(MIN_CONFIDENCE_THRESHOLD, 0.6);
});

test("Case 1: 500 ml PET bottle -> 15 points (৳0.15)", () => {
  const result = calculateEcoLoopReward({
    material: "plastic",
    subtype: "pet_bottle_500ml",
    confidenceScore: 0.95,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.material, "plastic");
  assert.equal(result.subtype, "pet_bottle_500ml");
  assert.equal(result.estimatedWeightGrams, 15);
  assert.equal(result.rewardRatePerKg, 10);
  assert.equal(result.ecoPoints, 15);
  assert.equal(result.rewardBdt, 0.15);
  assert.equal(result.isEstimate, true);
});

test("Case 1b: 500 ml PET bottle auto-inferred from brand 'Mum Water'", () => {
  const result = calculateEcoLoopReward({
    material: "Mum water bottle 500ml",
    confidenceScore: 0.92,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "pet_bottle_500ml");
  assert.equal(result.estimatedWeightGrams, 15);
  assert.equal(result.ecoPoints, 15);
});

test("Case 2: 1 L PET bottle -> 25 points (৳0.25)", () => {
  const result = calculateEcoLoopReward({
    material: "plastic",
    subtype: "pet_bottle_1l",
    confidenceScore: 0.92,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "pet_bottle_1l");
  assert.equal(result.estimatedWeightGrams, 25);
  assert.equal(result.ecoPoints, 25);
  assert.equal(result.rewardBdt, 0.25);
});

test("Case 2b: 1 L bottle auto-inferred from brand 'Mojo 1L'", () => {
  const result = calculateEcoLoopReward({
    material: "Mojo large soft drink 1L bottle",
    confidenceScore: 0.94,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "pet_bottle_1l");
  assert.equal(result.estimatedWeightGrams, 25);
  assert.equal(result.ecoPoints, 25);
});

test("Case 3: Aluminium can -> 30 points (৳0.30)", () => {
  const result = calculateEcoLoopReward({
    material: "metal",
    subtype: "aluminium_can",
    confidenceScore: 0.95,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.material, "metal");
  assert.equal(result.subtype, "aluminium_can");
  assert.equal(result.estimatedWeightGrams, 15);
  assert.equal(result.rewardRatePerKg, 20);
  assert.equal(result.ecoPoints, 30);
  assert.equal(result.rewardBdt, 0.30);
});

test("Case 4: Tin can -> 80 points (৳0.80)", () => {
  const result = calculateEcoLoopReward({
    material: "metal",
    subtype: "tin_can",
    confidenceScore: 0.91,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "tin_can");
  assert.equal(result.estimatedWeightGrams, 40);
  assert.equal(result.rewardRatePerKg, 20);
  assert.equal(result.ecoPoints, 80);
  assert.equal(result.rewardBdt, 0.80);
});

test("Case 5: Paper cup -> 5 points (৳0.05)", () => {
  const result = calculateEcoLoopReward({
    material: "paper",
    subtype: "paper_cup",
    confidenceScore: 0.89,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.material, "paper");
  assert.equal(result.subtype, "paper_cup");
  assert.equal(result.estimatedWeightGrams, 10);
  assert.equal(result.rewardRatePerKg, 5);
  assert.equal(result.ecoPoints, 5);
  assert.equal(result.rewardBdt, 0.05);
});

test("Case 6: Notebook (250g) -> 125 points (৳1.25)", () => {
  const result = calculateEcoLoopReward({
    material: "paper",
    subtype: "notebook",
    confidenceScore: 0.94,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "notebook");
  assert.equal(result.estimatedWeightGrams, 250);
  assert.equal(result.rewardRatePerKg, 5);
  assert.equal(result.ecoPoints, 125);
  assert.equal(result.rewardBdt, 1.25);
});

test("Case 7: Organic waste (50 g) -> 10 points (৳0.10)", () => {
  const result = calculateEcoLoopReward({
    material: "organic banana peel",
    confidenceScore: 0.95,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.material, "organic");
  assert.equal(result.subtype, "organic_waste");
  assert.equal(result.estimatedWeightGrams, 50);
  assert.equal(result.rewardRatePerKg, 2);
  assert.equal(result.ecoPoints, 10);
  assert.equal(result.rewardBdt, 0.10);
});

test("Case 8: General material -> 0 points (৳0.00)", () => {
  const result = calculateEcoLoopReward({
    material: "general waste polythene scrap",
    confidenceScore: 0.95,
  });

  assert.equal(result.success, true);
  assert.equal(result.eligible, false);
  assert.equal(result.material, "general");
  assert.equal(result.ecoPoints, 0);
  assert.equal(result.rewardBdt, 0);
});

test("Case 9: Empty background -> strictly rejected", () => {
  const empty1 = calculateEcoLoopReward({
    material: "empty background",
    confidenceScore: 0.98,
  });
  assert.equal(empty1.success, false);
  assert.equal(empty1.eligible, false);
  assert.equal(empty1.ecoPoints, 0);
  assert.match(empty1.reason || "", /Empty background detected/);

  const empty2 = calculateEcoLoopReward({
    material: "no item",
    confidenceScore: 0.99,
  });
  assert.equal(empty2.success, false);
  assert.equal(empty2.eligible, false);
  assert.equal(empty2.ecoPoints, 0);
});

test("Case 10: Low-confidence prediction (< 60%) -> review/selection required, 0 points", () => {
  const lowConf = calculateEcoLoopReward({
    material: "plastic",
    subtype: "pet_bottle_500ml",
    confidenceScore: 0.45,
  });

  assert.equal(lowConf.success, true);
  assert.equal(lowConf.eligible, false);
  assert.equal(lowConf.ecoPoints, 0);
  assert.equal(lowConf.rewardBdt, 0);
  assert.equal(lowConf.requiresReview, true);
  assert.match(lowConf.reason || "", /below the 60% threshold/);

  // When user verifies the item, low confidence is resolved
  const verified = calculateEcoLoopReward({
    material: "plastic",
    subtype: "pet_bottle_500ml",
    confidenceScore: 0.45,
    isVerified: true,
  });
  assert.equal(verified.eligible, true);
  assert.equal(verified.ecoPoints, 15);
});

test("Case 11: Invalid weight -> rejected", () => {
  // Negative weight
  const resNeg = calculateEcoLoopReward({
    material: "plastic",
    manualWeightGrams: -15,
    confidenceScore: 0.95,
  });
  assert.equal(resNeg.success, false);
  assert.equal(resNeg.eligible, false);
  assert.equal(resNeg.ecoPoints, 0);

  // Zero weight
  const resZero = calculateEcoLoopReward({
    material: "plastic",
    manualWeightGrams: 0,
    confidenceScore: 0.95,
  });
  assert.equal(resZero.success, false);
  assert.equal(resZero.eligible, false);

  // NaN weight
  const resNaN = calculateEcoLoopReward({
    material: "plastic",
    manualWeightGrams: NaN,
    confidenceScore: 0.95,
  });
  assert.equal(resNaN.success, false);
  assert.equal(resNaN.eligible, false);

  // Infinite weight
  const resInf = calculateEcoLoopReward({
    material: "plastic",
    manualWeightGrams: Infinity,
    confidenceScore: 0.95,
  });
  assert.equal(resInf.success, false);
  assert.equal(resInf.eligible, false);
});

test("Case 12: Additional Subtypes verification", () => {
  // Plastic wrapper (3g @ ৳10/kg = 3 EcoPoints)
  const wrap = calculateEcoLoopReward({
    material: "plastic",
    subtype: "plastic_wrapper",
    confidenceScore: 0.92,
  });
  assert.equal(wrap.ecoPoints, 3);
  assert.equal(wrap.rewardBdt, 0.03);

  // Plastic cup (5g @ ৳10/kg = 5 EcoPoints)
  const cup = calculateEcoLoopReward({
    material: "plastic",
    subtype: "plastic_cup",
    confidenceScore: 0.90,
  });
  assert.equal(cup.ecoPoints, 5);
  assert.equal(cup.rewardBdt, 0.05);

  // Foil container (10g @ ৳20/kg = 20 EcoPoints)
  const foil = calculateEcoLoopReward({
    material: "metal",
    subtype: "foil_container",
    confidenceScore: 0.94,
  });
  assert.equal(foil.ecoPoints, 20);
  assert.equal(foil.rewardBdt, 0.20);

  // Small cardboard box (100g @ ৳5/kg = 50 EcoPoints)
  const box = calculateEcoLoopReward({
    material: "paper",
    subtype: "cardboard_box_small",
    confidenceScore: 0.91,
  });
  assert.equal(box.ecoPoints, 50);
  assert.equal(box.rewardBdt, 0.50);
});

test("Case 13: Conservative Fallbacks when subtype is ambiguous", () => {
  // Broad plastic falls back to wrapper (3g)
  const plasticFallback = calculateEcoLoopReward({
    material: "plastic",
    confidenceScore: 0.95,
  });
  assert.equal(plasticFallback.subtype, "plastic_wrapper");
  assert.equal(plasticFallback.estimatedWeightGrams, 3);
  assert.equal(plasticFallback.ecoPoints, 3);

  // Broad metal falls back to foil container (10g)
  const metalFallback = calculateEcoLoopReward({
    material: "metal",
    confidenceScore: 0.95,
  });
  assert.equal(metalFallback.subtype, "foil_container");
  assert.equal(metalFallback.estimatedWeightGrams, 10);
  assert.equal(metalFallback.ecoPoints, 20);

  // Broad paper falls back to paper cup (10g)
  const paperFallback = calculateEcoLoopReward({
    material: "paper",
    confidenceScore: 0.95,
  });
  assert.equal(paperFallback.subtype, "paper_cup");
  assert.equal(paperFallback.estimatedWeightGrams, 10);
  assert.equal(paperFallback.ecoPoints, 5);
});

test("Case 14: Conversion and Display helpers", () => {
  assert.equal(ecoPointsToBdt(100), 1.00);
  assert.equal(ecoPointsToBdt(15), 0.15);
  assert.equal(ecoPointsToBdt(125), 1.25);
  assert.equal(ecoPointsToBdt(1000), 10.00);

  const display = formatRewardDisplay(1500);
  assert.equal(display.pointsText, "1,500 EcoPoints");
  assert.equal(display.bdtText, "৳15.00");
});
