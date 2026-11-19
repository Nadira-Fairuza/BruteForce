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
} from "lucide-react";
import { MATERIAL_RULES } from "@/lib/rewards";

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
                EcoSort <span className="text-emerald-400">Bangladesh</span>
              </span>
              <p className="text-[11px] text-slate-400">
                AI Reverse Vending & Citizen Rewards
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/kiosk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <ScanLine className="h-4 w-4" />
              Launch Kiosk
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <Wallet className="h-4 w-4 text-emerald-400" />
              EcoCard Wallet
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
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
              Built for Cleaner Streets Across Dhaka & Bangladesh
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Turn Street Waste Into{" "}
              <span className="bg-linear-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Instant Taka Rewards
              </span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
              EcoSort Bangladesh pairs AI trash material recognition with
              automated dustbin routing and a virtual EcoCard database—giving
              everyday commuters, students, and street vendors a real reason to
              dispose of bottles, cans, and paper responsibly instead of littering
              sidewalks and drains.
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
                href="/wallet"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
              >
                Create Virtual EcoCard
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
                1. AI Material Detection
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                The kiosk camera inspects discarded items—such as plastic
                bottles, aluminum drink cans, paper cups, or mixed waste—and
                classifies them on the spot.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-white">
                2. Automated Bin Routing
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Detected waste is routed into dedicated color-coded sorting
                bins so recyclables stay clean and separate from general street
                refuse.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-white">
                3. Virtual Card & BDT Credit
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Users tap or enter their EcoCard ID to log transactions in the
                database, earn micro-rewards in BDT, and track future bKash,
                Nagad, or recharge redemptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reward Rates & Dhaka Pilot Zones */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Reward Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 lg:col-span-7">
            <h2 className="text-base font-bold text-white">
              Per-Item Recycling Reward Schedule
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Configurable incentives stored centrally in{" "}
              <code className="text-emerald-300">src/lib/rewards.ts</code>
            </p>

            <div className="mt-4 divide-y divide-slate-800">
              {Object.values(MATERIAL_RULES).map((rule) => (
                <div
                  key={rule.material}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{rule.label}</p>
                    <p className="text-xs text-slate-400">{rule.binName}</p>
                  </div>
                  <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    {rule.rewardBdt > 0 ? `+৳${rule.rewardBdt}.00` : "৳0.00"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Street Focus */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 lg:col-span-5">
            <div>
              <h2 className="text-base font-bold text-white">
                High-Footfall Street Rollout
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Targeting busy urban corridors where single-use bottles, snack
                wrappers, and takeaway cups accumulate fastest:
              </p>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-200">
                <li className="rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5">
                  <strong className="text-emerald-400">Dhanmondi 27:</strong>{" "}
                  Food stalls, coaching centers & evening walkers
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5">
                  <strong className="text-emerald-400">Tejgaon / AUST:</strong>{" "}
                  University students & daily commuter stops
                </li>
                <li className="rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5">
                  <strong className="text-emerald-400">
                    Shahbagh & Banani:
                  </strong>{" "}
                  Transit hubs & high-density commercial streets
                </li>
              </ul>
            </div>

            <Link
              href="/leaderboard"
              className="mt-6 inline-flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-semibold text-emerald-300 transition hover:border-emerald-500/50"
            >
              <span>View Top Street Recyclers</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}