# Backend — Preheat Control API (FastAPI)

REST service that serves optimal preheat start-time predictions from the
fitted RC model.

## Run

```bash
pip install -r requirements.txt          # from repo root
python scripts/train.py                  # produces models/rc_params.json
uvicorn backend.main:app --reload
```

Then open http://127.0.0.1:8000/docs for the interactive Swagger UI.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness + whether a fitted model is present |
| POST | `/predict/preheat_start` | Optimal preheat lead time for an event |

### Example

```bash
curl -X POST http://127.0.0.1:8000/predict/preheat_start \
  -H "Content-Type: application/json" \
  -d '{"t_room_now": 16.87, "t_out": 1.0, "hours_to_event": 24}'
```
