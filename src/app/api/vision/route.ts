import { NextRequest, NextResponse } from "next/server";
import { mapYoloClass, toConfidence } from "@/lib/yoloMapping";
import { ITEM_SUBTYPES } from "@/lib/rewardConfig";

const VISION_API_URL = process.env.VISION_API_URL ?? "http://127.0.0.1:8000";
const VISION_TIMEOUT_MS = Number(process.env.VISION_TIMEOUT_MS ?? 5000);

interface ClassifyResponse {
  material?: string | null;
  recyclable?: boolean;
  confidence?: number;
  bbox?: number[] | null;
  eligible_for_reward?: boolean;
  reason?: string;
}

interface VisionResult {
  ok: boolean;
  reason?: string;
  material?: string | null;
  category?: string;
  subtype?: string;
  recyclable?: boolean;
  eligibleForReward?: boolean;
  confidence?: number;
  bbox?: number[] | null;
  binName?: string;
}

async function callClassifier(image: Blob): Promise<ClassifyResponse> {
  const form = new FormData();
  form.append("file", image, "frame.jpg");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);
  try {
    const res = await fetch(`${VISION_API_URL.replace(/\/$/, "")}/classify`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`classifier responded ${res.status}`);
    }
    return (await res.json()) as ClassifyResponse;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: NextRequest) {
  let image: Blob;
  try {
    image = await request.blob();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad_request" },
      { status: 400 }
    );
  }

  if (image.size === 0) {
    return NextResponse.json({ ok: false, reason: "empty_frame" }, { status: 400 });
  }

  let detected: ClassifyResponse;
  try {
    detected = await callClassifier(image);
  } catch {
    // Service down/unreachable/slow: kiosk falls back to TF.js then demo.
    return NextResponse.json(
      { ok: false, reason: "vision_unavailable" },
      { status: 503 }
    );
  }

  const reason = detected.reason ?? (detected.eligible_for_reward ? "ok" : "unknown");
  const confidence = toConfidence(detected.confidence);

  // No item in the frame: nothing to map, nothing to submit.
  if (!detected.material) {
    const result: VisionResult = {
      ok: true,
      material: null,
      recyclable: false,
      eligibleForReward: false,
      confidence,
      bbox: detected.bbox ?? null,
      reason,
    };
    return NextResponse.json(result, { status: 200 });
  }

  const mapping = mapYoloClass(detected.material);
  if (!mapping) {
    // Unknown class: never silently pay it as a known material.
    return NextResponse.json(
      {
        ok: false,
        material: typeof detected.material === "string" ? detected.material : null,
        recyclable: false,
        eligibleForReward: false,
        confidence,
        reason: "unknown_class",
      },
      { status: 200 }
    );
  }

  const subtypeConfig = ITEM_SUBTYPES[mapping.subtype];

  const result: VisionResult = {
    ok: true,
    material: detected.material,
    category: mapping.category,
    subtype: mapping.subtype,
    recyclable: mapping.recyclable,
    eligibleForReward: Boolean(detected.eligible_for_reward),
    confidence,
    bbox: detected.bbox ?? null,
    binName: subtypeConfig?.binName,
    reason,
  };

  return NextResponse.json(result, { status: 200 });
}
