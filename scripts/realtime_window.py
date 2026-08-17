from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WINDOW_FILE = ROOT / "execution-window.json"
LOG_FILE = ROOT / "execution-window.log"


def now() -> tuple[int, str]:
    epoch = int(time.time())
    iso = datetime.fromtimestamp(epoch, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return epoch, iso


def write_log(record: dict) -> None:
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        handle.flush()


def write_window(window: dict) -> None:
    temporary = WINDOW_FILE.with_name(f".{WINDOW_FILE.name}.tmp")
    temporary.write_text(json.dumps(window, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, WINDOW_FILE)


def main() -> None:
    if not WINDOW_FILE.exists():
        raise SystemExit("execution-window.json is missing")
    window = json.loads(WINDOW_FILE.read_text(encoding="utf-8"))
    required = int(window["required_completion_epoch"])
    start = int(window["started_at_epoch"])
    pid = os.getpid()
    while True:
        epoch, iso = now()
        elapsed = max(0, epoch - start)
        write_log({"pid": pid, "observed_at_utc": iso, "observed_epoch": epoch, "elapsed_seconds": elapsed, "required_duration_seconds": int(window["required_duration_seconds"]), "status": "active" if epoch < required else "window_complete"})
        if epoch >= required:
            window["status"] = "window_complete"
            window["completed_at_utc"] = iso
            window["completed_at_epoch"] = epoch
            write_window(window)
            return
        time.sleep(60)


if __name__ == "__main__":
    main()
