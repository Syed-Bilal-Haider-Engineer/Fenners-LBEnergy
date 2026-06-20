'use client'
import { LiveFeedPanel } from "@/src/features/auth/login/live-feed-panel";
import { LoginForm } from "@/src/features/auth/login/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden w-[460px] flex-shrink-0 lg:block">
        <LiveFeedPanel />
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="flex w-full max-w-[380px] flex-col">
          <div className="mb-9 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember-500 text-sm font-bold text-graphite-950">
                LB
              </div>
              <span className="text-sm font-semibold tracking-wide text-graphite-900">ENERGY</span>
            </div>
          </div>

          <h1 className="text-[22px] font-semibold text-graphite-900">Sign in to your account</h1>
          <p className="mt-1.5 text-sm text-graphite-600/80">
            Monitor buildings, control heat pumps, and track savings.
          </p>

          <div className="mt-7">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
