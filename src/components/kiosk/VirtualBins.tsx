"use client";

import React from "react";
import { motion } from "framer-motion";
import { Recycle, Coins, CheckCircle2 } from "lucide-react";
import { MATERIAL_RULES, TrashMaterial } from "@/lib/rewards";

interface VirtualBinsProps {
  activeMaterial: TrashMaterial | null;
  lastRewardBdt?: number | null;
}

const BIN_ORDER: TrashMaterial[] = ["plastic", "metal", "paper", "general"];

const BIN_ACCENTS: Record<
  TrashMaterial,
  { border: string; badge: string; glow: string }
> = {
  plastic: {
    border: "border-sky-500/60",
    badge: "bg-sky-500/20 text-sky-300",
    glow: "ring-2 ring-sky-400 bg-sky-950/40",
  },
  metal: {
    border: "border-amber-500/60",
    badge: "bg-amber-500/20 text-amber-300",
    glow: "ring-2 ring-amber-400 bg-amber-950/40",
  },
  paper: {
    border: "border-emerald-500/60",
    badge: "bg-emerald-500/20 text-emerald-300",
    glow: "ring-2 ring-emerald-400 bg-emerald-950/40",
  },
  general: {
    border: "border-slate-600/60",
    badge: "bg-slate-700/60 text-slate-300",
    glow: "ring-2 ring-slate-400 bg-slate-800/60",
  },
};

export default function VirtualBins({
  activeMaterial,
  lastRewardBdt = null,
}: VirtualBinsProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-white shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Recycle className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold">Internal Sorting Bins</h2>
        </div>
        {typeof lastRewardBdt === "number" && activeMaterial && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Coins className="h-3.5 w-3.5" />+৳{lastRewardBdt} Credited
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BIN_ORDER.map((material) => {
          const rule = MATERIAL_RULES[material];
          const accent = BIN_ACCENTS[material];
          const isActive = activeMaterial === material;

          return (
            <motion.div
              key={material}
              animate={
                isActive
                  ? { scale: 1.03, y: -3 }
                  : { scale: 1, y: 0 }
              }
              transition={{ type: "spring", stiffness: 360, damping: 22 }}
              className={`relative rounded-xl border p-3.5 transition-colors ${
                accent.border
              } ${isActive ? accent.glow : "bg-slate-950/60"}`}
            >
              {/* Simulated sorting flap */}
              <motion.div
                animate={isActive ? { rotateX: 55 } : { rotateX: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-2.5 h-2 w-full origin-top rounded-full bg-slate-700"
              />

              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${accent.badge}`}
                  >
                    {rule.binName}
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-slate-100">
                    {rule.label}
                  </p>
                </div>

                {isActive && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Reward per item</span>
                <span className="font-semibold text-emerald-400">
                  {rule.rewardBdt > 0 ? `৳${rule.rewardBdt}.00` : "No reward"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}