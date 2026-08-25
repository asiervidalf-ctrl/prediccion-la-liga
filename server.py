import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "data" / "predictions.db"
MADRID_TIMEZONE = ZoneInfo("Europe/Madrid")
PREDICTION_DEADLINE = datetime(2026, 9, 2, 0, 0, tzinfo=MADRID_TIMEZONE)
app = Flask(__name__, static_folder=None)


def get_database() -> sqlite3.Connection:
    DATABASE.parent.mkdir(exist_ok=True)
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    return connection


def serialize_prediction(row: sqlite3.Row, include_payload: bool = True) -> dict:
    result = {"id": row["id"], "author": row["author"], "created_at": row["created_at"]}
    if include_payload:
        result["prediction"] = json.loads(row["payload"])
    return result


def predictions_are_open() -> bool:
    return datetime.now(MADRID_TIMEZONE) < PREDICTION_DEADLINE


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/api/predictions")
def list_predictions():
    with get_database() as connection:
        rows = connection.execute(
            "SELECT id, author, payload, created_at FROM predictions ORDER BY id DESC LIMIT 100"
        ).fetchall()
    return jsonify([serialize_prediction(row) for row in rows])


@app.get("/api/status")
def prediction_status():
    return jsonify(
        {
            "open": predictions_are_open(),
            "deadline": PREDICTION_DEADLINE.isoformat(),
            "timezone": "Europe/Madrid",
        }
    )


@app.post("/api/predictions")
def create_prediction():
    if not predictions_are_open():
        return jsonify({"error": "La porra está cerrada. Estamos fuera."}), 403
    payload = request.get_json(silent=True) or {}
    author = str(payload.get("author", "")).strip()[:30]
    teams = payload.get("teams")
    awards = payload.get("awards")
    if not author:
        return jsonify({"error": "Escribe tu nombre antes de publicar."}), 400
    if not isinstance(teams, list) or len(teams) != 20 or not isinstance(awards, dict):
        return jsonify({"error": "La predicción no está completa o no es válida."}), 400

    safe_payload = {
        "author": author,
        "teams": [
            {key: str(team.get(key, ""))[:200] for key in ("name", "abbr", "color", "crest")}
            for team in teams
            if isinstance(team, dict)
        ],
        "awards": {str(key)[:30]: str(value)[:80] for key, value in awards.items()},
        "awardPlayers": payload.get("awardPlayers", {}),
    }
    if len(safe_payload["teams"]) != 20:
        return jsonify({"error": "La clasificación debe contener 20 equipos."}), 400

    created_at = datetime.now(UTC).isoformat()
    with get_database() as connection:
        cursor = connection.execute(
            "INSERT INTO predictions (author, payload, created_at) VALUES (?, ?, ?)",
            (author, json.dumps(safe_payload, ensure_ascii=False), created_at),
        )
        prediction_id = cursor.lastrowid
    return jsonify({"id": prediction_id, "author": author, "created_at": created_at}), 201


@app.get("/<path:filename>")
def static_files(filename: str):
    return send_from_directory(BASE_DIR, filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
