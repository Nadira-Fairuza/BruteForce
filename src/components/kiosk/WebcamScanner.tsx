"use client";

import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { Camera, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { normalizeMaterial, type TrashMaterial } from "@/lib/rewards";
import {
  resolveScanDetection,
  type ScanDetectionResult,
  type VisionOutcome,
} from "@/lib/scanFallback";

export type { ScanDetectionResult } from "@/lib/scanFallback";

const MODEL_BASE_URL =
  "https://teachablemachine.withgoogle.com/models/qIXgnu5EB";

interface WebcamScannerProps {
  disabled?: boolean;
  onDetected?: (result: ScanDetectionResult) => void;
}

interface TeachableMachineMetadata {
  labels?: string[];
}

interface VisionResponse {
  ok: boolean;
  reason?: string;
  material?: string | null;
  category?: TrashMaterial;
  subtype?: string;
  recyclable?: boolean;
  eligibleForReward?: boolean;
  confidence?: number;
}

export default function WebcamScanner({
  disabled = false,
  onDetected,
}: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const labelsRef = useRef<string[]>(["plastic", "metal", "paper", "general"]);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [livePreview, setLivePreview] = useState<{
    label: string;
    confidence: number;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFromBase(baseUrl: string) {
      const metadataRes = await fetch(`${baseUrl}/metadata.json`);
      if (metadataRes.ok) {
        const meta = (await metadataRes.json()) as TeachableMachineMetadata;
        if (Array.isArray(meta.labels) && meta.labels.length > 0) {
          labelsRef.current = meta.labels;
        }
      }
      return tf.loadLayersModel(`${baseUrl}/model.json`);
    }

    async function loadModel() {
      try {
        await tf.ready();

        let loadedModel: tf.LayersModel;
        try {
          loadedModel = await loadFromBase(MODEL_BASE_URL);
        } catch {
          // Fallback to local public/model/ if offline
          loadedModel = await loadFromBase("/model");
        }

        if (active) {
          modelRef.current = loadedModel;
          setModelLoaded(true);
        }
      } catch {
        if (active) {
          setModelLoaded(false);
        }
      }
    }

    loadModel();

    return () => {
      active = false;
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 640, height: 480 },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch {
        if (mounted) {
          setCameraError(
            "Camera access unavailable. You can still test using the quick material buttons below."
          );
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function runInferenceFromVideo(): Promise<ScanDetectionResult | null> {
    if (!videoRef.current || !modelRef.current || !cameraReady) {
      return null;
    }

    const inputShape = modelRef.current.inputs?.[0]?.shape;
    const targetHeight =
      typeof inputShape?.[1] === "number" ? inputShape[1] : 224;
    const targetWidth =
      typeof inputShape?.[2] === "number" ? inputShape[2] : 224;

    const predictions = tf.tidy(() => {
      const imgTensor = tf.browser.fromPixels(videoRef.current!);
      const resized = tf.image.resizeBilinear(imgTensor, [
        targetHeight,
        targetWidth,
      ]);
      const normalized = resized.toFloat().div(127.5).sub(1).expandDims(0);
      const output = modelRef.current!.predict(normalized) as tf.Tensor;
      return Array.from(output.dataSync());
    });

    if (predictions.length === 0) return null;

    let bestIndex = 0;
    for (let i = 1; i < predictions.length; i++) {
      if (predictions[i] > predictions[bestIndex]) {
        bestIndex = i;
      }
    }

    const rawLabel = labelsRef.current[bestIndex] ?? `Class ${bestIndex}`;
    const confidenceScore = Number(predictions[bestIndex].toFixed(3));
    const materialType = normalizeMaterial(rawLabel);

    return {
      materialType,
      rawLabel,
      confidenceScore,
    };
  }

  function report(detection: ScanDetectionResult) {
    setLivePreview({
      label: detection.rawLabel,
      confidence: detection.confidenceScore,
    });
    setScanStatus(null);
    onDetected?.(detection);
  }

  function reportReason(message: string) {
    setScanStatus(message);
  }

  // Primary path: send the frame to the YOLO /classify service via /api/vision.
  // "unavailable" means fall back; "stop" means the service answered and the
  // frame must not be paid.
  async function detectWithVision(): Promise<VisionOutcome> {
    if (!videoRef.current || !cameraReady) return { status: "unavailable" };

    const frame = document.createElement("canvas");
    frame.width = videoRef.current.videoWidth || 640;
    frame.height = videoRef.current.videoHeight || 480;
    const ctx = frame.getContext("2d");
    if (!ctx) return { status: "unavailable" };
    ctx.drawImage(videoRef.current, 0, 0, frame.width, frame.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      frame.toBlob(resolve, "image/jpeg", 0.9)
    );
    if (!blob) return { status: "unavailable" };

    let res: Response;
    try {
      res = await fetch("/api/vision", {
        method: "POST",
        body: blob,
      });
    } catch {
      return { status: "unavailable" }; // network failure -> TF.js fallback
    }

    let data: VisionResponse;
    try {
      data = (await res.json()) as VisionResponse;
    } catch {
      return { status: "unavailable" }; // non-JSON error page -> treat as down
    }

    if (res.status === 503 || data.reason === "vision_unavailable") {
      return { status: "unavailable" };
    }

    if (!data.ok) {
      return { status: "stop", message: "Unknown material class. Try another item." };
    }

    // Nothing in the frame: surface it, do not record a junk transaction.
    if (!data.material) {
      return {
        status: "stop",
        message: "No item detected. Place an item in the chute and scan again.",
      };
    }

    return {
      status: "detected",
      detection: {
        materialType: data.category ?? "general",
        rawLabel: data.material,
        confidenceScore: data.confidence ?? 0,
        subtype: data.subtype,
        reason: data.reason,
      },
    };
  }

  async function handleCaptureAndScan() {
    if (disabled || isScanning) return;
    setIsScanning(true);

    try {
      const outcome = resolveScanDetection(
        await detectWithVision(),
        await runInferenceFromVideo()
      );

      if ("message" in outcome) {
        reportReason(outcome.message);
        return;
      }
      report(outcome.detection);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSimulateMaterial(materialType: TrashMaterial) {
    if (disabled || isScanning) return;
    setIsScanning(true);
    try {
      report({
        materialType,
        rawLabel: `${materialType} item (demo)`,
        confidenceScore: 0.94,
      });
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-white shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold">AI Trash Vision Scanner</h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            modelLoaded
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {modelLoaded ? "TF.js Model Loaded" : "Loading Model..."}
        </span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${cameraReady ? "block" : "hidden"}`}
        />

        {!cameraReady && (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-sm text-slate-400">
            <AlertCircle className="mb-2 h-7 w-7 text-amber-400" />
            <p>{cameraError ?? "Starting camera feed..."}</p>
          </div>
        )}

        {livePreview && (
          <div className="absolute bottom-3 left-3 rounded-lg bg-slate-950/85 px-3 py-1.5 text-xs backdrop-blur-xs">
            <span className="font-semibold text-emerald-300">
              {livePreview.label}
            </span>{" "}
            <span className="text-slate-300">
              ({Math.round(livePreview.confidence * 100)}% confidence)
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCaptureAndScan}
          disabled={disabled || isScanning}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing Item...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Scan Trash Item
            </>
          )}
        </button>
      </div>

      {scanStatus && (
        <p className="mt-2 text-xs font-medium text-amber-300">{scanStatus}</p>
      )}

      <div className="mt-3 border-t border-slate-800 pt-3">
        <p className="mb-2 text-xs text-slate-400">Quick demo test triggers:</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["plastic", "metal", "paper", "glass", "ewaste", "general"] as TrashMaterial[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSimulateMaterial(item)}
                disabled={disabled || isScanning}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium capitalize text-slate-200 transition hover:border-emerald-500/60 hover:bg-slate-800 disabled:opacity-50"
              >
                Test {item}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}