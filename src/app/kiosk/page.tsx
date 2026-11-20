"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Wallet,
  Trophy,
  ArrowLeft,
  Apple,
  AlertTriangle,
  Info,
  Scale,
  Sparkles,
  User,
} from "lucide-react";
import WebcamScanner, { ScanDetectionResult } from "@/components/kiosk/WebcamScanner";
import VirtualBins from "@/components/kiosk/VirtualBins";
import CardTapSimulator, { KioskUserSummary } from "@/components/kiosk/CardTapSimulator";
import RewardDisplay from "@/components/rewards/RewardDisplay";
import {
  TrashMaterial,
  ItemSubtype,
  ITEM_SUBTYPES,
  CONSERVATIVE_FALLBACK_SUBTYPES,
  calculateEcoLoopReward,
  RewardCalculationOutput,
  MIN_CONFIDENCE_THRESHOLD,
  REWARD_RATES_PER_KG,
} from "@/lib/rewards";

export default function KioskPage() {
  const [activeCardId, setActiveCardId] = useState<string>("GUEST-DEMO");
  const [userSummary, setUserSummary] = useState<KioskUserSummary | null>(null);
  const [kioskLocation, setKioskLocation] = useState<string>("Dhanmondi 27, Dhaka");

  // Detection & Subtype state
  const [activeMaterial, setActiveMaterial] = useState<TrashMaterial | null>("plastic");
  const [activeSubtype, setActiveSubtype] = useState<ItemSubtype>("pet_bottle_500ml");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.94);
  const [rawDetectionLabel, setRawDetectionLabel] = useState<string>("500 ml PET Bottle");

  // Latest reward result for RewardDisplay component
  const [latestReward, setLatestReward] = useState<RewardCalculationOutput | null>(null);
  const [lastRewardBdt, setLastRewardBdt] = useState<number | null>(null);
  const [lastEcoPoints, setLastEcoPoints] = useState<number | null>(null);

  const [submittingScan, setSubmittingScan] = useState<boolean>(false);
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

  // When AI camera or simulation detects an item
  async function handleDetected(result: ScanDetectionResult) {
    setErrorMsg(null);
    setActiveMaterial(result.materialType);
    setConfidenceScore(result.confidenceScore);
    setRawDetectionLabel(result.rawLabel);

    // Determine subtype
    let chosenSubtype: ItemSubtype = CONSERVATIVE_FALLBACK_SUBTYPES[result.materialType] ?? "general_waste";
    if (result.subtype && result.subtype in ITEM_SUBTYPES) {
      chosenSubtype = result.subtype as ItemSubtype;
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
    setActiveSubtype(chosenSubtype);

    // Process and submit to server
    await processDeposit({
      materialType: result.materialType,
      subtype: chosenSubtype,
      confidenceScore: result.confidenceScore,
      isVerified: Boolean(result.subtype),
      rawLabel: result.rawLabel,
    });
  }

  // Submit scan and deposit with idempotency token
  async function processDeposit(params?: {
    materialType?: TrashMaterial;
    subtype?: ItemSubtype;
    confidenceScore?: number;
    isVerified?: boolean;
    rawLabel?: string;
  }) {
    const mat = params?.materialType ?? activeMaterial ?? "plastic";
    const sub = params?.subtype ?? activeSubtype;
    const conf = params?.confidenceScore ?? confidenceScore;
    const verified = params?.isVerified ?? isVerified;

    setSubmittingScan(true);
    setErrorMsg(null);

    // Generate unique submission token to prevent duplicate requests
    const submissionId = `SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: activeCardId,
          materialType: mat,
          subtype: sub,
          confidenceScore: conf,
          kioskLocation,
          isVerified: verified,
          submissionId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to process deposit");
      }

      const earnedBdt = Number(data.routing?.rewardEarnedBdt ?? 0);
      const earnedPoints = Number(data.routing?.ecoPointsEarned ?? Math.round(earnedBdt * 100));

      setLastRewardBdt(earnedBdt);
      setLastEcoPoints(earnedPoints);

      if (data.calculation) {
        setLatestReward(data.calculation);
      }

      if (data.user) {
        setUserSummary(data.user);
      } else if (activeCardId !== "GUEST-DEMO") {
        fetchUserSummary(activeCardId);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not connect to /api/scan");
    } finally {
      setSubmittingScan(false);
    }
  }

  // Quick organic deposit flow (Separate organic waste treatment)
  function handleOrganicQuickDeposit() {
    handleDetected({
      materialType: "organic",
      rawLabel: "Banana Peel / Food Scrap",
      confidenceScore: 0.96,
      subtype: "organic_waste",
    });
  }

  // Subtype choices for current material
  const currentSubtypes = Object.values(ITEM_SUBTYPES).filter(
    (item) => item.category === activeMaterial && item.id !== "empty_background"
  );

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
                EcoLoop Smart Reverse Vending Kiosk
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
            <button
              type="button"
              onClick={handleOrganicQuickDeposit}
              disabled={submittingScan}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-950/40 px-3 py-2 text-xs font-semibold text-orange-300 transition hover:bg-orange-900/50"
            >
              <Apple className="h-4 w-4" />
              Deposit Organic Waste (10 Pts)
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <User className="h-4 w-4 text-emerald-400" />
              Dashboard
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/25"
            >
              <Wallet className="h-4 w-4" />
              EcoPoints Wallet
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
        {/* Animated Reward Display Banner */}
        {latestReward && (
          <div className="mb-5">
            <RewardDisplay
              reward={latestReward}
              walletBalanceBdt={userSummary?.balanceBdt}
              onDismiss={() => setLatestReward(null)}
            />
          </div>
        )}

        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Card Simulator + Subtype Selector + Camera Scanner */}
          <div className="space-y-6 lg:col-span-6">
            <CardTapSimulator
              activeCardId={activeCardId}
              onCardChange={(id) => {
                setActiveCardId(id);
                setLatestReward(null);
              }}
              userSummary={userSummary}
              onRefreshUser={fetchUserSummary}
            />

            {/* Subtype Verification & Weight Estimation Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-white shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold">Subtype & Typical Weight Reference</h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                  Rate: ৳{REWARD_RATES_PER_KG[activeMaterial ?? "plastic"]}/kg
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Roadside kiosks estimate typical item weights based on optical classification. Select or verify the item below:
              </p>

              {/* Subtype Selector Chips */}
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {currentSubtypes.map((sub) => {
                  const isSelected = activeSubtype === sub.id;
                  const pts = Math.round((sub.typicalWeightGrams * REWARD_RATES_PER_KG[sub.category]) / 10);
                  const bdt = (pts / 100).toFixed(2);

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setActiveSubtype(sub.id);
                        setIsVerified(true);
                      }}
                      className={`flex items-start justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500/50"
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-white">{sub.name}</p>
                        <p className="text-[11px] text-slate-400">
                          Est. ~{sub.typicalWeightGrams} g
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          +{pts} Pts
                        </span>
                        <p className="text-[10px] text-slate-400">৳{bdt}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Manual Confirmation / Deposit Button */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950/70 p-3 text-xs">
                <div>
                  <span className="text-slate-400">Ready to Deposit:</span>
                  <p className="font-semibold text-white">
                    {ITEM_SUBTYPES[activeSubtype]?.name ?? "Selected Item"} (~{ITEM_SUBTYPES[activeSubtype]?.typicalWeightGrams ?? 0}g)
                  </p>
                </div>

                <button
                  type="button"
                  disabled={submittingScan}
                  onClick={() => processDeposit()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {submittingScan ? "Recording..." : "Confirm & Deposit"}
                </button>
              </div>
            </div>

            <WebcamScanner
              onDetected={handleDetected}
              disabled={submittingScan}
            />
          </div>

          {/* Right Column: Animated Sorting Bins & System Information */}
          <div className="space-y-6 lg:col-span-6">
            <VirtualBins
              activeMaterial={activeMaterial}
              lastRewardBdt={lastRewardBdt}
              lastEcoPoints={lastEcoPoints}
            />

            {/* EcoLoop Weight & Reward Policy */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-xs text-slate-300 shadow-lg">
              <div className="mb-2.5 flex items-center gap-2">
                <Info className="h-4 w-4 text-emerald-400" />
                <h3 className="font-semibold text-white">EcoLoop Roadside Economics & Safeguards</h3>
              </div>

              <div className="space-y-2 text-[11px] leading-relaxed text-slate-400">
                <p>
                  • <strong>Weight Estimation:</strong> Without a physical scale, our vending kiosk applies approved typical weights per item (e.g. 500ml PET = 15g, 1L PET = 25g, Aluminium Can = 15g, Notebook = 250g, Organic = 50g).
                </p>
                <p>
                  • <strong>Reward Rates:</strong> Plastic ৳10/kg, Metal ৳20/kg, Paper ৳5/kg, Organic ৳2/kg, General ৳0/kg.
                </p>
                <p>
                  • <strong>EcoPoints Conversion:</strong> 1 EcoPoint = ৳0.01 poisha. 100 EcoPoints = ৳1.00 BDT. Minimum cashout threshold is 1,000 EcoPoints (৳10.00).
                </p>
                <p>
                  • <strong>Fraud Safeguards:</strong> Empty background is rejected. AI confidence below 60% requires selection/review. Duplicate requests are rejected via server idempotency tokens.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
