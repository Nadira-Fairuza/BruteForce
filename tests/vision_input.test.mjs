import test from "node:test";
import assert from "node:assert/strict";

import { mapYoloClass, toConfidence } from "../src/lib/yoloMapping.ts";

test("Non-string class labels are rejected instead of throwing", () => {
  for (const garbage of [123, {}, ["glass"], true, null, undefined]) {
    assert.equal(mapYoloClass(garbage), null);
  }
});

test("Classifier confidence is coerced to a finite number in [0,1]", () => {
  assert.equal(toConfidence(0.93), 0.93);
  assert.equal(toConfidence(0), 0);
  assert.equal(toConfidence("0.2"), 0.2);
  assert.equal(toConfidence(1.4), 1);
  assert.equal(toConfidence(-0.4), 0);
});

test("Garbage confidence becomes 0 (never the 0.9 auto-pass default)", () => {
  for (const garbage of ["abc", "", {}, null, undefined, NaN, Infinity, false]) {
    assert.equal(toConfidence(garbage), 0);
  }
});
