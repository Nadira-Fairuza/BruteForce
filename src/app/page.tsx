import React from "react";
import Link from "next/link";
import {
  Recycle,
  ScanLine,
  Wallet,
  Trophy,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Scale,
  Coins,
  Apple,
  LogIn,
  User,
} from "lucide-react";
import {
  REWARD_RATES_PER_KG,
  ITEM_SUBTYPES,
  MIN_REDEMPTION_ECO_POINTS,
  ECO_POINTS_PER_BDT,
  formatBdt,
} from "@/lib/rewards";

const FEATURED_ITEMS = [
  "pet_bottle_500ml",
  "pet_bottle_1l",
  "aluminium_can",
  "tin_can",
  "paper_cup",
  "notebook",
  "cardboard_box_small",
  "organic_waste",
  "general_waste",
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
              <Recycle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                EcoLoop <span className="text-emerald-400">Bangladesh</span>
              </span>
              <p className="text-[11px] text-slate-400">
                AI Reverse Vending & Citizen EcoPoints Rewards
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/kiosk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <ScanLine className="h-4 w-4" />
              Launch RVM Kiosk
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900/40"
            >
              <User className="h-4 w-4" />
              Citizen Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <Wallet className="h-4 w-4 text-emerald-400" />
              Wallet
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              Leaderboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-900">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-2xl -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-14 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <MapPin className="h-3.5 w-3.5" />
              Smart Roadside Reverse Vending for Cleaner Bangladeshi Cities
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Turn Single-Use Waste Into{" "}
              <span className="bg-linear-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                EcoPoints & Taka
              </span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              EcoLoop pairs AI trash material recognition with typical weight estimation
              and an instant EcoPoints reward ledger—giving daily commuters, students, and
              citizens a tangible financial incentive to recycle bottles, cans, paper, and
              organic waste instead of littering drains and sidewalks.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Link
                href="/kiosk"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
              >
                Try Live RVM Kiosk
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
              >
                Register Citizen Account
              </Link>
            </div>
          </div>

          {/* 3-Step Flow Cards */}
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <ScanLine className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-white">
                1. AI Vision & Subtype ID
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                The optical scanner identifies bottles, aluminium drink cans, tins, paper cups,
                notebooks, or organic food waste one item at a time.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-white">
                2. Weight Estimation
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Without expensive physical scales, typical weights (15g, 25g, 40g, 250g)
                derive transparently from configured item averages.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Coins className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-white">
                3. Instant EcoPoints Wallet
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Earn 1 EcoPoint per ৳0.01 poisha. Redeem starting at 1,000 EcoPoints (৳10.00)
                via bKash, Nagad, or mobile recharge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reward Rates & Weight Matrix */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Rate Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white">
                  EcoLoop Item Reward & Weight Matrix
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Formula: <code className="text-emerald-300">EcoPoints = (Grams × Rate/kg) ÷ 10</code>
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                100 EcoPoints = ৳1.00
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-800">
              {FEATURED_ITEMS.map((key) => {
                const item = ITEM_SUBTYPES[key];
                const rate = REWARD_RATES_PER_KG[item.category];
                const pts = Math.round((item.typicalWeightGrams * rate) / 10);
                const bdt = (pts / 100).toFixed(2);

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.binName} • Est. ~{item.typicalWeightGrams} g • Rate: ৳{rate}/kg
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                        +{pts} EcoPoints
                      </span>
                      <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                        ৳{bdt} BDT
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Notice:</span> A standard optical camera cannot physically measure weight. Weight figures and EcoPoints represent configured typical averages.
            </div>
          </div>

          {/* Core Categories and Rates */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 lg:col-span-5">
            <div>
              <h2 className="text-base font-bold text-white">
                Base Prototype Rates
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Centralized rates stored in <code className="text-emerald-300">src/lib/rewardConfig.ts</code>:
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-950/20 px-3.5 py-2.5 text-sky-200">
                  <span>Plastic (Bottles, Wrappers, Cups)</span>
                  <strong className="font-mono text-white">৳10 / kg</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/20 px-3.5 py-2.5 text-amber-200">
                  <span>Metal (Aluminium Cans, Tins, Foil)</span>
                  <strong className="font-mono text-white">৳20 / kg</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2.5 text-emerald-200">
                  <span>Paper (Cups, Cartons, Notebooks)</span>
                  <strong className="font-mono text-white">৳5 / kg</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-orange-500/30 bg-orange-950/20 px-3.5 py-2.5 text-orange-200">
                  <span>Organic (Peels, Vegetable Waste)</span>
                  <strong className="font-mono text-white">৳2 / kg</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-slate-400">
                  <span>General / Non-Recyclable Waste</span>
                  <strong className="font-mono text-slate-400">৳0 / kg</strong>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
                <p className="font-semibold text-slate-300">Redemption Rules:</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimum threshold: 1,000 EcoPoints (৳10.00). Empty background chute states are rejected to prevent fraud.
                </p>
              </div>
            </div>

            <Link
              href="/kiosk"
              className="mt-6 inline-flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-semibold text-emerald-300 transition hover:border-emerald-500/50"
            >
              <span>Test Chute Scanner</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
