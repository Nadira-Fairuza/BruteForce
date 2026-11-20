import test from "node:test";
import assert from "node:assert/strict";

import { REWARD_RATES_PER_KG, ITEM_SUBTYPES, CONSERVATIVE_FALLBACK_SUBTYPES } from "../src/lib/rewardConfig.ts";

test("Glass and e-waste are real categories with rates and subtypes", () => {
  assert.equal(REWARD_RATES_PER_KG.glass, 5);
  assert.equal(REWARD_RATES_PER_KG.ewaste, 25);

  const glass = ITEM_SUBTYPES.glass_bottle;
  assert.equal(glass.category, "glass");
  assert.equal(glass.typicalWeightGrams, 300);

  const ewaste = ITEM_SUBTYPES.ewaste_general;
  assert.equal(ewaste.category, "ewaste");
  assert.equal(ewaste.typicalWeightGrams, 120);
});

test("Conservative fallbacks exist for the two new categories", () => {
  assert.equal(CONSERVATIVE_FALLBACK_SUBTYPES.glass, "glass_bottle");
  assert.equal(CONSERVATIVE_FALLBACK_SUBTYPES.ewaste, "ewaste_general");
});
