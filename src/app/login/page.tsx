"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Recycle,
  LogIn,
  AlertCircle,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      if (data.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in.");
    } finally {
      setLoading(false);
    }
  }

  // Quick Demo Logins for Testing
  function setDemoCredentials(demoEmail: string, demoPass: string) {
    setEmail(demoEmail);
    setPassword(demoPass);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
            <Recycle className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            EcoLoop <span className="text-emerald-400">Bangladesh</span>
          </span>
        </Link>

        <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">
          Welcome Back
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400">
          Log in to manage your EcoPoints wallet, recycling deposits, and bKash cash-out
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="citizen@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Authenticating..." : "Sign In to EcoLoop"}
            </button>
          </form>

          {/* Quick Demo Pre-fills for Team Review */}
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
            <span className="font-semibold text-slate-400">Quick Testing / Pre-fill:</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDemoCredentials("testusera@example.com", "password123")}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
              >
                User A (Tanvir)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("testuserb@example.com", "password123")}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
              >
                User B (Sadia)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("admin@ecoloop.local", "admin123456")}
                className="rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-900/60"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-semibold text-emerald-400 hover:underline">
              Create an account here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
