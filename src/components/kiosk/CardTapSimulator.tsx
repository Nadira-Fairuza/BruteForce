"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Check, UserCheck, Wallet } from "lucide-react";

export interface KioskUserSummary {
  name: string;
  cardId: string;
  balanceBdt: number;
  totalItemsRecycled: number;
}

interface CardTapSimulatorProps {
  activeCardId: string;
  onCardChange: (cardId: string) => void;
  userSummary: KioskUserSummary | null;
  onRefreshUser: (cardId: string) => void;
}

export default function CardTapSimulator({
  activeCardId,
  onCardChange,
  userSummary,
  onRefreshUser,
}: CardTapSimulatorProps) {
  const [inputCardId, setInputCardId] = useState(activeCardId);
  const [recentCards, setRecentCards] = useState<string[]>([]);
  const [loadingCard, setLoadingCard] = useState(false);

  useEffect(() => {
    setInputCardId(activeCardId);
  }, [activeCardId]);

  useEffect(() => {
    let active = true;
    async function loadAvailableCards() {
      try {
        const res = await fetch("/api/card");
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.users)) {
          const ids: string[] = data.users
            .map((u: { cardId?: string }) => u.cardId)
            .filter((id: unknown): id is string => typeof id === "string");
          setRecentCards(ids.slice(0, 4));
        }
      } catch {
        // Ignore network errors before DB is seeded
      }
    }
    loadAvailableCards();
    return () => {
      active = false;
    };
  }, [userSummary?.balanceBdt]);

  async function handleApplyCard(e?: React.FormEvent, overrideId?: string) {
    if (e) e.preventDefault();
    const cleaned = (overrideId ?? inputCardId).trim().toUpperCase() || "GUEST-DEMO";
    setLoadingCard(true);
    try {
      onCardChange(cleaned);
      if (cleaned !== "GUEST-DEMO") {
        onRefreshUser(cleaned);
      }
    } finally {
      setLoadingCard(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 text-white shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-semibold">EcoCard Tap Simulator</h2>
        </div>
        <button
          type="button"
          onClick={() => handleApplyCard(undefined, "GUEST-DEMO")}
          className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Guest Mode
        </button>
      </div>

      <form onSubmit={handleApplyCard} className="flex gap-2">
        <input
          type="text"
          value={inputCardId}
          onChange={(e) => setInputCardId(e.target.value)}
          placeholder="Enter Card ID (e.g. ECO-123456)"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm uppercase text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loadingCard}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Tap Card
        </button>
      </form>

      {recentCards.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400">Saved cards:</span>
          {recentCards.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setInputCardId(id);
                handleApplyCard(undefined, id);
              }}
              className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                activeCardId === id
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
        {activeCardId === "GUEST-DEMO" || !userSummary ? (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-slate-500" />
              Active Card: <strong className="text-slate-200">{activeCardId}</strong>
            </span>
            <span>Register a card in /wallet to earn BDT</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Card Holder</p>
              <p className="text-sm font-semibold text-white">
                {userSummary.name}{" "}
                <span className="ml-1 text-xs font-normal text-emerald-400">
                  ({userSummary.cardId})
                </span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Items recycled: {userSummary.totalItemsRecycled}
              </p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-xs text-slate-400">
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                Balance
              </p>
              <p className="text-lg font-bold text-emerald-400">
                ৳{userSummary.balanceBdt.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}