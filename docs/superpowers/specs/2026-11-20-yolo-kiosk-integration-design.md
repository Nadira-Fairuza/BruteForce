# YOLO → EcoSort kiosk integration — design

Date: 2026-11-20
Status: implemented 2026-11-20 (appended decisions below)

## Intent

The hackathon bin must decide, from a camera frame, whether a waste item is
recyclable and pay a BDT reward. The trained detector is a 6-class YOLO model
(`plastic_bottle, aluminum_can, glass, paper_cardboard, e_waste, non_recyclable`)
served by the FastAPI `/classify` endpoint from the bin-yolo runbook.

This document covers only the **app side** (BruteForce). The AI side — accounts,
datasets, photos, training, `best.onnx`, the FastAPI service — is the human's
part and already specified by `bin-yolo/AGENTS.md`.

## Goals

- The kiosk's "Scan Trash Item" button uses the YOLO service instead of the
  in-browser Teachable Machine model.
- Every YOLO class maps to one of the app's material categories and pays the
  right rate; `glass` and `e_waste` become real categories.
- Rewards are still calculated server-side by the existing `/api/scan`; the
  browser never sends an amount.
- The kiosk still works with no YOLO service (fallback), so demo day cannot
  be sunk by a dead service.

## Non-goals

- Training the model, exporting ONNX, or running the FastAPI service.
- Changing the reward formula, EcoPoints conversion, redemption flow, or DB
  schema.
- Handling two items in one frame (the model returns the single best detection;
  the bin takes one item at a time).

## Anti-goals

- No client-side reward math that `/api/scan` would trust.
- No new category without a rate, a typical weight and a bin.
- No silent fallback that reports a wrong material as a pass.

## Constraints

- Next.js 16 (App Router) with breaking changes — read
  `node_modules/next/dist/docs/` before writing app code (repo `AGENTS.md`).
- The `/classify` contract is fixed:
  `{material, recyclable, confidence, bbox, eligible_for_reward, reason}`.
- Secrets/config via env: `VISION_API_URL` (default `http://127.0.0.1:8000`).
- Existing `npm test` must keep passing.

## Approaches considered

1. **Server route `/api/vision` (chosen).** Kiosk posts the frame to Next.js;
   the route calls `/classify`, maps the class, returns the app category +
   raw label + confidence; the kiosk then calls the unchanged `/api/scan`.
   - Pros: mapping and the service URL stay server-side; no CORS; reward path
     untouched; easy to stub for tests.
   - Cons: one extra hop.
2. **Kiosk calls `/classify` directly, then `/api/scan`.**
   - Pros: fewer parts. Cons: exposes the service URL and timeout to the
     browser, and the class→category map would live in the client.
3. **Run the ONNX in-browser (onnxruntime-web).**
   - Cons: new dependency, no FastAPI needed but a second inference path to
     maintain; not what the runbook specifies.

Approach 1 is the only one that keeps the reward path trusted and the service
server-side, so it is the plan.

## Decisions

### Categories and mapping

`MaterialCategory` becomes
`"plastic" | "metal" | "paper" | "organic" | "glass" | "ewaste" | "general"`.

| YOLO class        | app category | subtype           | recyclable |
|-------------------|--------------|-------------------|------------|
| plastic_bottle    | plastic      | pet_bottle_500ml  | yes        |
| aluminum_can      | metal        | aluminium_can     | yes        |
| glass             | glass        | glass_bottle      | yes        |
| paper_cardboard   | paper        | cardboard_box_small | yes      |
| e_waste           | ewaste       | ewaste_general    | yes        |
| non_recyclable    | general      | general_waste     | no         |

The map lives in `src/lib/yoloMapping.ts`, used by `/api/vision`.

### Rates, weights, bins (prototype defaults — configurable)

- glass: ৳5/kg, `glass_bottle` 300 g, "Cyan Bin — Glass".
- ewaste: ৳25/kg, `ewaste_general` 120 g, "Violet Bin — E-Waste".

These are my call; they live in `rewardConfig.ts` and can be changed there.

### Files to change

- `src/types/reward.ts` — add `glass`, `ewaste` categories + subtypes.
- `src/lib/rewardConfig.ts` — rates, `ITEM_SUBTYPES`, fallback map.
- `src/lib/materialNormalizer.ts` — map glass / e-waste keywords (so a raw
  YOLO label sent to `/api/scan` also normalises).
- `src/lib/rewards.ts` — `MATERIAL_RULES` entries.
- `src/components/kiosk/VirtualBins.tsx` — two more bins, accents, "7-Stream".
- `src/lib/yoloMapping.ts` (new) — class → category/subtype.
- `src/app/api/vision/route.ts` (new) — frame → `/classify` → mapped result.
- `src/components/kiosk/WebcamScanner.tsx` — capture frame → `/api/vision`;
  fall back to the TF.js path, then to the demo detection.
- `src/app/kiosk/page.tsx` — policy text rates; pass through the new fields.
- `tests/yolo_mapping.test.mjs` (new) + `package.json` test script.
- `README.md` — vision line.

### Behaviour

- `/api/vision` returns `503` with `{ok:false, reason:"vision_unavailable"}`
  if the service is down; the kiosk then tries TF.js, then the demo value.
- `/classify` `reason` (`no_object_detected`, `low_confidence`,
  `not_recyclable`) is surfaced to the user, not hidden.
- `low_confidence` still goes through `/api/scan`, which applies the existing
  60% gate.

## What's left to the builder

- Exact Tailwind accent colours for the two new bins.
- Whether to keep the TF.js dependency after YOLO works (kept for now).
- Wording of the new bins' labels.

## Human part (not this document)

Kaggle phone verification + token, Roboflow key, dataset ids in
`configs/datasets.yaml`, own labelled photos, training, `best.onnx`, running
`service/app.py`.

## Implementation decisions (2026-11-20)

Reviewer flags settled before coding; these amend the file list above.

1. **`Transaction` enum extended.** `src/models/Transaction.ts` had its own
   5-value union and Mongoose `enum`; glass/ewaste deposits would have failed
   validation and 500'd. Both the union and the enum now carry the 7 values.
   "No DB schema change" meant no new collections or fields, not "reject the
   new categories".
2. **`/api/vision` response** is `{ok, material, category, subtype, recyclable,
   eligibleForReward, confidence, bbox, binName, reason}`. The kiosk submits
   the mapped `subtype` to `/api/scan` (so the weight is the class-specific
   one) and `isVerified: false` — an AI subtype hit never bypasses the 60%
   confidence gate. `low_confidence` still reaches `/api/scan` and is held.
3. **`kiosk/page.tsx` owns `/api/scan`.** `WebcamScanner` no longer POSTs
   itself; it reports detections through `onDetected` (the prop the page
   already passed). One item = one transaction.
4. **`materialNormalizer` checks `glass` before `plastic`** (a "glass bottle"
   label otherwise matched the plastic `bottle` keyword), and
   `weightEstimator`'s plastic branch no longer matches `"glass"`. Glass and
   e-waste branches added to `weightEstimator`.
5. **`no_object_detected` is not submitted** — surfaced as a message only.
   `not_recyclable` is submitted and persists as a 0-point `general`
   transaction. `reason` renders in `WebcamScanner`.

