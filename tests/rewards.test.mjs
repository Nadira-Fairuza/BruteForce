import test from "node:test";
import assert from "node:assert/strict";

// Import reward engine
import {
  calculateReward,
  getRewardForMaterial,
  normalizeMaterial,
  resolveSubtype,
  SUBTYPE_CONFIGS,
  CONSERVATIVE_FALLBACK_SUBTYPES,
  DEFAULT_REWARD_SHARE,
  HACKATHON_REWARD_SHARE_PERCENT,
  MIN_CONFIDENCE_THRESHOLD,
  formatBdt,
  roundToDecimals,
} from "../src/lib/rewards.ts";

test("Reward Share and Benchmark Configuration", () => {
  assert.equal(HACKATHON_REWARD_SHARE_PERCENT, 20);
  assert.equal(DEFAULT_REWARD_SHARE, 0.2);
  assert.equal(MIN_CONFIDENCE_THRESHOLD, 0.6);

  // E-Vangariwala benchmark rates:
  assert.equal(SUBTYPE_CONFIGS.pet_bottles.marketRateBdtPerKg, 18);
  assert.equal(SUBTYPE_CONFIGS.hard_plastic.marketRateBdtPerKg, 10);
  assert.equal(SUBTYPE_CONFIGS.cardboard.marketRateBdtPerKg, 8);
  assert.equal(SUBTYPE_CONFIGS.newspapers_books.marketRateBdtPerKg, 12);
  assert.equal(SUBTYPE_CONFIGS.white_office_paper.marketRateBdtPerKg, 15);
  assert.equal(SUBTYPE_CONFIGS.aluminium.marketRateBdtPerKg, 140);
  assert.equal(SUBTYPE_CONFIGS.cast_iron.marketRateBdtPerKg, 35);
  assert.equal(SUBTYPE_CONFIGS.mixed_steel.marketRateBdtPerKg, 28);
  assert.equal(SUBTYPE_CONFIGS.copper_wire.marketRateBdtPerKg, 850);

  // Copper wire, glass, and e-waste MUST be disabled awaiting team approval
  assert.equal(SUBTYPE_CONFIGS.copper_wire.enabled, false);
  assert.equal(SUBTYPE_CONFIGS.glass_bottles.enabled, false);
  assert.equal(SUBTYPE_CONFIGS.general_ewaste.enabled, false);
});

test("Example 1: 2.5 kg PET bottles at 18 BDT/kg and 20% share = 9.00 BDT", () => {
  const result = calculateReward("plastic", 2.5, 0.95, { subtype: "pet_bottles" });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.material, "plastic");
  assert.equal(result.subtype, "pet_bottles");
  assert.equal(result.weightKg, 2.5);
  assert.equal(result.marketRateBdtPerKg, 18);
  assert.equal(result.rewardShare, 0.2);
  assert.equal(result.rewardRateBdtPerKg, 3.6);
  assert.equal(result.rewardBdt, 9.0);
  assert.equal(formatBdt(result.rewardBdt), "৳9.00");
  assert.equal(result.isDesignAssumption, true);
});

test("Example 1b: 2.5 kg PET auto-inferred from raw label", () => {
  const result = calculateReward("crushed pet bottle", 2.5, 0.92);

  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "pet_bottles");
  assert.equal(result.rewardBdt, 9.0);
  assert.equal(result.verificationStatus, "ai_inferred");
});

test("Example 2: 1.0 kg hard plastic at 10 BDT/kg and 20% share = 2.00 BDT", () => {
  const result = calculateReward("plastic", 1.0, 0.9, { subtype: "hard_plastic" });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "hard_plastic");
  assert.equal(result.marketRateBdtPerKg, 10);
  assert.equal(result.rewardRateBdtPerKg, 2.0);
  assert.equal(result.rewardBdt, 2.0);
  assert.equal(formatBdt(result.rewardBdt), "৳2.00");
});

