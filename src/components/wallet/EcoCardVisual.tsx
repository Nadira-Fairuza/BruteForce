"use client";

import React, { useState } from "react";
import { Leaf, QrCode, Copy, Check, Recycle, ShieldCheck } from "lucide-react";

export interface EcoCardProfile {
  name: string;
  phone: string;
  cardId: string;
  balanceBdt: number;
  totalItemsRecycled: number;
}

interface EcoCardVisualProps {
  profile: EcoCardProfile;
}

export default function EcoCardVisual({ profile }: EcoCardVisualProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(profile.cardId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard errors in restricted contexts
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-linear-to-br from-emerald-900 via-teal-950 to-slate-950 p-6 text-white shadow-2xl">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-teal-400/10 blur-2xl" />

      {/* Top Row */}
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <Leaf className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              EcoSort Bangladesh
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Smart Street Recycling Pass
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-slate-950/60">
          <QrCode className="h-7 w-7 text-emerald-300" />
        </div>
      </div>

      {/* Balance Display */}
      <div className="relative mt-7">
        <p className="text-xs uppercase tracking-wider text-emerald-200/80">
          Available Reward Balance
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            ৳{profile.balanceBdt.toFixed(2)}
          </span>
          <span className="text-xs font-medium text-emerald-300">BDT</span>
        </div>
      </div>

      {/* Card ID & Holder Footer */}
      <div className="relative mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-400">
            Card Holder
          </p>
          <p className="text-sm font-semibold text-white">{profile.name}</p>
          <p className="text-xs text-slate-400">{profile.phone}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-slate-950/70 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-300 transition hover:bg-slate-900"
            title="Copy Card ID for Kiosk"
          >
            <span>{profile.cardId}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>

          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1">
              <Recycle className="h-3.5 w-3.5 text-emerald-400" />
              {profile.totalItemsRecycled} items
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              NFC Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}