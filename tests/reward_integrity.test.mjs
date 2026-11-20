import test from "node:test";
import assert from "node:assert/strict";

import { estimateItemWeight } from "../src/lib/weightEstimator.ts";
import { calculateEcoLoopReward } from "../src/lib/rewardCalculator.ts";

test("A subtype from a different category is ignored, not trusted", () => {
  // Client sent material=plastic but subtype=glass_bottle (300 g).
  // Trusting it would pay 300 g at the plastic rate.
  const estimation = estimateItemWeight("plastic", "plastic", "glass_bottle", 0.95);
  assert.equal(estimation.category, "plastic");
  assert.equal(estimation.subtype, "plastic_wrapper");
  assert.equal(estimation.estimatedWeightGrams, 3);
});

test("calculateEcoLoopReward does not pay a cross-category subtype", () => {
  const result = calculateEcoLoopReward({
    material: "plastic",
    subtype: "glass_bottle",
    confidenceScore: 0.95,
  });
  assert.equal(result.material, "plastic");
  assert.equal(result.subtype, "plastic_wrapper");
  assert.equal(result.estimatedWeightGrams, 3);
  assert.equal(result.ecoPoints, 3);
});

test("A matching subtype is still honoured", () => {
  const estimation = estimateItemWeight("glass", "glass", "glass_bottle", 0.95);
  assert.equal(estimation.subtype, "glass_bottle");
  assert.equal(estimation.estimatedWeightGrams, 300);
});

test("An AI-inferred subtype is not recorded as user verified", () => {
  const result = calculateEcoLoopReward({
    material: "glass",
    subtype: "glass_bottle",
    confidenceScore: 0.95,
  });
  assert.equal(result.verificationStatus, "ai_inferred");
});

test("An explicit human verification is still recorded as user verified", () => {
  const result = calculateEcoLoopReward({
    material: "glass",
    subtype: "glass_bottle",
    confidenceScore: 0.95,
    isVerified: true,
  });
  assert.equal(result.verificationStatus, "user_verified");
});
