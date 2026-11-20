"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Recycle,
  ScanLine,
  Wallet,
  ArrowRight,
  CreditCard,
  Coins,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Smartphone,
  Sparkles,
  KeyRound,
  User as UserIcon,
  Shield,
  Layers,
} from "lucide-react";
import { MIN_REDEMPTION_ECO_POINTS, MIN_REDEMPTION_BDT } from "@/lib/rewardConfig";
import EcoCardVisual, { EcoCardProfile } from "@/components/wallet/EcoCardVisual";

interface UserDashboardData {
  id: string;
  name: string;
  email: string;
  phone: string;
  cardId: string;
  role: "citizen" | "admin";
  ecoPoints: number;
  reservedEcoPoints: number;
  availablePoints: number;
  balanceBdt: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  totalItemsRecycled: number;
  totalWeightKg: number;
  createdAt: string;
}

interface TransactionItem {
  _id: string;
  materialType: string;
  subtypeLabel?: string;
  estimatedWeightGrams?: number;
  weightKg?: number;
  ecoPointsEarned?: number;
  rewardEarnedBdt: number;
  kioskLocation: string;
  createdAt: string;
}

interface RedemptionItem {
  _id: string;
  requestedPoints: number;
  rewardBdt: number;
  payoutMethod: "bKash" | "Nagad" | "Mobile Recharge";
  payoutAccount: string;
  status: "pending" | "approved" | "rejected" | "completed";
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
}

