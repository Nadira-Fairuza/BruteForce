import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveScanDetection,
  allowManualConfirm,
  depositKey,
  DEMO_DETECTION,
} from "../src/lib/scanFallback.ts";

const TF_HIT = {
  materialType: "plastic",
  rawLabel: "plastic",
  confidenceScore: 0.8,
};

test("A frame with no item is reported, never paid as a fallback detection", () => {
  const outcome = resolveScanDetection(
    { status: "stop", message: "No item detected." },
    TF_HIT
  );
  assert.ok("message" in outcome);
  assert.equal(outcome.message, "No item detected.");
});

test("An unreadable/unknown frame is reported, never paid as a fallback detection", () => {
  for (const message of ["Unknown material class.", "Vision check could not read that frame."]) {
    const outcome = resolveScanDetection({ status: "stop", message }, TF_HIT);
    assert.ok("message" in outcome);
    assert.equal(outcome.message, message);
  }
});

test("A service outage still falls back to TF.js, then to the demo value", () => {
  const fromTf = resolveScanDetection({ status: "unavailable" }, TF_HIT);
  assert.ok("detection" in fromTf);
  assert.equal(fromTf.detection, TF_HIT);

  const fromDemo = resolveScanDetection({ status: "unavailable" }, null);
  assert.ok("detection" in fromDemo);
  assert.equal(fromDemo.detection, DEMO_DETECTION);
});

test("A real detection is always reported as-is", () => {
  const detection = {
    materialType: "glass",
    rawLabel: "glass",
    confidenceScore: 0.93,
    subtype: "glass_bottle",
  };
  const outcome = resolveScanDetection({ status: "detected", detection }, TF_HIT);
  assert.ok("detection" in outcome);
  assert.equal(outcome.detection, detection);
});

test("Confirm & Deposit cannot re-pay the item that was just auto-deposited", () => {
  const key = depositKey({ materialType: "plastic", subtype: "pet_bottle_500ml", confidenceScore: 0.94 });

  assert.equal(allowManualConfirm(null, key), true); // nothing deposited yet
  assert.equal(allowManualConfirm(key, key), false); // same item -> blocked
  assert.equal(
    allowManualConfirm(key, depositKey({ materialType: "plastic", subtype: "plastic_wrapper", confidenceScore: 0.94 })),
    true // user picked a different subtype -> allowed
  );
});
