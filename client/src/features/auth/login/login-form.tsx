"use client";

import Link from "next/link";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // UI only — no auth wired up yet.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-[380px] flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-[13px] font-medium text-graphite-900"
        >
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="lukas@lbenergy.tech"
          className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-graphite-900 outline-none placeholder:text-graphite-600/40 focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-[13px] font-medium text-graphite-900"
          >
            Password
          </label>
          <button type="button" className="text-xs font-medium text-ember-600">
            Forgot password?
          </button>
        </div>
        <div className="flex items-center rounded-lg border border-line bg-white pr-2 focus-within:border-ember-500 focus-within:ring-2 focus-within:ring-ember-500/15">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="flex-1 rounded-l-lg bg-white px-3.5 py-2.5 text-sm text-graphite-900 outline-none placeholder:text-graphite-600/40"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="px-1.5 text-graphite-600/60"
          >
            {showPassword ? (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M6.6 6.7C4.5 8 3 10 2 12c1.6 3.3 5 7 10 7 1.7 0 3.3-.4 4.7-1.1M17.4 17.3C19.5 16 21 14 22 12c-1.1-2.2-3-4.3-5.4-5.7A11 11 0 0 0 12 5c-.6 0-1.2.05-1.8.14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M2 12c1.6-3.3 5-7 10-7s8.4 3.7 10 7c-1.6 3.3-5 7-10 7s-8.4-3.7-10-7Z"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-graphite-600/80">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border-line text-ember-500 focus:ring-ember-500/30"
        />
        Keep me signed in on this device
      </label>

      <button
        type="submit"
        className="mt-1 rounded-lg bg-graphite-900 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <Link href="/dashboard">
        
          Sign in
        
        </Link>
      </button>

      <p className="text-center text-[13px] text-graphite-600/70">
        New to LB Energy?{" "}
        <button type="button" className="font-medium text-ember-600">
          Request access
        </button>
      </p>
    </form>
  );
}