test("Example 3: 3.0 kg cardboard at 8 BDT/kg and 20% share = 4.80 BDT", () => {
  const result = calculateReward("paper", 3.0, 0.88, { subtype: "cardboard" });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "cardboard");
  assert.equal(result.marketRateBdtPerKg, 8);
  assert.equal(result.rewardRateBdtPerKg, 1.6);
  assert.equal(result.rewardBdt, 4.8);
  assert.equal(formatBdt(result.rewardBdt), "৳4.80");
});

test("Example 4: 2.0 kg white office paper at 15 BDT/kg and 20% share = 6.00 BDT", () => {
  const result = calculateReward("paper", 2.0, 0.91, { subtype: "white_office_paper" });

  assert.equal(result.success, true);
  assert.equal(result.eligible, true);
  assert.equal(result.subtype, "white_office_paper");
  assert.equal(result.marketRateBdtPerKg, 15);
  assert.equal(result.rewardRateBdtPerKg, 3.0);
  assert.equal(result.rewardBdt, 6.0);
  assert.equal(formatBdt(result.rewardBdt), "৳6.00");
});

test("Confidence threshold: Low confidence below 60% yields zero/ineligible reward", () => {
  // Exactly 59% (below 60%)
  const res1 = calculateReward("plastic", 2.5, 0.59, { subtype: "pet_bottles" });
  assert.equal(res1.eligible, false);
  assert.equal(res1.rewardBdt, 0);
  assert.match(res1.reason || "", /below the 60% minimum threshold/);

  // 45% confidence
  const res2 = calculateReward("metal", 1.0, 0.45, { subtype: "aluminium" });
  assert.equal(res2.eligible, false);
  assert.equal(res2.rewardBdt, 0);

  // 0% confidence
  const res3 = calculateReward("paper", 1.0, 0.0);
  assert.equal(res3.eligible, false);
  assert.equal(res3.rewardBdt, 0);

  // Negative confidence (clamped to 0)
  const res4 = calculateReward("paper", 1.0, -0.5);
  assert.equal(res4.eligible, false);
  assert.equal(res4.rewardBdt, 0);

  // Exactly 60% confidence is eligible
  const res5 = calculateReward("plastic", 1.0, 0.6, { subtype: "hard_plastic" });
  assert.equal(res5.eligible, true);
  assert.equal(res5.rewardBdt, 2.0);
});

test("Weight validation: Zero, negative, NaN and infinite weight are rejected", () => {
  // Zero weight
  const resZero = calculateReward("plastic", 0, 0.95);
  assert.equal(resZero.success, false);
  assert.equal(resZero.eligible, false);
  assert.equal(resZero.rewardBdt, 0);
  assert.match(resZero.reason || "", /strictly greater than 0 kg/);

  // Negative weight
  const resNeg = calculateReward("plastic", -2.5, 0.95);
  assert.equal(resNeg.success, false);
  assert.equal(resNeg.eligible, false);
  assert.equal(resNeg.rewardBdt, 0);

  // NaN weight
  const resNaN = calculateReward("plastic", NaN, 0.95);
  assert.equal(resNaN.success, false);
  assert.equal(resNaN.eligible, false);
  assert.equal(resNaN.rewardBdt, 0);

  // Positive Infinity
  const resInf = calculateReward("plastic", Infinity, 0.95);
  assert.equal(resInf.success, false);
  assert.equal(resInf.eligible, false);
  assert.equal(resInf.rewardBdt, 0);

  // Negative Infinity
  const resNegInf = calculateReward("plastic", -Infinity, 0.95);
  assert.equal(resNegInf.success, false);
  assert.equal(resNegInf.eligible, false);
  assert.equal(resNegInf.rewardBdt, 0);

  // String weight passed improperly
  // @ts-expect-error Testing runtime invalid input
  const resStr = calculateReward("plastic", "two", 0.95);
  assert.equal(resStr.success, false);
  assert.equal(resStr.eligible, false);
  assert.equal(resStr.rewardBdt, 0);
});

test("Material validation: Unknown material yields no reward", () => {
  const result = calculateReward("unknown_material_xyz", 5.0, 0.95);
  assert.equal(result.success, false);
  assert.equal(result.eligible, false);
  assert.equal(result.rewardBdt, 0);
  assert.match(result.reason || "", /Unrecognized waste material/);
});

