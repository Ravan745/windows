# Raahi 🎵

**Your cozy premium Discord music bot** — High-quality Lavalink v4 playback with a cute pastel aesthetic.

Raahi is a complete, production-ready, commercial-grade Discord music bot written in Python. It is fully modular, secure, and designed for large-scale deployment on Pterodactyl or any VPS.

## ✨ Features

- **Music Playback**: Lavalink v4 with Wavelink 3.5+
- **Commands**: Slash + Prefix + Mention + Premium no-prefix
- **Premium System**: User/Guild entitlements, license keys, expiration worker
- **Interactive Player**: Buttons, queue pagination, filters, vote-skip
- **Playlists & History**: Personal + server playlists, favorites, history
- **Filters**: Bassboost, nightcore, vaporwave, 8D, karaoke + more
- **24/7 Mode & Autoplay**
- **Radio & Lyrics**
- **Beautiful UI**: Soft pastel purple theme, consistent cute emojis
- **Security**: Rate limits, SSRF protection, least-privilege permissions
- **Database**: SQLite (ready for PostgreSQL migration)
- **Observability**: Structured logging, health endpoints

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.12+
- External Lavalink v4 node(s)
- Discord Bot with these intents: Message Content, Voice States, Guilds, Members

### 2. Installation

```bash
git clone <your-repo>
cd raahi
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configuration

```bash
cp .env.example .env
# Edit .env with your Discord token and Lavalink nodes
```

### 4. Run

```bash
python main.py
```

### Pterodactyl

Startup Command: `python main.py`

Install Command: `pip install -r requirements.txt`

Required variables: All from `.env.example`

## 📜 Commands

See `/help` in Discord or the generated command reference.

## 🛠️ Development

```bash
ruff check .
ruff format --check .
mypy bot
pytest -q
```

## 📁 Project Structure

See the full tree in the repository.

## 🔒 Security

See `SECURITY.md`

## 📄 License

MIT License — see `LICENSE`

---

**Raahi** — Cozy vibes only ✨
