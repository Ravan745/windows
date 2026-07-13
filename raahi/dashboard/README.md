# Raahi Dashboard (Optional)

This folder contains the optional FastAPI dashboard.

## Features (when enabled)

- Discord OAuth2 login
- Guild management (prefix, DJ role, 24/7, filters)
- Queue control
- Premium status

## Running

```bash
ENABLE_DASHBOARD=true
pip install -e ".[dashboard]"
cd dashboard
uvicorn main:app --port 8000
```

The dashboard is **completely optional** and disabled by default. The bot core does not import any dashboard code.

See `bot/core/config.py` for `enable_dashboard` flag.