test("General waste: Always yields 0 BDT reward", () => {
  const result = calculateReward("general", 10.0, 0.95);
  assert.equal(result.success, true);
  assert.equal(result.eligible, false);
  assert.equal(result.rewardBdt, 0);
  assert.match(result.reason || "", /earns no cash reward/);
});

test("Disabled materials: Copper wire, glass, and e-waste earn 0 BDT awaiting team approval", () => {
  // Copper wire is configured at 850 BDT/kg but MUST NOT be enabled for citizen payout
  const copper = calculateReward("copper wire", 1.0, 0.95);
  assert.equal(copper.eligible, false);
  assert.equal(copper.rewardBdt, 0);
  assert.match(copper.reason || "", /Disabled/);

  // Glass bottles
  const glass = calculateReward("glass", 2.0, 0.95, { subtype: "glass_bottles" });
  assert.equal(glass.eligible, false);
  assert.equal(glass.rewardBdt, 0);
  assert.match(glass.reason || "", /Disabled/);

  // E-waste
  const ewaste = calculateReward("ewaste", 1.0, 0.95, { subtype: "general_ewaste" });
  assert.equal(ewaste.eligible, false);
  assert.equal(ewaste.rewardBdt, 0);
  assert.match(ewaste.reason || "", /Disabled/);
});

test("Conservative Fallback: Never guesses high-value subtype on broad AI category", () => {
  // Broad plastic falls back to hard plastic (10 BDT/kg -> 2 BDT/kg), NOT PET (18 BDT/kg -> 3.60 BDT/kg)
  const plasticFallback = calculateReward("plastic", 1.0, 0.95);
  assert.equal(plasticFallback.subtype, "hard_plastic");
  assert.equal(plasticFallback.rewardRateBdtPerKg, 2.0);
  assert.equal(plasticFallback.verificationStatus, "conservative_fallback");

  // Broad metal falls back to mixed steel (28 BDT/kg -> 5.60 BDT/kg), NOT aluminium (140 BDT/kg) or copper (850)
  const metalFallback = calculateReward("metal", 1.0, 0.95);
  assert.equal(metalFallback.subtype, "mixed_steel");
  assert.equal(metalFallback.rewardRateBdtPerKg, 5.6);
  assert.equal(metalFallback.verificationStatus, "conservative_fallback");

  // Broad paper falls back to cardboard (8 BDT/kg -> 1.60 BDT/kg), NOT white paper (15 BDT/kg)
  const paperFallback = calculateReward("paper", 1.0, 0.95);
  assert.equal(paperFallback.subtype, "cardboard");
  assert.equal(paperFallback.rewardRateBdtPerKg, 1.6);
  assert.equal(paperFallback.verificationStatus, "conservative_fallback");
});

test("Subtype resolution helper", () => {
  // Explicit verified subtype
  const explicit = resolveSubtype("plastic", "plastic", "pet_bottles");
  assert.equal(explicit.subtype, "pet_bottles");
  assert.equal(explicit.verificationStatus, "verified");

  // Keyword inferred
  const can = resolveSubtype("aluminum beverage can", "metal");
  assert.equal(can.subtype, "aluminium");
  assert.equal(can.verificationStatus, "ai_inferred");

  // Ambiguous term falls back conservatively
  const ambig = resolveSubtype("general scrap piece", "metal");
  assert.equal(ambig.subtype, "mixed_steel");
  assert.equal(ambig.verificationStatus, "conservative_fallback");
});