export default function CitizenDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserDashboardData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redemption Form State
  const [redeemPoints, setRedeemPoints] = useState<number>(1000);
  const [payoutMethod, setPayoutMethod] = useState<"bKash" | "Nagad" | "Mobile Recharge">("bKash");
  const [payoutAccount, setPayoutAccount] = useState<string>("");
  const [submittingRedemption, setSubmittingRedemption] = useState(false);

  // Profile Edit State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Password Change State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to load dashboard data");
      }
      const data = await res.json();
      if (data.ok && data.user) {
        setUser(data.user);
        setEditName(data.user.name);
        setEditPhone(data.user.phone);
        setPayoutAccount(data.user.phone);
        setTransactions(data.transactions || []);
        setRedemptions(data.redemptions || []);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }

  async function handleRedeemSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (redeemPoints < MIN_REDEMPTION_ECO_POINTS) {
      setErrorMsg(`Minimum redemption is ${MIN_REDEMPTION_ECO_POINTS.toLocaleString()} EcoPoints.`);
      return;
    }

    if (!user || redeemPoints > user.availablePoints) {
      setErrorMsg(`Cannot redeem more than your available balance (${user?.availablePoints ?? 0} Pts).`);
      return;
    }

    setSubmittingRedemption(true);

    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedPoints: redeemPoints,
          payoutMethod,
          payoutAccount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to submit redemption request.");
      }

      setSuccessMsg(data.message || "Redemption request submitted successfully!");
      loadDashboard();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error submitting request.");
    } finally {
      setSubmittingRedemption(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to update profile.");
      setSuccessMsg("Profile information updated successfully.");
      setShowEditProfile(false);
      loadDashboard();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error updating profile.");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmittingPassword(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to change password.");
      setSuccessMsg("Password changed successfully.");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error changing password.");
    } finally {
      setSubmittingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Recycle className="h-10 w-10 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading your personal EcoLoop profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    // Without a profile there is nothing to render, but a blank page hides the
    // cause (expired session vs API failure) and leaves the user stuck.
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="max-w-md px-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <p className="mb-4 text-sm text-slate-300">
            {errorMsg || "Your session has expired. Please log in again."}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  const ecoCardProfile: EcoCardProfile = {
    name: user.name,
    phone: user.phone,
    cardId: user.cardId,
    balanceBdt: user.balanceBdt,
    totalItemsRecycled: user.totalItemsRecycled,
  };

  const expectedBdt = (redeemPoints / 100).toFixed(2);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <Recycle className="h-5 w-5" />
              </div>
              <span className="text-base font-bold tracking-tight text-white hidden sm:inline">
                EcoLoop <span className="text-emerald-400">Dashboard</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-900/40"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin Portal
              </Link>
            )}

            <Link
              href="/kiosk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <ScanLine className="h-3.5 w-3.5" />
              Open Kiosk
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Alerts */}
        {errorMsg && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Summary Header Banner */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                EcoCard ID: {user.cardId}
              </span>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
                {user.name}
              </h1>
              <p className="text-xs text-slate-400">
                {user.email} • {user.phone} • Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditProfile(!showEditProfile)}
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Edit Profile Dropdown Form */}
          {showEditProfile && (
            <form onSubmit={handleUpdateProfile} className="mt-4 border-t border-slate-800 pt-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-[11px] text-slate-400">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Save Changes
              </button>
            </form>
          )}

          {/* Change Password Dropdown Form */}
          {showChangePassword && (
            <form onSubmit={handleChangePassword} className="mt-4 border-t border-slate-800 pt-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-[11px] text-slate-400">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400">New Password (min 6)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                disabled={submittingPassword}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {submittingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Coins className="h-4 w-4 text-emerald-400" />
              Available EcoPoints
            </span>
            <p className="mt-1 text-2xl font-extrabold text-emerald-400">
              {user.availablePoints.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              ৳{(user.availablePoints / 100).toFixed(2)} BDT ready to redeem
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-4 w-4 text-amber-400" />
              Reserved EcoPoints
            </span>
            <p className="mt-1 text-2xl font-extrabold text-amber-300">
              {user.reservedEcoPoints.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400">
              Pending payout review
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Recycle className="h-4 w-4 text-sky-400" />
              Items Recycled
            </span>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {user.totalItemsRecycled}
            </p>
            <p className="text-[11px] text-slate-400">
              Est. ~{user.totalWeightKg.toFixed(2)} kg diverted
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="h-4 w-4 text-teal-400" />
              All-Time Earned
            </span>
            <p className="mt-1 text-2xl font-extrabold text-teal-300">
              {user.totalPointsEarned.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              ৳{(user.totalPointsEarned / 100).toFixed(2)} lifetime rewards
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Virtual EcoCard Visual & Redemption Form */}
          <div className="space-y-6 lg:col-span-5">
            <EcoCardVisual profile={ecoCardProfile} />

            {/* Redemption Request Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-semibold">Redeem EcoPoints (MFS)</h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Min: {MIN_REDEMPTION_ECO_POINTS.toLocaleString()} Pts (৳{MIN_REDEMPTION_BDT.toFixed(2)})
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Redeem your available EcoPoints into real Bangladeshi Taka sent to your bKash, Nagad, or Mobile Recharge account.
              </p>

              <form onSubmit={handleRedeemSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select MFS Payout Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["bKash", "Nagad", "Mobile Recharge"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPayoutMethod(method)}
                        className={`rounded-xl border py-2 text-xs font-semibold transition ${
                          payoutMethod === method
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payout Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Points to Redeem</span>
                    <span className="text-emerald-400 font-mono">৳{expectedBdt} BDT</span>
                  </div>
                  <input
                    type="number"
                    min={MIN_REDEMPTION_ECO_POINTS}
                    max={user.availablePoints}
                    step={100}
                    value={redeemPoints}
                    onChange={(e) => setRedeemPoints(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                    <span>Available: {user.availablePoints.toLocaleString()} Pts</span>
                    <button
                      type="button"
                      onClick={() => setRedeemPoints(user.availablePoints)}
                      className="text-emerald-400 hover:underline"
                    >
                      Redeem Max
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingRedemption || user.availablePoints < MIN_REDEMPTION_ECO_POINTS}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {submittingRedemption ? "Submitting..." : `Submit Payout Request (৳${expectedBdt})`}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Recycling History & Redemption Requests Tracker */}
          <div className="space-y-6 lg:col-span-7">
            {/* Redemption Requests History */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold">Your Redemption Requests</h2>
                </div>
                <span className="text-xs text-slate-400">{redemptions.length} total</span>
              </div>

              {redemptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No redemption requests yet. Accumulate 1,000 EcoPoints to submit your first payout!
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {redemptions.map((item) => (
                    <div key={item._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            ৳{item.rewardBdt.toFixed(2)} ({item.requestedPoints.toLocaleString()} Pts)
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : item.status === "approved"
                                ? "bg-sky-500/20 text-sky-300"
                                : item.status === "rejected"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {item.payoutMethod} • {item.payoutAccount} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        {item.rejectionReason && (
                          <p className="mt-0.5 text-[11px] text-rose-300">
                            Reason: {item.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono text-slate-400">
                          {item.status === "pending" && "Points Reserved"}
                          {item.status === "approved" && "Queued for Payout"}
                          {item.status === "completed" && "Paid Out"}
                          {item.status === "rejected" && "Points Restored"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recycling Deposit History */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Recycle className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold">Your Recycling Activity</h2>
                </div>
                <span className="text-xs text-slate-400">{transactions.length} items logged</span>
              </div>

              {transactions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No recycling transactions recorded yet. Visit the{" "}
                  <Link href="/kiosk" className="text-emerald-400 underline">
                    RVM Kiosk
                  </Link>{" "}
                  to scan bottles, cans, and paper!
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-100">
                          {tx.subtypeLabel || tx.materialType.toUpperCase()}{" "}
                          <span className="text-slate-400 text-[11px]">
                            (~{tx.estimatedWeightGrams ?? (tx.weightKg ? tx.weightKg * 1000 : 0)}g)
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {tx.kioskLocation} • {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-emerald-400">
                          +{tx.ecoPointsEarned ?? Math.round(tx.rewardEarnedBdt * 100)} Pts
                        </span>
                        <p className="text-[11px] font-mono text-slate-400">
                          ৳{tx.rewardEarnedBdt.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
