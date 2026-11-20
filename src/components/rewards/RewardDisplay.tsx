"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { RewardCalculationOutput } from "@/types/reward";
import { formatRewardDisplay } from "@/lib/rewardCalculator";

interface RewardDisplayProps {
  reward: RewardCalculationOutput | null;
  walletBalanceBdt?: number;
  onDismiss?: () => void;
}

export default function RewardDisplay({
  reward,
  walletBalanceBdt,
  onDismiss,
}: RewardDisplayProps) {
  if (!reward) return null;

  const { pointsText, bdtText } = formatRewardDisplay(reward.ecoPoints);
  const totalBalancePoints = typeof walletBalanceBdt === "number"
    ? Math.round(walletBalanceBdt * 100)
    : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl ${
          reward.eligible && reward.ecoPoints > 0
            ? "border-emerald-500/50 bg-linear-to-br from-emerald-950/80 via-slate-900/90 to-teal-950/80 text-white"
            : reward.requiresReview
            ? "border-amber-500/50 bg-amber-950/70 text-amber-100"
            : "border-slate-800 bg-slate-900/90 text-slate-200"
        }`}
      >
        {/* Decorative sparkles glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />

        <div className="relative">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              {reward.eligible && reward.ecoPoints > 0 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                  <Sparkles className="h-4 w-4" />
                </div>
              ) : reward.requiresReview ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  Material Detected: {reward.material.toUpperCase()}
                </span>
                <h3 className="text-sm font-semibold text-white">
                  {reward.subtypeName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[11px] uppercase tracking-wide text-slate-300">
                {reward.verificationStatus.replace("_", " ")}
              </span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Metric Grid */}
          <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-slate-950/50 p-2.5">
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <Scale className="h-3 w-3 text-emerald-400" />
                Estimated Weight
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-white">
                {reward.estimatedWeightGrams} g
              </p>
              <span className="text-[10px] text-slate-400">Approx. camera estimate</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-950/50 p-2.5">
              <p className="text-[11px] text-slate-400">Reward Rate</p>
              <p className="mt-1 font-mono text-sm font-bold text-white">
                ৳{reward.rewardRatePerKg} / kg
              </p>
              <span className="text-[10px] text-slate-400">Configured prototype</span>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2.5">
              <p className="flex items-center gap-1 text-[11px] text-emerald-300">
                <Coins className="h-3 w-3" />
                EcoPoints Earned
              </p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mt-1 font-mono text-base font-extrabold text-emerald-300"
              >
                +{reward.ecoPoints}
              </motion.p>
              <span className="text-[10px] text-emerald-400/80">1 pt = ৳0.01 poisha</span>
            </div>

            <div className="rounded-xl border border-white/5 bg-slate-950/50 p-2.5">
              <p className="text-[11px] text-slate-400">Equivalent BDT</p>
              <p className="mt-1 font-mono text-sm font-bold text-emerald-400">
                {bdtText}
              </p>
              <span className="text-[10px] text-slate-400">100 pts = ৳1.00</span>
            </div>
          </div>

          {/* Footer & Wallet Update */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/70 px-3.5 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Routed to <strong className="text-white">{reward.binName}</strong></span>
            </div>

            {typeof totalBalancePoints === "number" && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>Updated Wallet:</span>
                <strong className="font-mono text-emerald-300">
                  {totalBalancePoints.toLocaleString()} EcoPoints (৳{walletBalanceBdt?.toFixed(2)})
                </strong>
              </div>
            )}
          </div>

          {/* Low Confidence or Review Alert */}
          {reward.requiresReview && (
            <p className="mt-2.5 text-xs text-amber-300">
              ⚠ {reward.reason}
            </p>
          )}

          {/* Disclaimer */}
          <p className="mt-2 text-[10px] text-slate-400">
            * Note: Optical cameras cannot physically weigh waste items. Estimated weights and reward values are approximate prototype calculations.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
