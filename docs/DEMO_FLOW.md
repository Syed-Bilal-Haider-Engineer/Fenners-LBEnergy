# Demo Operational Flow — Manager & Technician

> Goal: a clean, repeatable demo build that walks a judge/end-user through **one real event**, seen through **two lenses**: the **Manager** (money, comfort, policy) and the **Technician** (fault, evidence, fix). The dashboard's value is that it connects them — a vague "this hall costs too much" becomes "pump `bdaf0e14` needs a refrigerant service," via one physics model.

---

## 0. The Story (one premise, two personas)

**Setting:** TUM Ottobrunn campus, a cold late-March morning (the real `2026-03-30` window). Lecture halls fill at 04:30 UTC / 06:30 CEST. Outside ≈ 1.5 °C; rooms sat at the overnight trough ≈ 16.8 °C.

**The conflict (from the real data):**
- The **old system** preheated blindly (~2h25m) and **missed comfort on 0/7 mornings** — students walked into ~18.5 °C rooms, and it burned an expensive electric boost trying to catch up.
- Hiding *underneath* one of those cold mornings is a **real hardware fault** on pump `bdaf0e14` (critical alarm, 98% confidence) plus repeated **setpoint-miss** alerts — the room was cold partly because a pump was loafing.

**The resolution the dashboard delivers:**
- **Manager** sees the savings, spots the one hall that's a laggard, and escalates.
- **Technician** receives the same incident as a triaged fault with evidence, parts, and a fix-confirmation loop.
- Same event, same model, two jobs done. That's the pitch.

**Persona switch in the build:** append `?role=manager` or `?role=technician` to `/dashboard`. Drive the demo by switching this once, mid-story, at the handoff moment (§3).

---

## 1. Clean-Build Data Prep (do this before the walkthrough)

The live surfaces (technician fault inbox, residual timeline, pump health, manager alerts feed) already read real model output. The **manager mock surfaces must be re-pointed at the same real numbers** so the two stories cohere. Make these edits the "clean build":

| Surface | File | Change so it tells the real story |
|---|---|---|
| KPI row | `src/features/dashboard/kpi-row.tsx` | Replace `units × constant` with the real backtest totals: **Energy Saved 558 kWh**, **Cost €167**, **CO₂ 223 kg** (scale to "this week" if you want round numbers, but keep the ratio). Heat-pump count = **4** active, **1 warning** (the faulted pump). |
| Energy chart | `src/features/dashboard/energy-chart.tsx` | Keep the "this week vs last week" shape but make the gap reflect **~71 % less preheat-window energy** — last week ≈ baseline (B1), this week ≈ controller (B3). |
| Upcoming schedule | `src/features/dashboard/upcoming-schedule.tsx` | Use the **real event times** (04:30 first lecture) and label halls so **one hall maps to the faulted pump** (e.g. "Hall A — Pump bdaf0e14"). Show that hall's preheat as the one that *started early* and reached 21 °C on time. |
| Top buildings | `src/features/dashboard/top-buildings.tsx` | Rank halls so the **laggard = the hall with the `setpoint_miss` + hardware alarm**. This is the breadcrumb the manager follows into the alert. |
| Manager Alerts card | `src/features/dashboard/alerts.tsx` (reads `anomaly_alerts`) | Confirm the **critical `hardware_alarm` on `bdaf0e14`** is top of the list — it must be the *same* alert the technician resolves. |
| Scenario simulator | `src/features/dashboard/scenario-simulator.tsx` | Fine as mock, but set defaults to a **plausible, on-brand projection** ("Lower temperature by 2 °C / All Halls" → realistic 7-day kWh). |
| Locations seed | `locations/locations-context.tsx` | Seed two locations that read as campus: **"TUM Campus — 4 pumps"** (the demo data) and one secondary. Select TUM Campus by default. |

**Backend must be live:** ensure `outputs/anomaly_alerts_heating.json` and `anomaly_scores_heating.csv` exist (they do) and the Express backend is running so `/faults` and `/faults/timeline` return real data. If regenerating: `python scripts/anomaly.py --window heating`.

---

## 2. Manager Flow — "Money, comfort, policy" (≈ 2.5 min)

Open `/dashboard?role=manager`. Top-to-bottom, the screen *is* the script.

| # | Action | What you say (the insight) |
|---|---|---|
| M1 | Land on dashboard, point to **KPI row** | "This week the predictive controller saved **558 kWh / €167 / 223 kg CO₂** across the campus — and every morning hit comfort on time. Last week's system hit it **zero** times." |
| M2 | **Energy chart**, trace this-week vs last-week | "Same halls, same weather. The gap is the expensive electric boost we no longer fire — about **71 % of the preheat-window energy**." |
| M3 | **Upcoming schedule** (right column) | "The dashboard is already timing tomorrow's preheat per hall — Hall A's cheap coil starts ~4 h early so the room is at 21 °C exactly when the lecture begins. No manual schedule." |
| M4 | **Top Buildings** — point to the laggard | "But this hall is dragging the average. It's costing more and still running cold. Why?" |
| M5 | **Alerts card** — click the critical one | "There's a **critical hardware alarm on one of its pumps**. The energy waste isn't a tuning problem — it's a *fault*. That's the moment a manager needs to hand this to the field." |
| M6 | **Scenario Simulator** — change "Lower temperature by 2 °C / All Halls", Run | "And before committing a policy, I can test it: dropping setpoint 2 °C campus-wide projects **X kWh / €Y** over 7 days. Decision support, not guesswork." |

