"use client";

import { useState } from "react";
import { Card, CardHeader } from "../../components/ui/card";

const ACTIONS = ["Lower temperature by", "Raise temperature by", "Delay start by", "Shorten runtime by"];
const SCOPES = ["All Halls", "TUM Campus", "Expo Hall A", "Event Tent 3", "Sports Hall"];

export function ScenarioSimulator() {
  const [action, setAction] = useState(ACTIONS[0]);
  const [amount, setAmount] = useState(2);
  const [scope, setScope] = useState(SCOPES[0]);
  const [running, setRunning] = useState(false);

  // simple mock projection so the impact numbers respond to the inputs
  const scopeFactor = scope === "All Halls" ? 1 : 0.32;
  const energy = Math.round(amount * 1170 * scopeFactor);
  const cost = Math.round(amount * 257.5 * scopeFactor);
  const co2 = +(amount * 0.58 * scopeFactor).toFixed(2);

  return (
    <Card>
      <CardHeader title="Scenario Simulator" />
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-graphite-600/70">What if we...</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-52 rounded-lg border border-line bg-white px-3 py-2 text-sm text-graphite-900 outline-none focus:border-coral-500 dark:bg-graphite-800"
          >
            {ACTIONS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-graphite-600/70 opacity-0">amount</label>
          <div className="flex items-center rounded-lg border border-line bg-white dark:bg-graphite-800">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="tabular w-16 rounded-l-lg px-3 py-2 text-sm text-graphite-900 outline-none"
            />
            <span className="border-l border-line px-3 py-2 text-sm text-graphite-600/70">°C</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-graphite-600/70">In</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-40 rounded-lg border border-line bg-white px-3 py-2 text-sm text-graphite-900 outline-none focus:border-coral-500 dark:bg-graphite-800"
          >
            {SCOPES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-1 items-center gap-5 rounded-xl bg-ember-50 px-5 py-3 dark:bg-graphite-800">
          <div>
            <p className="text-[11px] text-graphite-600/70">Predicted Impact (Next 7 Days)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-graphite-700 text-ember-600">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="tabular text-sm font-semibold text-graphite-900">-{energy.toLocaleString()} kWh</p>
              <p className="text-[11px] text-graphite-600/60">Energy Saving</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-graphite-700 text-sky-500">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 7a6.5 6.5 0 1 0 0 10M4 10h9M4 14h9" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="tabular text-sm font-semibold text-graphite-900">-€{cost.toLocaleString()}</p>
              <p className="text-[11px] text-graphite-600/60">Cost Saving</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-graphite-700 text-ember-600">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21c4-3 7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 3 8 7 11Z" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="tabular text-sm font-semibold text-graphite-900">-{co2} t</p>
              <p className="text-[11px] text-graphite-600/60">CO₂ Reduction</p>
            </div>
          </div>

          <button
            onClick={() => setRunning(true)}
            className="ml-auto bg-coral-500 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-coral-600"
          >
            {running ? "Running…" : "Run Scenario"}
          </button>
        </div>
      </div>
    </Card>
  );
}
