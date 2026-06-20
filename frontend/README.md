# Frontend — Demo Dashboard (Streamlit)

Interactive what-if dashboard for the preheat model: adjust starting room
temperature and outside temperature, see the required preheat lead time and
the predicted trajectory.

## Run

```bash
pip install -r requirements.txt          # from repo root
streamlit run frontend/app.py
```

Opens at http://localhost:8501.

> Currently uses placeholder β parameters. Point it at the backend
> `/predict/preheat_start` endpoint, or load `models/rc_params.json`
> (produced by `python scripts/train.py`), for live predictions.
