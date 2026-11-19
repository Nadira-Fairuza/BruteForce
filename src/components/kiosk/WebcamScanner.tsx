"use client";

import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { Camera, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { normalizeMaterial, TrashMaterial } from "@/lib/rewards";

export interface ScanDetectionResult {
  materialType: TrashMaterial;
  rawLabel: string;
  confidenceScore: number;
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
      const detection: ScanDetectionResult = aiResult ?? {
        materialType: "plastic",
        rawLabel: "plastic item (demo)",
        confidenceScore: 0.94,
      };
      await submitScan(detection);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSimulateMaterial(materialType: TrashMaterial) {
    if (disabled || isScanning) return;
    setIsScanning(true);
    try {
      await submitScan({
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
        <p className="mt-2 text-xs font-medium text-emerald-300">{scanStatus}</p>
      )}

      <div className="mt-3 border-t border-slate-800 pt-3">
        <p className="mb-2 text-xs text-slate-400">Quick demo test triggers:</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["plastic", "metal", "paper", "general"] as TrashMaterial[]).map(
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