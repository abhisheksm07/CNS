from datetime import datetime, UTC
from pathlib import Path

import eventlet
eventlet.monkey_patch()

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

import uuid
from crypto.secure_channel import simulate_secure_transmission
from quantum.bb84 import run_bb84_simulation
from quantum.disturbance_engine import QDAE


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


@app.route("/api/simulate", methods=["POST", "OPTIONS"])
def simulate():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200
        
    data = request.get_json() or {}
    message = data.get("message", "Test Pulse")
    mode = data.get("mode", "normal")
    manipulations = data.get("manipulations", {})
    
    # Map UI modes to simulation flags
    tamper_crc = mode == "crc-error" or any(m == "crc-tamper" for m in manipulations.values())
    eavesdrop = mode == "eavesdrop" or any(m == "eavesdrop" for m in manipulations.values())
    noise = mode == "interference" or any(m == "quantum-noise" for m in manipulations.values())
    
    # Run heavy simulations
    transmission = simulate_secure_transmission(message, tamper_crc=tamper_crc, intercept=eavesdrop, reveal_decrypted=True)
    quantum_result = run_bb84_simulation(eavesdrop=eavesdrop, noise=noise).__dict__
    metrics = build_metrics(transmission, quantum_result, "sim")
    
    # NEW Intelligence Layer
    analytics = QDAE.analyze("sim-tx", transmission, quantum_result, noise_level=0.5 if noise else 0.0)
    
    return jsonify({
        "transmission": transmission,
        "quantum": {
            "bits": quantum_result["bits"],
            "error_rate": quantum_result["error_rate"],
            "stability": quantum_result["stability"],
            "compared_bits": quantum_result["compared_bits"],
            "sampled_errors": quantum_result["sampled_errors"],
            "detected": quantum_result["detected"]
        },
        "metrics": metrics,
        "analytics": analytics,
        "visualState": "stable"
    })


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

    analytics = QDAE.analyze("manual-tx", transmission, quantum_result, noise_level=0.5 if noise else 0.0)
 
    response = {
        "transmission": transmission,
        "quantum": quantum_result,
        "metrics": metrics,
        "analytics": analytics,
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


# ── Live Session State ──────────────────────────────────────────────────────
ROOMS = {}  # { room_id: { manipulation: 'none' } }
ACTIVE_TRANSMISSIONS = {} # { tx_id: { room_id: str, sender: str, intercepted: bool, type: str, current_step: str } }

LIVE_STEPS = [
    ("compose",        0,   0.15),
    ("key-exchange",   9,   0.20),
    ("crc-generate",  18,   0.20),
    ("encrypt",       27,   0.20),
    ("quantum-encode", 36,  0.25),
    ("transmit",      45,   0.75),   # packet in flight (Still enough time to hook)
    ("intercept",     55,   0.75),   # attacker window
    ("decrypt",       65,   0.20),
    ("crc-verify",    75,   0.20),
    ("basis-compare", 85,   0.25),
    ("result",       100,   0.10),
]


@socketio.on("session:join")
def handle_session_join(payload):
    from flask_socketio import join_room
    payload = payload or {}
    room_id = payload.get("roomId", "default-room")
    role    = payload.get("role", "observer")
    join_room(room_id)
    
    if room_id not in ROOMS:
        ROOMS[room_id] = {"manipulation": "none"}
        
    emit("session:joined", {"roomId": room_id, "role": role, "time": now(), "manipulation": ROOMS[room_id]["manipulation"]})
    push_log("info", f"[SESSION] {role} joined room '{room_id}'", "system")


@socketio.on("attacker:hook")
def handle_attacker_hook(payload):
    payload = payload or {}
    tx_id = payload.get("txId")
    if tx_id in ACTIVE_TRANSMISSIONS:
        emit("attacker:hook:ack", {"txId": tx_id, "status": "hooked", "tx": ACTIVE_TRANSMISSIONS[tx_id]})
    else:
        emit("attacker:hook:ack", {"txId": tx_id, "status": "failed", "reason": "Packet expired or invalid"})


@socketio.on("attacker:trigger")
def handle_attacker_trigger(payload):
    payload = payload or {}
    tx_id = payload.get("txId")
    manipulation = payload.get("manipulation", "eavesdrop")
    
    if tx_id in ACTIVE_TRANSMISSIONS:
        # Check if the transmission is in a valid state for interception
        current_step = ACTIVE_TRANSMISSIONS[tx_id].get("stepId")
        if current_step in ("transmit", "intercept", "quantum-encode"):
            ACTIVE_TRANSMISSIONS[tx_id]["intercepted"] = True
            ACTIVE_TRANSMISSIONS[tx_id]["type"] = manipulation
            emit("attacker:trigger:ack", {"txId": tx_id, "status": "success", "type": manipulation})
            push_log("critical", f"[ATTACK] Real-time interception triggered on TX:{tx_id[:8]}", "attack")
        else:
            emit("attacker:trigger:ack", {"txId": tx_id, "status": "failed", "reason": "Interception window closed"})
    else:
        emit("attacker:trigger:ack", {"txId": tx_id, "status": "failed", "reason": "Packet lost"})


@socketio.on("sender:message")
def handle_sender_message(payload):
    from flask_socketio import emit as room_emit
    payload      = payload or {}
    room_id      = payload.get("roomId", "default-room")
    message      = payload.get("message") or "Quantum pulse acknowledged."
    sender_name  = payload.get("sender", "Alice")
    
    tx_id = str(uuid.uuid4())
    print(f"[DEBUG] New message from {sender_name} in room {room_id}. TX_ID: {tx_id}")
    
    ACTIVE_TRANSMISSIONS[tx_id] = {
        "room_id": room_id,
        "sender": sender_name,
        "intercepted": False,
        "type": "none",
        "stepId": "compose",
        "progress": 0
    }

    push_log("info", f"[LIVE] Transmission {tx_id[:8]} started by {sender_name}", "tx")
    
    # Broadcast to all attackers (Global Sniffer)
    print(f"[DEBUG] Broadcasting detection event for {tx_id}")
    socketio.emit("global:sniffer:packet", {
        "txId": tx_id,
        "roomId": room_id,
        "sender": sender_name,
        "time": now()
    })

    # Emit each protocol step with a delay
    for step_id, progress, delay in LIVE_STEPS:
        ACTIVE_TRANSMISSIONS[tx_id]["stepId"] = step_id
        ACTIVE_TRANSMISSIONS[tx_id]["progress"] = progress
        
        # Check if an attack has been triggered during the loop
        is_intercepted = ACTIVE_TRANSMISSIONS[tx_id]["intercepted"]
        current_manipulation = ACTIVE_TRANSMISSIONS[tx_id]["type"] if is_intercepted else "none"
        
        visual_state = (
            "attack" if current_manipulation == "eavesdrop" else
            "crc"    if current_manipulation == "crc-tamper" else
            "noise"  if current_manipulation == "quantum-noise" else
            "stable"
        )

        # Broadcast to specific room (Dashboard/Receiver) AND global sniffer (Attacker)
        step_payload = {
            "txId":         tx_id,
            "stepId":       step_id,
            "progress":     progress,
            "state":        visual_state if step_id in ("intercept", "transmit", "basis-compare", "result") else "stable",
            "manipulation": current_manipulation,
            "roomId":       room_id,
            "time":         now(),
        }
        socketio.emit("sim:step", step_payload, room=room_id)
        socketio.emit("sim:step", step_payload) # Global broadcast for sniffer
        
        socketio.sleep(delay)

    # Final logic based on whether the packet was intercepted in-flight
    final_tx = ACTIVE_TRANSMISSIONS.pop(tx_id)
    is_intercepted = final_tx["intercepted"]
    manipulation = final_tx["type"]

    eavesdrop    = manipulation == "eavesdrop"
    tamper_crc   = manipulation == "crc-tamper"
    noise        = manipulation == "quantum-noise"

    # Run the real crypto + quantum simulation
    transmission  = simulate_secure_transmission(message, tamper_crc=tamper_crc, intercept=eavesdrop, reveal_decrypted=True)
    quantum_result = run_bb84_simulation(eavesdrop=eavesdrop, noise=noise).__dict__
    metrics       = build_metrics(transmission, quantum_result, "live")

    # Emit full quantum detail
    quantum_payload = {
        "txId":          tx_id,
        "bits":          quantum_result["bits"],
        "senderBases":   quantum_result["sender_bases"],
        "receiverBases": quantum_result["receiver_bases"],
        "errorRate":     quantum_result["error_rate"],
        "detected":      quantum_result["detected"],
        "sampledErrors": quantum_result["sampled_errors"],
        "comparedBits":  quantum_result["compared_bits"],
        "stability":     quantum_result["stability"],
        "roomId":        room_id,
        "time":          now(),
    }
    socketio.emit("sim:quantum", quantum_payload, room=room_id)
    socketio.emit("sim:quantum", quantum_payload) # Global broadcast
 
    # NEW Intelligence Layer
    analytics = QDAE.analyze(tx_id, transmission, quantum_result, noise_level=0.5 if noise else 0.0)
    socketio.emit("sim:analytics", analytics, room=room_id)
    socketio.emit("sim:analytics", analytics) # Global broadcast

    # Deliver the message to the Receiver
    recv_payload = {
        "txId":       tx_id,
        "sender":     sender_name,
        "decrypted":  transmission["decrypted"],
        "crcValid":   transmission["crcValid"],
        "secure":     metrics["secure"],
        "metrics":    metrics,
        "intercepted": transmission["intercepted"],
        "manipulation": manipulation,
        "roomId":     room_id,
        "time":       now(),
    }
    socketio.emit("recv:message", recv_payload, room=room_id)
    socketio.emit("recv:message", recv_payload) # Global broadcast

    if quantum_result["detected"]:
        push_log("critical", f"[LIVE] BB84 disturbance detected: {metrics['errorRate']}% error rate.", "quantum")
    if eavesdrop:
        push_log("critical", "[LIVE] Eavesdropping vector active on channel.", "attack")
    if tamper_crc:
        push_log("warn", "[LIVE] CRC tamper injected — receiver will see mismatch.", "crc")
    if metrics["secure"]:
        push_log("success", "[LIVE] Secure channel confirmed. Payload released.", "rx")
    else:
        push_log("warn", "[LIVE] Channel integrity compromised.", "rx")


if __name__ == "__main__":
    push_log("info", "Q-SecCom backend boot sequence complete.", "system")
    socketio.run(app, host="0.0.0.0", port=5000, debug=False, use_reloader=False)
