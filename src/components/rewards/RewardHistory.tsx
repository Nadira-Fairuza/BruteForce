"use client";

import React from "react";
import { History, Coins, Scale } from "lucide-react";

export interface TransactionHistoryItem {
  _id: string;
  materialType: string;
  subtype?: string;
  subtypeLabel?: string;
  estimatedWeightGrams?: number;
  weightKg?: number;
  rewardEarnedBdt: number;
  ecoPointsEarned?: number;
  kioskLocation: string;
  createdAt: string;
}

interface RewardHistoryProps {
  transactions: TransactionHistoryItem[];
}

export default function RewardHistory({ transactions }: RewardHistoryProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 text-white shadow-xl">
      <div className="mb-3.5 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold">EcoLoop Deposit History</h3>
        </div>
        <span className="text-xs text-slate-400">{transactions.length} entries</span>
      </div>

      {transactions.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">
          No deposits recorded yet. Scan an item at the kiosk to earn your first EcoPoints!
        </p>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {transactions.map((tx) => {
            const grams =
              typeof tx.estimatedWeightGrams === "number"
                ? tx.estimatedWeightGrams
                : typeof tx.weightKg === "number"
                ? Math.round(tx.weightKg * 1000)
                : undefined;

            const points =
              typeof tx.ecoPointsEarned === "number"
                ? tx.ecoPointsEarned
                : Math.round(tx.rewardEarnedBdt * 100);

            return (
              <div
                key={tx._id}
                className="flex items-center justify-between py-2.5 text-xs transition hover:bg-slate-950/30"
              >
                <div>
                  <p className="font-semibold text-slate-100">
                    {tx.subtypeLabel ?? `${tx.materialType.toUpperCase()} Item`}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {typeof grams === "number" && (
                      <span className="flex items-center gap-0.5">
                        <Scale className="h-3 w-3 text-emerald-400" />
                        ~{grams}g
                      </span>
                    )}
                    <span>•</span>
                    <span>{tx.kioskLocation}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 font-mono font-bold text-emerald-300">
                    <Coins className="h-3 w-3" />
                    +{points} Pts
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ৳{tx.rewardEarnedBdt.toFixed(2)} BDT
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(tx.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
