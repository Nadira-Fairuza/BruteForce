import test from "node:test";
import assert from "node:assert/strict";

import { normalizeMaterialCategory } from "../src/lib/materialNormalizer.ts";
import { estimateItemWeight } from "../src/lib/weightEstimator.ts";
import { calculateEcoLoopReward } from "../src/lib/rewardCalculator.ts";

test("Glass never normalizes to plastic", () => {
  assert.equal(normalizeMaterialCategory("glass"), "glass");
  assert.equal(normalizeMaterialCategory("glass_bottle"), "glass");
  assert.equal(normalizeMaterialCategory("Glass Bottle"), "glass");
  assert.equal(normalizeMaterialCategory("glass jar"), "glass");
});

test("E-waste normalizes to ewaste", () => {
  assert.equal(normalizeMaterialCategory("e_waste"), "ewaste");
  assert.equal(normalizeMaterialCategory("ewaste"), "ewaste");
  assert.equal(normalizeMaterialCategory("e-waste"), "ewaste");
  assert.equal(normalizeMaterialCategory("electronic waste"), "ewaste");
});

test("A glass label never resolves to the plastic cup subtype", () => {
  const estimation = estimateItemWeight("glass");
  assert.equal(estimation.category, "glass");
  assert.equal(estimation.subtype, "glass_bottle");
  assert.equal(estimation.estimatedWeightGrams, 300);
});

test("Glass pays the glass rate, not the plastic rate", () => {
  const result = calculateEcoLoopReward({ material: "glass", confidenceScore: 0.95 });
  assert.equal(result.material, "glass");
  assert.equal(result.subtype, "glass_bottle");
  assert.equal(result.rewardRatePerKg, 5);
  // 300 g * ৳5/kg = 150 EcoPoints = ৳1.50
  assert.equal(result.ecoPoints, 150);
  assert.equal(result.rewardBdt, 1.5);
});

test("E-waste pays the ewaste rate", () => {
  const result = calculateEcoLoopReward({ material: "e_waste", confidenceScore: 0.95 });
  assert.equal(result.material, "ewaste");
  assert.equal(result.subtype, "ewaste_general");
  assert.equal(result.rewardRatePerKg, 25);
  // 120 g * ৳25/kg = 300 EcoPoints = ৳3.00
  assert.equal(result.ecoPoints, 300);
  assert.equal(result.rewardBdt, 3.0);
});
