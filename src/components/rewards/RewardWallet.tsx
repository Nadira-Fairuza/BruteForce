"use client";

import React from "react";
import { Wallet, Coins, ArrowUpRight, Award, ShieldCheck } from "lucide-react";
import { MIN_REDEMPTION_ECO_POINTS, ECO_POINTS_PER_BDT } from "@/lib/rewardConfig";

interface RewardWalletProps {
  cardId: string;
  name: string;
  balanceBdt: number;
  totalSubmissions: number;
  latestPointsEarned?: number;
}

export default function RewardWallet({
  cardId,
  name,
  balanceBdt,
  totalSubmissions,
  latestPointsEarned,
}: RewardWalletProps) {
  const ecoPoints = Math.round(balanceBdt * ECO_POINTS_PER_BDT);
  const progressPercent = Math.min(
    100,
    Math.round((ecoPoints / MIN_REDEMPTION_ECO_POINTS) * 100)
  );
  const eligibleForRedeem = ecoPoints >= MIN_REDEMPTION_ECO_POINTS;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 text-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">EcoLoop Points Wallet</h3>
            <p className="text-[11px] text-slate-400">Card ID: {cardId}</p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
          100 Pts = ৳1.00
        </span>
      </div>

      {/* Main Balance Display */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5">
          <p className="flex items-center gap-1.5 text-xs text-emerald-300">
            <Coins className="h-4 w-4" />
            Current EcoPoints
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-white">
            {ecoPoints.toLocaleString()} <span className="text-xs font-semibold text-emerald-400">Pts</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Equivalent Cash Value: <strong className="text-emerald-300">৳{balanceBdt.toFixed(2)} BDT</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Award className="h-4 w-4 text-amber-400" />
            Recycling Milestones
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-white">
            {totalSubmissions}{" "}
            <span className="text-xs font-normal text-slate-400">Deposits</span>
          </p>
          {typeof latestPointsEarned === "number" && (
            <p className="mt-0.5 text-xs text-emerald-300">
              Latest: +{latestPointsEarned} EcoPoints
            </p>
          )}
        </div>
      </div>

      {/* Redemption Progress */}
      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Redemption Threshold (Min. {MIN_REDEMPTION_ECO_POINTS.toLocaleString()} Pts = ৳10)
          </span>
          <span className={`font-semibold ${eligibleForRedeem ? "text-emerald-400" : "text-slate-400"}`}>
            {progressPercent}%
          </span>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              eligibleForRedeem ? "bg-emerald-400" : "bg-emerald-500/70"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          {eligibleForRedeem
            ? "✓ Congratulations! You meet the minimum threshold to redeem rewards via bKash, Nagad, or Mobile Recharge."
            : `Earn ${(MIN_REDEMPTION_ECO_POINTS - ecoPoints).toLocaleString()} more EcoPoints to unlock cashout.`}
        </p>
      </div>
    </div>
  );
}
