import React from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Recycle, Coins, ScanLine, Wallet } from "lucide-react";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

interface LeaderboardUser {
  _id: string;
  name: string;
  cardId: string;
  balanceBdt: number;
  totalItemsRecycled: number;
}

interface RecentScan {
  _id: string;
  cardId: string;
  kioskLocation: string;
  materialType: string;
  rewardEarnedBdt: number;
  weightKg?: number;
  subtypeLabel?: string;
}

export default async function LeaderboardPage() {
  let topUsers: LeaderboardUser[] = [];
  let recentScans: RecentScan[] = [];
  let dbConnected = true;

  try {
    await connectDB();

    const rawUsers = await User.find({})
      .sort({ totalItemsRecycled: -1, balanceBdt: -1 })
      .limit(10)
      .lean();

    const rawScans = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    topUsers = rawUsers.map((u) => ({
      _id: String(u._id),
      name: String(u.name),
      cardId: String(u.cardId),
      balanceBdt: Number(u.balanceBdt ?? 0),
      totalItemsRecycled: Number(u.totalItemsRecycled ?? 0),
    }));

    recentScans = rawScans.map((t) => ({
      _id: String(t._id),
      cardId: String(t.cardId),
      kioskLocation: String(t.kioskLocation),
      materialType: String(t.materialType),
      rewardEarnedBdt: Number(t.rewardEarnedBdt ?? 0),
      weightKg: typeof t.weightKg === "number" ? t.weightKg : undefined,
      subtypeLabel: typeof t.subtypeLabel === "string" ? t.subtypeLabel : undefined,
    }));
  } catch {
    dbConnected = false;
  }

  const totalItems = topUsers.reduce((acc, u) => acc + u.totalItemsRecycled, 0);
  const totalRewards = topUsers.reduce((acc, u) => acc + u.balanceBdt, 0);

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
              <h1 className="text-lg font-bold tracking-tight text-amber-400">
                Street Cleanliness Leaderboard
              </h1>
              <p className="text-xs text-slate-400">
                Top EcoCard contributors & live kiosk activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/kiosk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <ScanLine className="h-4 w-4" />
              Scan Trash
            </Link>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <Wallet className="h-4 w-4 text-emerald-400" />
              My Card
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {!dbConnected && (
          <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
            Database connection is not active yet. Check{" "}
            <code className="font-mono">MONGODB_URI</code> in{" "}
            <code className="font-mono">.env.local</code> and restart{" "}
            <code className="font-mono">npm run dev</code>.
          </div>
        )}

        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="text-xs text-slate-400">Active EcoCards Shown</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {topUsers.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Recycle className="h-3.5 w-3.5 text-emerald-400" />
              Recycled Items Logged
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {totalItems}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              Total Rewards Credited
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-300">
              ৳{totalRewards.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Top Citizens */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 lg:col-span-7">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              <h2 className="text-sm font-semibold">Top Street Recyclers</h2>
            </div>

            {topUsers.length === 0 ? (
              <p className="text-xs text-slate-400">
                No EcoCard users registered yet. Visit{" "}
                <Link href="/wallet" className="text-emerald-400 underline">
                  /wallet
                </Link>{" "}
                to create the first card!
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {topUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0
                            ? "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/50"
                            : index === 1
                            ? "bg-slate-400/20 text-slate-200 ring-1 ring-slate-400/40"
                            : index === 2
                            ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="font-mono text-xs text-slate-400">
                          {user.cardId}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">
                        {user.totalItemsRecycled} items
                      </p>
                      <p className="text-xs text-slate-400">
                        ৳{user.balanceBdt.toFixed(2)} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Recent Scans */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 lg:col-span-5">
            <h2 className="mb-4 text-sm font-semibold">Recent Kiosk Scans</h2>

            {recentScans.length === 0 ? (
              <p className="text-xs text-slate-400">
                No scans recorded yet. Test a scan on{" "}
                <Link href="/kiosk" className="text-emerald-400 underline">
                  /kiosk
                </Link>
                .
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentScans.map((scan) => (
                  <div
                    key={scan._id}
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">
                        {scan.weightKg ? `${scan.weightKg.toFixed(2)} kg ` : ""}
                        {scan.subtypeLabel ?? `${scan.materialType.toUpperCase()}`} •{" "}
                        <span className="font-mono text-slate-400">
                          {scan.cardId}
                        </span>
                      </p>
                      <p className="text-slate-400">{scan.kioskLocation}</p>
                    </div>
                    <span className="font-semibold text-emerald-400">
                      +৳{scan.rewardEarnedBdt.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
