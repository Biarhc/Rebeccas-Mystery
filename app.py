import os
import json
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = "saint_claire_rebecca_secret_key_2026"

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_json_data(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.route("/")
def index():
    """Render the main single-page game screen."""
    return render_template("index.html")

@app.route("/api/game-data", methods=["GET"])
def get_game_data():
    """Return initial data package (characters, clues, events, dialogues)."""
    return jsonify({
        "characters": load_json_data("characters.json"),
        "clues": load_json_data("clues.json"),
        "dialogues": load_json_data("dialogues.json"),
        "events": load_json_data("events.json"),
        "missions": load_json_data("missions.json")
    })

@app.route("/api/save", methods=["POST"])
def save_game():
    """Save the current player session state."""
    state = request.get_json()
    if not state:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    session["game_state"] = state
    return jsonify({"success": True, "message": "Progresso gravado com sucesso."})

@app.route("/api/load", methods=["GET"])
def load_game():
    """Load the current player session state."""
    state = session.get("game_state", None)
    return jsonify({"success": bool(state), "state": state})

@app.route("/api/reset", methods=["POST"])
def reset_game():
    """Reset session state."""
    session.pop("game_state", None)
    return jsonify({"success": True, "message": "Linha do tempo reiniciada."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
