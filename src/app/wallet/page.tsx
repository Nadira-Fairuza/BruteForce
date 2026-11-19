"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  PlusCircle,
  Search,
  Smartphone,
  History,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import EcoCardVisual, { EcoCardProfile } from "@/components/wallet/EcoCardVisual";

interface WalletTransaction {
  _id: string;
  kioskLocation: string;
  materialType: string;
  confidenceScore: number;
  rewardEarnedBdt: number;
  createdAt: string;
}

export default function WalletPage() {
  const [profile, setProfile] = useState<EcoCardProfile | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [savedCards, setSavedCards] = useState<EcoCardProfile[]>([]);

  // Lookup state
  const [lookupId, setLookupId] = useState("");
  const [loadingLookup, setLoadingLookup] = useState(false);

  // Registration state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [loadingRegister, setLoadingRegister] = useState(false);

  // Mock Cash-out state
  const [payoutMethod, setPayoutMethod] = useState<"bKash" | "Nagad" | "Mobile Recharge">("bKash");
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadRecentCards() {
    try {
      const res = await fetch("/api/card");
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && Array.isArray(data.users)) {
        setSavedCards(data.users);
        if (!profile && data.users.length > 0) {
          fetchCardDetails(data.users[0].cardId);
        }
      }
    } catch {
      // Ignore before DB is connected
    }
  }

  useEffect(() => {
    loadRecentCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCardDetails(cardId: string) {
    const cleaned = cardId.trim().toUpperCase();
    if (!cleaned) return;

    setLoadingLookup(true);
    setErrorMsg(null);
    setPayoutNotice(null);

    try {
      const res = await fetch(`/api/card?cardId=${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Card not found");
      }

      setProfile({
        name: data.user.name,
        phone: data.user.phone,
        cardId: data.user.cardId,
        balanceBdt: data.user.balanceBdt ?? 0,
        totalItemsRecycled: data.user.totalItemsRecycled ?? 0,
      });
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setLookupId(data.user.cardId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not load EcoCard");
    } finally {
      setLoadingLookup(false);
    }
  }

  async function handleRegisterCard(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;

    setLoadingRegister(true);
    setErrorMsg(null);
    setPayoutNotice(null);

    try {
      const res = await fetch("/api/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          phone: regPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to issue EcoCard");
      }

      setProfile({
        name: data.user.name,
        phone: data.user.phone,
        cardId: data.user.cardId,
        balanceBdt: data.user.balanceBdt ?? 0,
        totalItemsRecycled: data.user.totalItemsRecycled ?? 0,
      });
      setTransactions([]);
      setLookupId(data.user.cardId);
      setRegName("");
      setRegPhone("");
      loadRecentCards();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to register card");
    } finally {
      setLoadingRegister(false);
    }
  }

  function handleSimulateCashout() {
    if (!profile) return;
    if (profile.balanceBdt < 10) {
      setErrorMsg("Minimum ৳10.00 balance required to redeem via " + payoutMethod + ".");
      return;
    }
    setErrorMsg(null);
    setPayoutNotice(
      `Demo Payout Requested: ৳${profile.balanceBdt.toFixed(2)} queued to ${payoutMethod} (${profile.phone})!`
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
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
                EcoCard Digital Wallet
              </h1>
              <p className="text-xs text-slate-400">
                Track street recycling rewards & redeem in BDT
              </p>
            </div>
          </div>

          <Link
            href="/kiosk"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <ScanLine className="h-4 w-4" />
            Open RVM Kiosk
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {errorMsg && (
          <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {errorMsg}
          </div>
        )}

        {payoutNotice && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{payoutNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Issue or Load EcoCard */}
          <div className="space-y-6 lg:col-span-5">
            {/* Find Existing Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold">Load Existing EcoCard</h2>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchCardDetails(lookupId);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="ECO-123456"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm uppercase text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loadingLookup}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                >
                  {loadingLookup ? "..." : "Load"}
                </button>
              </form>

              {savedCards.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {savedCards.slice(0, 5).map((card) => (
                    <button
                      key={card.cardId}
                      type="button"
                      onClick={() => fetchCardDetails(card.cardId)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        profile?.cardId === card.cardId
                          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {card.name.split(" ")[0]} ({card.cardId})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Register New EcoCard */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
              <div className="mb-3 flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold">Issue New Virtual EcoCard</h2>
              </div>

              <form onSubmit={handleRegisterCard} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Bangladeshi Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingRegister}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4" />
                  {loadingRegister ? "Issuing Card..." : "Generate EcoCard"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Visual EcoCard, Cash-out & History */}
          <div className="space-y-6 lg:col-span-7">
            {profile ? (
              <>
                <EcoCardVisual profile={profile} />

                {/* Simulated MFS Redemption */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-sm font-semibold">
                        Redeem Rewards (Bangladesh MFS Simulation)
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">Min. ৳10.00</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {(["bKash", "Nagad", "Mobile Recharge"] as const).map(
                      (method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPayoutMethod(method)}
                          className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                            payoutMethod === method
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                              : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {method}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={handleSimulateCashout}
                      className="ml-auto rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Withdraw ৳{profile.balanceBdt.toFixed(2)}
                    </button>
                  </div>
                </div>

                {/* Recent Scan Activity */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <History className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold">Recent Kiosk Deposits</h3>
                  </div>

                  {transactions.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No deposits logged yet. Copy your Card ID{" "}
                      <span className="font-mono text-emerald-300">
                        {profile.cardId}
                      </span>{" "}
                      and scan an item on the Kiosk page!
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {transactions.map((tx) => (
                        <div
                          key={tx._id}
                          className="flex items-center justify-between py-2.5 text-xs"
                        >
                          <div>
                            <p className="font-semibold capitalize text-slate-100">
                              {tx.materialType} Waste
                            </p>
                            <p className="text-slate-400">{tx.kioskLocation}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-400">
                              +৳{tx.rewardEarnedBdt.toFixed(2)}
                            </p>
                            <p className="text-slate-500">
                              {new Date(tx.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
                <CreditCard className="mb-2 h-8 w-8 text-slate-600" />
                <p>Issue a new EcoCard on the left or load an existing Card ID to view your wallet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}