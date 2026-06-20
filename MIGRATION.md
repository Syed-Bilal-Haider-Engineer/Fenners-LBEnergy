# 📢 `main` has been restructured — please rebase your branches

`main` was reorganized so the project is easier to work in. The big change is
that the old monolithic `src/explore_and_fit.py` is **gone**, split into a proper
package. Please read this before you pull.

## New layout

```
src/lbenergy/        ← the model as an importable package
  config.py            repo-relative paths + constants (no more hardcoded C:\ paths)
  data.py              data loading
  pipeline.py          run_pipeline("heating"|"cooling") — use this to get the analysis frame
  rc_model.py          RC fit + simulation (physics core)
  preheat.py           predict_preheat_start() — the decision output / integration point
  residual.py          LightGBM residual corrector (SCAFFOLD — needs implementing)
  evaluate.py, plots.py
scripts/
  train.py             python scripts/train.py  → models/rc_params.json
  run_diagnostics.py   python scripts/run_diagnostics.py → outputs/ plots
models/  notebooks/  outputs/
```

## To run anything

```bash
pip install -r requirements.txt
python scripts/train.py            # calibrate → models/rc_params.json
python scripts/run_diagnostics.py  # full analysis → outputs/ plots
```

It now works on a fresh clone — no path editing.

## Docs

Moved into `docs/beststart_prediction/` (MODEL_DESIGN, IHL_optimal_start_guide,
comparisson, plan_yassir). The PDR stays at `docs/PDR.md`.

## Frontend / backend

These are **not** in this repo — whoever owns those keeps them separate. The
integration point is `predict_preheat_start()` in `src/lbenergy/preheat.py`.

## ⚠️ Action needed — rebase now while conflicts are small

```bash
git fetch origin
git rebase origin/main      # or: git merge origin/main
```

If you had work in `explore_and_fit.py`, it now lives across the
`src/lbenergy/` modules — port your changes into the matching module.

## Housekeeping notes

1. There are duplicate branches `feature/model_training` and `model_training` —
   let's agree on one and delete the other.
2. `.idea/` and `.DS_Store` are now gitignored, so don't worry if they show up
   locally.
