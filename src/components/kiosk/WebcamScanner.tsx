"use client";

import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { Camera, AlertCircle, RefreshCw } from "lucide-react";
import { normalizeMaterial, TrashMaterial } from "@/lib/rewards";

export interface ScanDetectionResult {
  materialType: TrashMaterial;
  rawLabel: string;
  confidenceScore: number;
  subtype?: string;
}

interface WebcamScannerProps {
  cardId?: string;
  kioskLocation?: string;
  disabled?: boolean;
  onScanCompleted?: (payload: {
    materialType: TrashMaterial;
    rawLabel: string;
    confidenceScore: number;
    rewardEarnedBdt: number;
    binName?: string;
  }) => void;
}

interface TeachableMachineMetadata {
  labels?: string[];
}

export default function WebcamScanner({
  cardId = "",
  kioskLocation = "Dhanmondi 27, Dhaka",
  disabled = false,
  onScanCompleted,
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

  // Load Teachable Machine model from /model/model.json if present
  useEffect(() => {
    let active = true;

    async function loadModel() {
      try {
        await tf.ready();

        const metadataRes = await fetch("/model/metadata.json");
        if (metadataRes.ok) {
          const meta = (await metadataRes.json()) as TeachableMachineMetadata;
          if (Array.isArray(meta.labels) && meta.labels.length > 0) {
            labelsRef.current = meta.labels;
          }
        }

        const loadedModel = await tf.loadLayersModel("/model/model.json");
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
            "Camera access unavailable. You can still test using the quick item buttons below."
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

  async function submitScan(detection: ScanDetectionResult) {
    setLivePreview({
      label: detection.rawLabel,
      confidence: detection.confidenceScore,
    });
    setScanStatus(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: cardId.trim() || undefined,
          kioskLocation,
          materialType: detection.materialType,
          confidenceScore: detection.confidenceScore,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        const reward = Number(data.rewardEarnedBdt ?? data.transaction?.rewardEarnedBdt ?? 0);
        setScanStatus(
          `Logged ${detection.materialType} (+৳${reward.toFixed(2)})`
        );
        onScanCompleted?.({
          ...detection,
          rewardEarnedBdt: reward,
          binName: data.binName,
        });
      } else {
        setScanStatus(data.error || "Scan recorded locally.");
      }
    } catch {
      setScanStatus("Could not reach /api/scan.");
    }
  }

  async function handleCaptureAndScan() {
    if (disabled || isScanning) return;
    setIsScanning(true);

    try {
      const aiResult = await runInferenceFromVideo();
      if (aiResult) {
        setLivePreview({
          label: aiResult.rawLabel,
          confidence: aiResult.confidenceScore,
        });
        await submitScan(aiResult);
      } else {
        // Fallback demo simulation if camera is unavailable
        await submitScan({
          materialType: "plastic",
          rawLabel: "500 ml PET Bottle (Mum)",
          confidenceScore: 0.95,
          subtype: "pet_bottle_500ml",
        });
      }
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSimulateItem(
    materialType: TrashMaterial,
    label: string,
    confidence: number = 0.94,
    subtype?: string
  ) {
    if (disabled || isScanning) return;
    setIsScanning(true);
    setLivePreview({ label, confidence });
    try {
      await submitScan({
        materialType,
        rawLabel: label,
        confidenceScore: confidence,
        subtype,
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
          <h2 className="text-base font-semibold">AI Chute Optical Scanner</h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            modelLoaded
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-amber-500/20 text-amber-300"
          }`}
        >
          {modelLoaded
            ? "TF.js Model Loaded"
            : "Demo Mode (No /model/model.json)"}
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

      {/* Camera Capture and Fast Subtype Testing Buttons */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCaptureAndScan}
            disabled={disabled || isScanning}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {isScanning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {isScanning ? "Scanning Chute..." : "Scan from Camera"}
          </button>

          <span className="text-[11px] text-slate-400">Quick Test Subtypes:</span>
        </div>

        {scanStatus && (
          <p className="text-xs font-medium text-emerald-300">{scanStatus}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleSimulateItem("plastic", "500 ml PET Bottle (Mum)", 0.95, "pet_bottle_500ml")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-sky-500/40 bg-sky-950/40 px-2 py-1 text-xs text-sky-300 transition hover:bg-sky-900/50"
          >
            500ml PET (+15 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("plastic", "1 L PET Bottle (Mojo)", 0.94, "pet_bottle_1l")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-sky-500/40 bg-sky-950/40 px-2 py-1 text-xs text-sky-300 transition hover:bg-sky-900/50"
          >
            1L PET (+25 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("metal", "Aluminium Drink Can", 0.95, "aluminium_can")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-2 py-1 text-xs text-amber-300 transition hover:bg-amber-900/50"
          >
            Aluminium Can (+30 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("metal", "Tin Can (Condensed Milk)", 0.93, "tin_can")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-2 py-1 text-xs text-amber-300 transition hover:bg-amber-900/50"
          >
            Tin Can (+80 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("paper", "Paper Tea Cup", 0.92, "paper_cup")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2 py-1 text-xs text-emerald-300 transition hover:bg-emerald-900/50"
          >
            Paper Cup (+5 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("paper", "School Notebook / Khata", 0.91, "notebook")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2 py-1 text-xs text-emerald-300 transition hover:bg-emerald-900/50"
          >
            Notebook (+125 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("organic", "Banana / Fruit Peel", 0.95, "organic_waste")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-orange-500/40 bg-orange-950/40 px-2 py-1 text-xs text-orange-300 transition hover:bg-orange-900/50"
          >
            Organic Waste (+10 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("general", "General Mixed Scrap", 0.90, "general_waste")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
          >
            General (0 Pts)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("general", "Empty Background", 0.95, "empty_background")}
            disabled={disabled || isScanning}
            className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-700"
            title="Empty background rejection test"
          >
            Empty Chute (Reject)
          </button>

          <button
            type="button"
            onClick={() => handleSimulateItem("plastic", "Unclear Shape", 0.45)}
            disabled={disabled || isScanning}
            className="rounded-lg border border-purple-500/40 bg-purple-950/40 px-2 py-1 text-xs text-purple-300 transition hover:bg-purple-900/50"
            title="Low confidence test (<60%)"
          >
            Low Conf (45%)
          </button>
        </div>
      </div>
    </div>
  );
}