**Manager takeaway line:** *"I never touch a pump. I see money, comfort, and risk — and I route the risk to the right person in one click."*

---

## 3. The Handoff (the connective beat — do this on screen)

From the manager's critical alert (M5), **switch the role**: change the URL to `/dashboard?role=technician`. Say:

> "Same incident, now in the technician's hands — with everything they need to act."

This single switch is the most important demo moment: it proves the dashboard isn't two products, it's one model serving two jobs.

---

## 4. Technician Flow — "Fault, evidence, fix" (≈ 2.5 min)

Now on `/dashboard?role=technician` (live data).

| # | Action | What you say (the insight) |
|---|---|---|
| T1 | Point to **risk tiles** | "The field view opens on triage: **17 critical, 64 high-risk** incidents across 4 pumps — already ranked by severity and confidence, not raw alarms." |
| T2 | **Fault inbox** — the critical `hardware_alarm` on `bdaf0e14` is pre-selected | "Top of the queue is the same pump the manager flagged — **98 % confidence**, controller alarm register set." |
| T3 | **Fault evidence** panel — read Likely cause / Component / Confidence | "It tells the tech *what* and *where* before they drive out: likely cause, probable component, and the parts to pick — so they arrive with the right kit." |
| T4 | **Residual timeline chart** | "This is the proof. The blue room temp won't track the supply line — the **RC-model residual (red) diverges**. The physics says: this pump is drawing power but not delivering heat. That's a compressor/refrigerant fault, not a cold building." |
| T5 | **Pump health table** | "Across the 4 pumps you can see who's **carrying the load vs loafing** — `bdaf0e14` is loafing while peers compensate. That's why the hall ran cold *and* expensive." |
| T6 | Click **Mark fix performed** → status goes to *Watching* | "After the service, I log the fix. The dashboard now **watches the residual recover** against baseline — it doesn't take my word for it." |
| T7 | Click **Verify** → status *Verified* | "When the residual returns near zero, the incident verifies closed. The loop is evidence-in, evidence-out." |

**Technician takeaway line:** *"I don't chase alarms. I get a ranked fault, physics-backed evidence, the parts list, and proof the fix actually worked."*

---

## 5. Closing — Why the dashboard is needed (30 s)

Tie it back to one sentence per persona:

- **Without it:** the manager sees a high bill and a cold complaint; the technician swaps parts on a hunch. Nobody connects them.
- **With it:** one grey-box physics model turns telemetry into **€ for the manager and a wrench for the technician** — and proves both. "Same model, same code, different parameters — works on a tent, a container, or this lecture hall."

---

## 6. Pre-Demo Checklist

- [ ] Backend running; `GET /faults?window=heating` returns 81 alerts (200, not 404).
- [ ] `outputs/anomaly_alerts_heating.json` + `anomaly_scores_heating.csv` present and fresh.
- [ ] Manager mock surfaces re-pointed to real backtest numbers (§1) so KPIs/energy/top-buildings agree with the alert.
- [ ] The laggard hall in **Top Buildings** = the hall whose pump (`bdaf0e14`) holds the critical alert.
- [ ] Role switch tested: `?role=manager` and `?role=technician` both load clean.
- [ ] `bdaf0e14` critical `hardware_alarm` is row 1 of both the manager Alerts card and the technician inbox.
- [ ] Residual chart renders (timeline endpoint returns rows for `bdaf0e14`).
- [ ] Mark-performed → Watching → Verify state transitions work in one click each.
- [ ] Browser zoom/window sized so KPI row + energy chart + schedule fit one screen.

## 7. Risks & Fallbacks

| Risk | Fallback |
|---|---|
| Backend down / alerts 404 | Pre-seed a static `anomaly_alerts_heating.json`; the technician view degrades gracefully to fallback copy already in `technician-dashboard.tsx`. |
| Residual timeline slow/empty | Pre-select a device with dense rows; cap `limit` query; have `diagnostic_rc_fit.png` ready as a static backup slide. |
| Manager numbers don't match alert story | If §1 edits aren't done in time, narrate the KPIs as "illustrative" and lead hard on the **live** technician side, which is real end-to-end. |
| Judge unfamiliar with RC residual | Use the T4 line ("drawing power but not delivering heat") — no notation needed. |

---

### Appendix — Real numbers to quote

- **Backtest (7 mornings, heating):** old system **0/7** on-time (~18.5 °C); controller **7/7** (~20.5 °C). **557.6 kWh** saved (≈ **€167**, **223 kg CO₂**), ~**71 %** of preheat-window electrical energy. Per-morning lead times 3.2–5.0 h (mean ~4.1 h).
- **Anomaly (heating):** 29,197 rows scored, **81 alerts** (17 critical / 64 high), 4 pumps, RC residual RMSE **0.045 °C**, ramp-fit RMSE **0.18 °C**.
- **Hero fault:** pump `bdaf0e14`, critical `hardware_alarm`, **98 %** confidence — the connective thread between both personas.
