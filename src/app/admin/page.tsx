"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Users,
  Search,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Send,
  Eye,
} from "lucide-react";

interface AdminRedemption {
  _id: string;
  userId: string;
  cardId: string;
  userName: string;
  userEmail: string;
  requestedPoints: number;
  rewardBdt: number;
  payoutMethod: "bKash" | "Nagad" | "Mobile Recharge";
  payoutAccount: string;
  status: "pending" | "approved" | "rejected" | "completed";
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  cardId: string;
  role: string;
  balanceBdt: number;
  ecoPoints: number;
  reservedEcoPoints: number;
  availablePoints: number;
  totalPointsRedeemed: number;
  totalItemsRecycled: number;
}

export default function AdminPortalPage() {
  const router = useRouter();

  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, completed: 0, rejected: 0 });

  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [userSearch, setUserSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function loadAdminData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Redemptions
      const redRes = await fetch(
        filterStatus === "all" ? "/api/admin/redemptions" : `/api/admin/redemptions?status=${filterStatus}`
      );
      if (redRes.status === 403 || redRes.status === 401) {
        throw new Error("Access denied. You must be an administrator to view this page.");
      }
      const redData = await redRes.json();
      if (redData.ok) {
        setRedemptions(redData.redemptions || []);
        if (redData.counts) setCounts(redData.counts);
      }

      // 2. Fetch Users
      const userRes = await fetch(
        userSearch ? `/api/admin/users?search=${encodeURIComponent(userSearch)}` : "/api/admin/users"
      );
      const userData = await userRes.json();
      if (userData.ok) {
        setUsers(userData.users || []);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  async function handleAction(
    redemptionId: string,
    action: "approve" | "reject" | "complete"
  ) {
    let rejectionReason = "";
    if (action === "reject") {
      const reason = window.prompt("Enter rejection reason (e.g. Invalid bKash account / Unreachable number):");
      if (reason === null) return; // User cancelled
      rejectionReason = reason;
    }

    setActionLoadingId(redemptionId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/redemptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redemptionId,
          action,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Failed to ${action} redemption.`);
      }

      setSuccessMsg(data.message || `Action ${action} executed successfully.`);
      loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              My Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <h1 className="text-base font-bold tracking-tight text-white">
                EcoLoop Administration & Payout Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/kiosk"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Open Kiosk
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Alerts */}
        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-amber-400">
              <Clock className="h-4 w-4" />
              Pending Payout Requests
            </span>
            <p className="mt-1 text-2xl font-bold text-amber-300">{counts.pending}</p>
            <p className="text-[11px] text-slate-400">Awaiting approval</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-sky-400">
              <Send className="h-4 w-4" />
              Approved Requests
            </span>
            <p className="mt-1 text-2xl font-bold text-sky-300">{counts.approved}</p>
            <p className="text-[11px] text-slate-400">Queued for MFS execution</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Completed Payouts
            </span>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{counts.completed}</p>
            <p className="text-[11px] text-slate-400">Paid out to citizens</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users className="h-4 w-4" />
              Registered Citizens
            </span>
            <p className="mt-1 text-2xl font-bold text-white">{users.length}</p>
            <p className="text-[11px] text-slate-400">Active accounts</p>
          </div>
        </div>

        {/* Section 1: Redemptions Management Table */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Citizen Reward Redemption Queue</h2>
              <p className="text-xs text-slate-400">
                Review, approve, reject (restoring points), or mark payouts as completed
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1 text-xs">
              {(["all", "pending", "approved", "completed", "rejected"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterStatus(tab)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                    filterStatus === tab
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {redemptions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No redemption requests match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Citizen</th>
                    <th className="py-2.5 px-3">EcoPoints / Value</th>
                    <th className="py-2.5 px-3">MFS Channel</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {redemptions.map((red) => {
                    const isBusy = actionLoadingId === red._id;

                    return (
                      <tr key={red._id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-white">{red.userName}</p>
                          <p className="text-[11px] text-slate-400">{red.userEmail}</p>
                          <p className="font-mono text-[10px] text-slate-500">{red.cardId}</p>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono text-emerald-400 font-bold text-sm">
                            ৳{red.rewardBdt.toFixed(2)}
                          </span>
                          <p className="text-[11px] text-slate-400">
                            {red.requestedPoints.toLocaleString()} EcoPoints
                          </p>
                        </td>

                        <td className="py-3 px-3">
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {red.payoutMethod}
                          </span>
                          <p className="font-mono text-[11px] text-slate-300 mt-0.5">{red.payoutAccount}</p>
                        </td>

                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {new Date(red.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              red.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : red.status === "approved"
                                ? "bg-sky-500/20 text-sky-300"
                                : red.status === "rejected"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {red.status.toUpperCase()}
                          </span>
                          {red.rejectionReason && (
                            <p className="mt-1 text-[10px] text-rose-300 max-w-xs">{red.rejectionReason}</p>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {red.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleAction(red._id, "approve")}
                                  className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleAction(red._id, "reject")}
                                  className="rounded-lg bg-rose-600/80 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {red.status === "approved" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleAction(red._id, "complete")}
                                  className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleAction(red._id, "reject")}
                                  className="rounded-lg bg-rose-950 border border-rose-500/40 px-2.5 py-1 text-[11px] text-rose-300 hover:bg-rose-900 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {red.status === "completed" && (
                              <span className="text-[11px] text-emerald-400 font-semibold">Done</span>
                            )}
                            {red.status === "rejected" && (
                              <span className="text-[11px] text-slate-500">Refunded</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: User Directory & Balance Audit */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Registered Citizen Accounts</h2>
              <p className="text-xs text-slate-400">
                Audit individual balances, reserved points, and recycling deposits
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadAdminData();
              }}
              className="flex gap-2"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, card..."
                  className="rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="py-2.5 px-3">User & EcoCard</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Available Points</th>
                  <th className="py-2.5 px-3">Reserved Points</th>
                  <th className="py-2.5 px-3">Total Redeemed</th>
                  <th className="py-2.5 px-3">Recycled Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                      <span className="font-mono text-[10px] text-emerald-400">{u.cardId}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          u.role === "admin"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-400">
                      {u.availablePoints.toLocaleString()} Pts (৳{(u.availablePoints / 100).toFixed(2)})
                    </td>
                    <td className="py-2.5 px-3 text-amber-300">
                      {u.reservedEcoPoints.toLocaleString()} Pts
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {u.totalPointsRedeemed.toLocaleString()} Pts (৳{(u.totalPointsRedeemed / 100).toFixed(2)})
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">
                      {u.totalItemsRecycled} items
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
