from datetime import datetime, UTC
from pathlib import Path

import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from crypto.secure_channel import simulate_secure_transmission
from quantum.bb84 import run_bb84_simulation


BASE_DIR = Path(__file__).resolve().parent
LOGS: list[dict] = []

app = Flask(__name__)
app.config["SECRET_KEY"] = "q-seccom-dev-secret"
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")


def now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def push_log(level: str, message: str, category: str = "system") -> dict:
    item = {"time": now(), "level": level, "category": category, "message": message}
    LOGS.insert(0, item)
    del LOGS[120:]
    socketio.emit("log:event", item)
    return item


def build_metrics(transmission: dict, quantum: dict, mode: str) -> dict:
    integrity = 100 if transmission["crcValid"] else 43
    threat = 15
    if quantum["detected"]:
        threat += 55
    if not transmission["crcValid"]:
        threat += 30
    if transmission["intercepted"]:
        threat += 20
    return {
        "encryptionStrength": transmission["aesBits"],
        "quantumStability": round(quantum["stability"] * 100),
        "errorRate": round(quantum["error_rate"] * 100, 1),
        "packetIntegrity": integrity,
        "threatLevel": min(100, threat),
        "secure": integrity > 90 and not quantum["detected"],
        "mode": mode,
    }


@app.get("/api/health")
def health():
    return jsonify({"status": "online", "service": "Q-SecCom Core", "time": now()})


@app.get("/api/logs")
def logs():
    return jsonify(LOGS)


@app.post("/api/transmit")
def transmit():
    payload = request.get_json(force=True)
    result = run_simulation(payload)
    return jsonify(result)


def run_simulation(payload: dict) -> dict:
    message = payload.get("message") or "Quantum secure pulse acknowledged."
    mode = payload.get("mode", "quantum-secure")
    attack = payload.get("attack")
    dry_run = bool(payload.get("dryRun", False))
    step_manipulations = payload.get("stepManipulations", {}) or {}
    manipulation_values = set(step_manipulations.values())
    tamper_crc = (not dry_run) and (mode == "crc-error" or attack == "tamper" or "crc-tamper" in manipulation_values)
    intercept = (not dry_run) and (mode == "eavesdrop" or attack == "intercept" or "eavesdrop" in manipulation_values)
    noise = (not dry_run) and (mode == "interference" or attack == "noise" or "quantum-noise" in manipulation_values)

    push_log("info", f"{'Dry-run prepared' if dry_run else 'Final simulation queued'} in {mode} mode.", "tx")
    transmission = simulate_secure_transmission(message, tamper_crc=tamper_crc, intercept=intercept, reveal_decrypted=not dry_run)
    quantum_result = run_bb84_simulation(eavesdrop=intercept, noise=noise).__dict__
    metrics = build_metrics(transmission, quantum_result, mode)

    if dry_run:
        push_log("info", "Packet prepared. Receiver output locked until result stage.", "sim")
    if not dry_run and not transmission["crcValid"]:
        push_log("warn", "CRC mismatch found during receiver verification.", "crc")
    if not dry_run and quantum_result["detected"]:
        push_log("critical", f"BB84 disturbance detected: {metrics['errorRate']}% error rate.", "quantum")
    if not dry_run and intercept:
        push_log("critical", "Interception vector visualized on the channel.", "attack")
    if not dry_run and noise:
        push_log("warn", "Quantum noise injected into basis comparison stream.", "quantum")
    if not dry_run and metrics["secure"]:
        push_log("success", "Secure channel verified. Payload released to receiver.", "rx")

    response = {
        "transmission": transmission,
        "quantum": quantum_result,
        "metrics": metrics,
        "dryRun": dry_run,
        "stepManipulations": step_manipulations,
        "visualState": "attack" if quantum_result["detected"] or intercept else "crc" if not transmission["crcValid"] else "noise" if noise else "stable",
    }
    socketio.emit("simulation:result", response)
    if not dry_run:
        for phase in ["decrypt", "crc-verify", "basis-compare", "result"]:
            socketio.emit("packet:phase", {"phase": phase, "time": now(), "state": response["visualState"]})
            socketio.sleep(0.08)
    return response


@socketio.on("connect")
def handle_connect():
    emit("system:status", {"status": "connected", "time": now()})
    push_log("info", "Operator console connected to Q-SecCom core.", "system")


@socketio.on("simulation:run")
def socket_run(payload):
    emit("simulation:result", run_simulation(payload or {}))


if __name__ == "__main__":
    push_log("info", "Q-SecCom backend boot sequence complete.", "system")
    socketio.run(app, host="0.0.0.0", port=5000, debug=False, use_reloader=False)
