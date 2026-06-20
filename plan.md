# Plan: Reinforcement-Learning-Steuerung für Wärmepumpen (LB Energy IHL)

## Context

**Aufgabe (aus `callenge_discription.pdf`):** Vorhersagen/entscheiden, *wann* und *wie viele*
Wärmepumpen laufen müssen, damit ein Hörsaal **pünktlich zum Vorlesungsbeginn** Komfort erreicht —
und zwar so energiesparend wie möglich. Plus: kWh / € / CO₂-Einsparung sichtbar machen.

**Gewählter Ansatz (Nutzer-Vorgabe): Reinforcement Learning.**
- **Aktionsraum = Anzahl laufender Geräte (0, 1, 2, 3, 4).** Jedes der 4 Geräte ist nur an/aus;
  Intensität wird über die *Anzahl* aktiver Geräte gesteuert. Beantwortet direkt die PDF-Frage
  „würden weniger Geräte reichen?".
- **Dataset-Split: Training / Validation / Test / Live.** „Live" = ein chronologisch
  zurückgehaltener Datenabschnitt, der Schritt für Schritt „in Echtzeit" abgespielt wird, damit
  die gelernte Policy auf hereinkommende Sensordaten reagiert (es gibt keinen echten Live-Stream;
  „live" = Replay der historischen CSVs).

**Architektur = Model-based RL (zwei Modelle):**
1. **Regressionsmodell = Simulator/Umgebung.** Lernt die Thermo-Dynamik
   `dT/dt = f(Raumtemp, Außentemp, n_geräte_an, Saison)` aus den Daten. Dies ist das
   „Regressionsmodell". Physikalisch strukturiert: Heizleistung ~ linear in der Gerätezahl
   (4 baugleiche Geräte) — so kann der Simulator auch Gerätezahlen abbilden, die im jeweiligen
   Regime selten vorkamen.
2. **RL-Agent = Controller (das „reinforced training").** Lernt durch Belohnung in diesem
   Simulator die Policy „gegebener Zustand → wie viele Geräte einschalten", um Energie zu
   minimieren und Komfort pünktlich zu treffen.

**Warum model-based (Simulator + Agent) statt RL direkt auf den Logs?** Reines Offline-RL kann
Gegenfakten („was, wenn nur 2 Geräte?") kaum bewerten — besonders im Kühl-Regime, wo historisch
fast nur 0 oder 4 Geräte liefen. Der Simulator erlaubt beliebig viele Trainings-Episoden und die
Szenario-Analysen aus dem PDF (weniger Geräte / Soll −2 °C).

**Pretrained vs. von Grund auf:** **Von Grund auf.** Für tabellarische Thermo-/Steuerdaten gibt
es kein sinnvolles vortrainiertes Modell zum Fine-Tunen; jedes Gebäude ist thermisch anders. Beide
Teile werden mit Standard-Algorithmen (scikit-learn / numpy) an *diese* Daten angepasst — kein
neuronales Netz von null, kein vortrainiertes Fremdmodell. *(Future Work für Multi-Gebäude-Rollout:
globales Modell vortrainieren + pro Raum fein-tunen = Transfer Learning.)*

**Verifizierte Daten-Fakten (nicht angenommen):**
- Aktuelles System heizt blind vor: Soll springt ~02:00 von 11→21 °C, Event erst 04:30 (~2,5 h
  fixer Vorlauf, wetterunabhängig) → **das ist die zu schlagende Baseline.**
- Raum erreicht 21 °C an kalten Tagen nicht (Plateau ~20 °C) → Belohnung muss „erreichbaren
  Komfort" tolerant definieren, nicht starr 21 °C.
- Aktions-Abdeckung Heizen: n_aktiv gut über 0–4 verteilt (lernbar). Kühlen: fast nur 0/4
  (→ physikalische Linearität trägt Zwischenstufen).
- Leistung je Gerät: Standby ~1,15 kW (Heizen) / ~1,9 kW (Kühlen), im Betrieb deutlich höher
  → ON/OFF-Energie empirisch aus `power_draw.csv` ableiten (konditioniert auf `heating_required`).

**Stack (installiert, kein Extra-Install):** Python 3.11, pandas, numpy, scikit-learn, matplotlib.
RL als **tabulares Q-Learning** (reines numpy, interpretierbar, anfängerfreundlich) — primär.
Optionale Upgrades (eigene Installs): **Fitted-Q-Iteration** mit sklearn-Regressor als Q-Funktion
(passt zur „Regressionsmodell"-Idee, ohne Zustands-Diskretisierung) bzw. DQN (torch) — nur falls gewünscht.

---

## Daten & Split

| Datei | Verwendung |
|---|---|
| `data/*/heat_pump_snapshots.csv` | Raum-/Außentemp, Soll, `heating_required`/`cooling_required` → Simulator-Training, Zustände |
| `data/*/power_draw.csv` | kW je Gerät / 5 min → ON/OFF-Energie, Kosten, CO₂ |
| `data/*/space_events.csv` | Event-Start/-Ende = Komfort-Deadline (Reward) |
| `data/devices.csv` | 4 baugleiche Geräte (selber Raum) |

**Chronologischer Split je Saison (7 Tage Heizen + 7 Tage Kühlen):**
- **Train:** Tag 1–4 (Simulator fitten; Start-/Außentemp-Verläufe für RL-Episoden)
- **Validation:** Tag 5 (Simulator-Genauigkeit; Reward-Gewichte & Trainingsdauer tunen)
- **Test:** Tag 6 (unverzerrte finale Policy-Bewertung)
- **Live:** Tag 7 (chronologisches Replay als „Echtzeit"-Demo)

Beide Saisons werden gemischt, damit Simulator & Agent Heizen + Kühlen sehen.

**Daten-Fallstricke (im Notebook):** Raumtemp ist über alle 4 Geräte identisch → zur Raum-Dynamik
auf eine Zeitreihe je Zeitstempel aggregieren (Median). `operation_mode` unzuverlässig (zeigt teils
„HEAT" im Kühlen) → Regime aus `heating/cooling_required` + Vorzeichen (Soll−Raum). `compressor_active`
durchgängig 0 → nicht als Aktivitäts-Indikator nutzen; Aktivität aus `power_draw`/`*_required`.
Persistente Alarm-Bits & leere Felder ignorieren.

---

## Komponenten

### A. Simulator (Regressionsmodell)
Resample auf 5-min-Raster. Ziel `y = dT/dt` (°C/h). Features: `room_temp`, `outside_temp`,
`n_active` (0–4), `season`. Zwei Varianten, beide trainieren:
- **Physik-Baseline:** `dT/dt = a·n_active·heizfaktor − b·(room − outside)` via `LinearRegression`
  (robust, erzwingt sinnvolle Linearität in n_active).
- **ML:** `HistGradientBoostingRegressor` für Nichtlinearitäten (Plateau/Sättigung).
Auswahl per RMSE auf Validation/Test; die genauere, aber monoton-plausible Variante wird Umgebung.

### B. RL-Umgebung (Gym-artig, selbst gebaut)
- **State** `s`: (`temp_gap` = Soll−Raum signiert nach Regime, `outside_temp`, `minutes_to_event`,
  `in_event`, `season`).
- **Action** `a` ∈ {0,1,2,3,4} = Geräte an.
- **Transition:** `room_{t+1} = room_t + simulator(s,a)·Δt`; Außentemp/Event aus dem realen Tag.
- **Reward:** `r = −w_E·energy(a) − w_C·comfort_violation`
  - `energy(a) = a · P_on · Δt` (+ Standby übriger Geräte); `P_on` empirisch je Saison.
  - `comfort_violation`: nur während Event, = Abstand Raum↔Soll (toleranzbasiert, da 21 °C nicht
    immer erreichbar). Plus Terminal-Strafe, falls bei Event-Start Komfort verfehlt.
- **Episode:** ein Tageszyklus (Setback-Trog → Event-Ende), Schritt = 5 min.

### C. RL-Agent
Tabulares **Q-Learning** mit diskretisiertem State (temp_gap-, outside-, time-Buckets), ε-greedy.
Training durch viele simulierte Episoden über die Train-Tage. Output: Q-Tabelle/Policy.

### D. Live-Replay
Test-/Live-Tage Schritt für Schritt abspielen; je Schritt realen Sensor-State → Policy → Aktion
(n Geräte); Raum mit Simulator fortschreiben; Energie & Komfort gegen das **tatsächliche**
historische Verhalten dieses Tages vergleichen.

### E. Einsparung & Szenarien (Umfang: Modell + Einsparung)
- Policy vs. Baseline (reales Verhalten) auf Test/Live: kWh, € (z. B. 0,30 €/kWh), CO₂
  (z. B. 0,40 kg/kWh), Komfort-Trefferquote.
- Szenarien per Simulator: max. Geräte auf 3/2 begrenzen („weniger Geräte?"), Soll −2 °C.
- Hochrechnung auf 29 Campus-Wärmepumpen (PDF).

---

## Zu erstellende Dateien
- `notebooks/heat_pump_rl.ipynb` — komplette Pipeline (A–E) mit Plots & Erklärungen (Deliverable).
- `src/simulator.py` — Daten laden, Features, dT/dt-Regression, `step()`-Umgebung.
- `src/rl_agent.py` — Q-Learning (Training, Policy, Speichern/Laden).
- `models/` — gespeicherter Simulator + Q-Policy (`joblib`/`.npy`).
- `requirements.txt` — pandas, numpy, scikit-learn, matplotlib, joblib.

## Risiken & Gegenmaßnahmen
- **Simulator-Ausnutzung** (Agent nutzt Modellfehler aus): Aktionsraum klein (0–4), physikalisch
  strukturierter Simulator, Policy-Trajektorien gegen reale Test-Tage plausibilisieren.
- **Schwache Kühl-Aktionsabdeckung:** Linearitätsannahme in n_active + Heiz-Daten als Hauptlerngrund.
- **Reward-Tuning** (Energie vs. Komfort): `w_E`/`w_C` auf Validation kalibrieren.

## Verification
1. **Simulator:** dT/dt-RMSE auf Test < Physik-Baseline; simulierte vs. echte Raum-Trajektorie an
   einem Aufheiz-Morgen liegen eng beieinander (Plot).
2. **Agent lernt:** kumulative Belohnung steigt über die Trainings-Episoden (Lernkurve-Plot).
3. **Policy sinnvoll:** auf Test/Live-Tagen startet die Policy **später** als der fixe ~02:00-Vorlauf
   und erreicht trotzdem Komfort bis Event-Start; Komfort-Trefferquote ausgeben.
4. **Einsparung:** kWh/€/CO₂ der Policy < Baseline auf Test/Live, plausible Größenordnung.
5. **Robustheit (unbekannte Bedingungen):** am kältesten Test-Tag hält die Policy Komfort
   (ggf. mehr Geräte/früherer Start) — deckt die „cold morning / heatwave"-Frage des PDF ab.
6. **Notebook** läuft fehlerfrei von oben bis unten (Restart & Run All).