test("Backwards Compatibility: getRewardForMaterial and normalizeMaterial", () => {
  // getRewardForMaterial defaults to 1 kg weight
  assert.equal(getRewardForMaterial("plastic", 0.95), 2.0); // hard_plastic fallback 2 BDT
  assert.equal(getRewardForMaterial("plastic", 0.45), 0); // below 60% confidence
  assert.equal(getRewardForMaterial("metal", 0.95), 5.6); // mixed_steel fallback 5.60 BDT
  assert.equal(getRewardForMaterial("paper", 0.95), 1.6); // cardboard fallback 1.60 BDT
  assert.equal(getRewardForMaterial("general", 0.95), 0);

  // Custom weight parameter
  assert.equal(getRewardForMaterial("plastic", 0.95, 2.5), 5.0); // 2.5 * 2.0 = 5.00

  // normalizeMaterial
  assert.equal(normalizeMaterial("crushed PET bottle"), "plastic");
  assert.equal(normalizeMaterial("aluminum soft drink can"), "metal");
  assert.equal(normalizeMaterial("carton box paper"), "paper");
  assert.equal(normalizeMaterial("dirty food packaging"), "general");
});

test("Floating point safety: roundToDecimals", () => {
  // 0.1 + 0.2 floating point anomaly
  const floatSum = 0.1 + 0.2;
  assert.notEqual(floatSum, 0.3); // JS float anomaly
  assert.equal(roundToDecimals(floatSum, 2), 0.3);

  // Exact paisa rounding
  assert.equal(roundToDecimals(2.5 * 3.6, 2), 9.0);
  assert.equal(roundToDecimals(3.0 * 1.6, 2), 4.8);
});

test("Metals: Aluminium, Cast Iron, and Mixed Steel calculations", () => {
  // Aluminium: 140 BDT/kg * 20% = 28 BDT/kg; 0.5 kg = 14.00 BDT
  const alu = calculateReward("aluminum can", 0.5, 0.95);
  assert.equal(alu.subtype, "aluminium");
  assert.equal(alu.marketRateBdtPerKg, 140);
  assert.equal(alu.rewardRateBdtPerKg, 28);
  assert.equal(alu.rewardBdt, 14.0);

  // Cast Iron: 35 BDT/kg * 20% = 7 BDT/kg; 2 kg = 14.00 BDT
  const iron = calculateReward("metal", 2.0, 0.95, { subtype: "cast_iron" });
  assert.equal(iron.subtype, "cast_iron");
  assert.equal(iron.marketRateBdtPerKg, 35);
  assert.equal(iron.rewardRateBdtPerKg, 7);
  assert.equal(iron.rewardBdt, 14.0);

  // Mixed Steel: 28 BDT/kg * 20% = 5.60 BDT/kg; 1.5 kg = 8.40 BDT
  const steel = calculateReward("tin can sheet steel", 1.5, 0.95);
  assert.equal(steel.subtype, "mixed_steel");
  assert.equal(steel.marketRateBdtPerKg, 28);
  assert.equal(steel.rewardRateBdtPerKg, 5.6);
  assert.equal(steel.rewardBdt, 8.4);
});

test("Paper: Newspapers and books calculation", () => {
  // Newspapers/books: 12 BDT/kg * 20% = 2.40 BDT/kg; 4 kg = 9.60 BDT
  const paper = calculateReward("old newspaper book", 4.0, 0.92);
  assert.equal(paper.subtype, "newspapers_books");
  assert.equal(paper.marketRateBdtPerKg, 12);
  assert.equal(paper.rewardRateBdtPerKg, 2.4);
  assert.equal(paper.rewardBdt, 9.6);
});

test("Custom reward share option: Verifies configurability for team review", () => {
  // Team tests a 25% share instead of 20%
  const customRes = calculateReward("plastic", 2.0, 0.95, {
    subtype: "pet_bottles",
    customShare: 0.25,
  });
  // 18 * 0.25 = 4.50 BDT/kg; 2 kg = 9.00 BDT
  assert.equal(customRes.rewardShare, 0.25);
  assert.equal(customRes.rewardRateBdtPerKg, 4.5);
  assert.equal(customRes.rewardBdt, 9.0);

  // Team tests a 15% share
  const custom15 = calculateReward("plastic", 2.0, 0.95, {
    subtype: "pet_bottles",
    customShare: 0.15,
  });
  // 18 * 0.15 = 2.70 BDT/kg; 2 kg = 5.40 BDT
  assert.equal(custom15.rewardShare, 0.15);
  assert.equal(custom15.rewardRateBdtPerKg, 2.7);
  assert.equal(custom15.rewardBdt, 5.4);
});
