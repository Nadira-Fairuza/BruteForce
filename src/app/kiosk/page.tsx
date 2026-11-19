"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Wallet, Trophy, ArrowLeft, CheckCircle2 } from "lucide-react";
import WebcamScanner, { ScanDetectionResult } from "@/components/kiosk/WebcamScanner";
import VirtualBins from "@/components/kiosk/VirtualBins";
import CardTapSimulator, { KioskUserSummary } from "@/components/kiosk/CardTapSimulator";
import { TrashMaterial } from "@/lib/rewards";

interface ScanBannerState {
  message: string;
  binName: string;
  rewardEarnedBdt: number;
  confidenceScore: number;
}

export default function KioskPage() {
  const [activeCardId, setActiveCardId] = useState<string>("GUEST-DEMO");
  const [userSummary, setUserSummary] = useState<KioskUserSummary | null>(null);
  const [kioskLocation, setKioskLocation] = useState<string>("Dhanmondi 27, Dhaka");
  const [activeMaterial, setActiveMaterial] = useState<TrashMaterial | null>(null);
  const [lastRewardBdt, setLastRewardBdt] = useState<number | null>(null);
  const [submittingScan, setSubmittingScan] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<ScanBannerState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUserSummary = useCallback(async (cardId: string) => {
    if (!cardId || cardId === "GUEST-DEMO") {
      setUserSummary(null);
      return;
    }

    try {
      const res = await fetch(`/api/card?cardId=${encodeURIComponent(cardId)}`);
      if (!res.ok) {
        setUserSummary(null);
        return;
      }
      const data = await res.json();
      if (data.ok && data.user) {
        setUserSummary({
          name: data.user.name,
          cardId: data.user.cardId,
          balanceBdt: data.user.balanceBdt ?? 0,
          totalItemsRecycled: data.user.totalItemsRecycled ?? 0,
        });
      }
    } catch {
      // Ignore transient fetch errors during demo
    }
  }, []);

  useEffect(() => {
    fetchUserSummary(activeCardId);
  }, [activeCardId, fetchUserSummary]);

  async function handleDetected(result: ScanDetectionResult) {
    setSubmittingScan(true);
    setErrorMsg(null);
    setActiveMaterial(result.materialType);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: activeCardId,
          materialType: result.materialType,
          confidenceScore: result.confidenceScore,
          kioskLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to log scan");
      }

      const earned = Number(data.routing?.rewardEarnedBdt ?? 0);
      const binName = String(data.routing?.binName ?? result.materialType);

      setLastRewardBdt(earned);
      setStatusBanner({
        message: `Detected ${result.materialType.toUpperCase()} (${result.rawLabel})`,
        binName,
        rewardEarnedBdt: earned,
        confidenceScore: result.confidenceScore,
      });

      if (data.user) {
        setUserSummary(data.user);
      } else if (activeCardId !== "GUEST-DEMO") {
        fetchUserSummary(activeCardId);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not connect to /api/scan"
      );
    } finally {
      setSubmittingScan(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Top Kiosk Header */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Home
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-emerald-400">
                EcoSort Bangladesh — Smart RVM Kiosk
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <select
                  value={kioskLocation}
                  onChange={(e) => setKioskLocation(e.target.value)}
                  className="bg-transparent text-xs text-slate-300 focus:outline-none"
                >
                  <option className="bg-slate-900" value="Dhanmondi 27, Dhaka">
                    Dhanmondi 27, Dhaka
                  </option>
                  <option className="bg-slate-900" value="Tejgaon / AUST Area, Dhaka">
                    Tejgaon / AUST Area, Dhaka
                  </option>
                  <option className="bg-slate-900" value="Shahbagh Crossing, Dhaka">
                    Shahbagh Crossing, Dhaka
                  </option>
                  <option className="bg-slate-900" value="Banani Road 11, Dhaka">
                    Banani Road 11, Dhaka
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/25"
            >
              <Wallet className="h-4 w-4" />
              EcoCard Wallet
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              Leaderboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Kiosk Workspace */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {statusBanner && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <span className="font-semibold text-white">
                  {statusBanner.message}
                </span>
                <span className="mx-2 text-slate-500">•</span>
                <span className="text-emerald-300">
                  Routed to {statusBanner.binName}
                </span>
              </div>
            </div>
            <div className="text-xs font-semibold text-emerald-300">
              +{statusBanner.rewardEarnedBdt} BDT ({Math.round(statusBanner.confidenceScore * 100)}% conf.)
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Card Tap + Webcam Scanner */}
          <div className="space-y-6 lg:col-span-6">
            <CardTapSimulator
              activeCardId={activeCardId}
              onCardChange={(id) => {
                setActiveCardId(id);
                setStatusBanner(null);
              }}
              userSummary={userSummary}
              onRefreshUser={fetchUserSummary}
            />

            <WebcamScanner
              onDetected={handleDetected}
              disabled={submittingScan}
            />
          </div>

          {/* Right Column: Animated Sorting Bins */}
          <div className="lg:col-span-6">
            <VirtualBins
              activeMaterial={activeMaterial}
              lastRewardBdt={lastRewardBdt}
            />
          </div>
        </div>
      </div>
    </main>
  );
}