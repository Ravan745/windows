# Raahi fix: bot not appearing online

## Plan (approved)
- Make `setup_hook()` non-blocking for Lavalink (prevent readiness delay).
- Add logging around `setup_hook` and `on_ready` + presence update errors.
- Ensure `tree.sync()` can’t stall startup indefinitely (timeout/error handling).

## Steps
- [x] Patch `raahi/bot/core/bot.py`:
  - [x] Wrap `tree.sync()` with timeout + error logging
  - [x] Run `_init_wavelink()` in a background task so it can’t block `setup_hook_complete`
  - [x] Add logs before these operations

  - [x] Add try/except around `change_presence` in `on_ready`

- [x] Update TODO.md to completed step(s)
- [ ] Restart bot and verify logs contain `setup_hook_complete` and `bot_ready`
- [ ] If still offline, inspect remaining gateway/shard errors from logs
