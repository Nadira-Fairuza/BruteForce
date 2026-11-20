import test from "node:test";
import assert from "node:assert/strict";

import { YOLO_CLASS_MAP, mapYoloClass } from "../src/lib/yoloMapping.ts";

test("Every YOLO class maps to a category, subtype and recyclable flag", () => {
  assert.equal(YOLO_CLASS_MAP.plastic_bottle.category, "plastic");
  assert.equal(YOLO_CLASS_MAP.plastic_bottle.subtype, "pet_bottle_500ml");
  assert.equal(YOLO_CLASS_MAP.aluminum_can.category, "metal");
  assert.equal(YOLO_CLASS_MAP.aluminum_can.subtype, "aluminium_can");
  assert.equal(YOLO_CLASS_MAP.glass.category, "glass");
  assert.equal(YOLO_CLASS_MAP.glass.subtype, "glass_bottle");
  assert.equal(YOLO_CLASS_MAP.paper_cardboard.category, "paper");
  assert.equal(YOLO_CLASS_MAP.paper_cardboard.subtype, "cardboard_box_small");
  assert.equal(YOLO_CLASS_MAP.e_waste.category, "ewaste");
  assert.equal(YOLO_CLASS_MAP.e_waste.subtype, "ewaste_general");
  assert.equal(YOLO_CLASS_MAP.non_recyclable.category, "general");
  assert.equal(YOLO_CLASS_MAP.non_recyclable.subtype, "general_waste");
  assert.equal(YOLO_CLASS_MAP.non_recyclable.recyclable, false);
});

test("Only non_recyclable is non-recyclable", () => {
  for (const [name, mapping] of Object.entries(YOLO_CLASS_MAP)) {
    assert.equal(mapping.recyclable, name !== "non_recyclable", name);
  }
});

test("Mapping is case/whitespace tolerant and rejects unknown classes", () => {
  assert.equal(mapYoloClass("Glass")?.category, "glass");
  assert.equal(mapYoloClass("  E_Waste  ")?.category, "ewaste");
  assert.equal(mapYoloClass("plastic_bottle"), YOLO_CLASS_MAP.plastic_bottle);
  assert.equal(mapYoloClass("plastic bottle")?.category, "plastic");
  assert.equal(mapYoloClass(null), null);
  assert.equal(mapYoloClass(""), null);
  assert.equal(mapYoloClass("unobtainium"), null);
});
