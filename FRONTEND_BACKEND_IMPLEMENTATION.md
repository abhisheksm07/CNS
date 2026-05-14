# Q-SecCom Frontend Design and Backend Implementation

This document describes the complete implementation of **Q-SecCom: Next-Gen Secure Communication System with Quantum-Inspired Detection**. It covers the frontend design, user experience, real-time data flow, backend cryptography, quantum-inspired detection, and API/socket integration.

## 1. System Overview

Q-SecCom is a futuristic secure communication simulation platform. The application demonstrates how a sender can transmit an encrypted payload to a receiver while the system visualizes encryption, packet movement, CRC integrity verification, and quantum-inspired eavesdropping detection.

The system is split into two main layers:

- **Frontend:** React + Vite dashboard with Tailwind CSS, Framer Motion, Three.js, Socket.IO client, and Lucide icons.
- **Backend:** Flask + Flask-SocketIO server using PyCryptodome for AES encryption, Diffie-Hellman key exchange, CRC-32 integrity checks, and BB84-inspired disturbance detection.

## 2. Project Structure

```text
q-seccom/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveLogs.jsx
│   │   │   ├── MetricCard.jsx
│   │   │   ├── Panel.jsx
│   │   │   ├── ParticleField.jsx
│   │   │   └── StatusPill.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Landing.jsx
│   │   ├── visuals/
│   │   │   └── QuantumScene.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── app.py
│   ├── crypto/
│   │   └── secure_channel.py
│   ├── quantum/
│   │   └── bb84.py
│   ├── networking/
│   └── requirements.txt
└── README.md
```

## 3. Frontend Design

### 3.1 Visual Direction

The frontend uses a futuristic cyber-security command center style:

- Dark cyberpunk background
- Neon cyan, violet, red, and yellow signal colors
- Glassmorphism panels
- Animated glowing borders
- Holographic grid overlays
- Particle background effects
- 3D quantum visualization
- Motion-driven state transitions

The design is intentionally dashboard-first rather than landing-page-heavy. The main screen focuses on operational clarity: sender controls, animated quantum channel, receiver analytics, and live event logs.

### 3.2 Color System

Primary colors are defined in `tailwind.config.js`:

```js
colors: {
  void: "#050712",
  panel: "rgba(9, 16, 35, 0.72)",
  cyanline: "#2ffcff",
  violetline: "#9a5cff",
  danger: "#ff315e",
  signal: "#ffd166"
}
```

Color meanings:

- **Cyan/blue:** stable secure communication
- **Violet:** quantum interference or noise
- **Yellow:** CRC mismatch or packet integrity warning
- **Red:** eavesdropping, interception, or threat detection
- **Green:** verified/secure status

### 3.3 Typography

The UI uses three fonts loaded from Google Fonts:

- **Orbitron:** futuristic display headings and symbols
- **Rajdhani:** technical labels and dashboard text
- **Inter:** readable body text

The result is a technical research-console style while keeping dashboard content readable.

### 3.4 Landing Page

Implemented in:

```text
frontend/src/pages/Landing.jsx
```

The landing page includes:

- Hero section for Q-SecCom
- Particle background
- Animated transmission preview
- Feature cards
- Quantum security overview
- Communication simulation preview
- Footer

The launch button switches the React view to the main dashboard.

### 3.5 Dashboard Layout

Implemented in:

```text
frontend/src/pages/Dashboard.jsx
```

The dashboard uses a three-column layout on large screens:

```text
┌────────────────┬──────────────────────┬────────────────┐
│ Sender Panel   │ Quantum Channel      │ Receiver Panel │
│                │ 3D + bit animation   │                │
└────────────────┴──────────────────────┴────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Live Logs                                               │
└─────────────────────────────────────────────────────────┘
```

#### Left Panel: Sender Node

Includes:

- Payload text input
- Communication mode selector
- Transmit button
- Attack simulation buttons
- Original message display
- Shared secret display
- CRC display

Supported modes:

- Normal Encrypted Communication
- CRC Error Detection
- Eavesdropping Detection
- Quantum Interference Simulation
- Quantum Secure Transmission

Attack buttons:

- Simulate Interception
- Simulate CRC Tampering
- Simulate Quantum Noise

#### Center Panel: Animated Quantum Channel

Implemented through:

```text
frontend/src/visuals/QuantumScene.jsx
```

The center channel combines Three.js and HTML overlays.

3D elements:

- Rotating qubits
- Energy rings
- Star/particle field
- Communication beam
- Additive particle stream
- Orbiting holographic motion

Integrated explanatory overlay:

- `S` sender symbol
- `R` receiver symbol
- `A` attacker symbol
- Two animated quantum bit carriers: `B0` and `B1`
- Active step symbol and text description

Step symbols:

| Symbol | Step | Meaning |
|---|---|---|
| `K` | Key Exchange | Diffie-Hellman creates the shared session secret |
| `E` | AES Encryption | Payload is encrypted and represented as quantum bit carriers |
| `T` | Two-Bit Transit | Two encrypted bit symbols move through the channel |
| `C` | CRC Check | Receiver verifies packet integrity |
| `Q` | Basis Compare | BB84-inspired basis comparison detects disturbance |

The visual color changes depending on backend state:

- `stable`: cyan/blue
- `attack`: red
- `crc`: yellow
- `noise`: violet

#### Right Panel: Receiver Analytics

Includes:

- AES strength
- Quantum stability
- Error rate
- Packet integrity
- Threat level
- Number of compared quantum bases
- Receiver output
- CRC verification result
- Quantum detection result
- Encrypted message preview

#### Bottom Panel: Live Logs

Implemented in:

```text
frontend/src/components/LiveLogs.jsx
```

Displays real-time events from the backend:

- Transmission events
- Attack logs
- CRC mismatch logs
- Quantum mismatch logs
- Receiver verification logs

### 3.6 Frontend State Flow

Main state variables in `Dashboard.jsx`:

```js
const [socketState, setSocketState] = useState("connecting");
const [message, setMessage] = useState("Transfer retinal vault seed to receiver node.");
const [mode, setMode] = useState("quantum-secure");
const [logs, setLogs] = useState([]);
const [result, setResult] = useState(defaultResult);
const [phase, setPhase] = useState("standby");
const [busy, setBusy] = useState(false);
```

Transmit flow:

1. User enters payload.
2. User selects communication mode.
3. User clicks transmit or attack simulation.
4. Frontend calls `POST /api/transmit`.
5. Backend returns encryption, CRC, quantum, visual, and metric data.
6. Frontend updates receiver panel and quantum visualization.
7. Socket.IO streams live logs and packet phase updates.

### 3.7 Real-Time Frontend Integration

The frontend connects to Socket.IO:

```js
const socket = useMemo(() => io(API, { transports: ["websocket", "polling"] }), []);
```

Handled socket events:

- `connect`
- `disconnect`
- `log:event`
- `packet:phase`
- `simulation:result`

The REST API is used as the guaranteed completion path for transmission. Socket.IO is used for live updates, logs, and phase animation.

## 4. Backend Implementation

### 4.1 Backend Entry Point

Implemented in:

```text
backend/app.py
```

The backend uses:

- Flask for REST APIs
- Flask-CORS for frontend access
- Flask-SocketIO for real-time events
- Eventlet as the async server

Core routes:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Confirms backend status |
| `GET` | `/api/logs` | Returns recent communication logs |
| `POST` | `/api/transmit` | Runs secure transmission simulation |

Socket events:

| Event | Direction | Purpose |
|---|---|---|
| `connect` | client to server | Registers console connection |
| `simulation:run` | client to server | Optional socket-triggered simulation |
| `simulation:result` | server to client | Broadcasts simulation output |
| `packet:phase` | server to client | Streams current transmission phase |
| `log:event` | server to client | Streams live logs |

### 4.2 Backend Simulation Flow

The main simulation function is:

```text
run_simulation(payload)
```

Flow:

1. Read message, communication mode, and attack type.
2. Determine if CRC tampering, interception, or noise should be simulated.
3. Run AES/Diffie-Hellman/CRC transmission.
4. Run BB84-inspired quantum detection.
5. Build live metrics.
6. Emit log events.
7. Emit simulation result.
8. Emit packet phase events:
   - `key-exchange`
   - `encrypt`
   - `transmit`
   - `verify`
   - `quantum-sift`
9. Return JSON response to frontend.

### 4.3 Cryptography Module

Implemented in:

```text
backend/crypto/secure_channel.py
```

Features:

- Diffie-Hellman key exchange
- AES-256 encryption
- AES decryption
- CRC-32 integrity verification
- Tamper simulation
- Interception state simulation

#### Diffie-Hellman Key Exchange

The backend uses a large safe-prime-style modulus and generator:

```python
P = int("FFFFFFFF...", 16)
G = 2
```

Private values are generated for Alice and Bob:

```python
alice_private = secrets.randbelow(P - 3) + 2
bob_private = secrets.randbelow(P - 3) + 2
```

Public values:

```python
alice_public = pow(G, alice_private, P)
bob_public = pow(G, bob_private, P)
```

Shared secret:

```python
shared = pow(bob_public, alice_private, P)
```

The AES key is derived with SHA-256:

```python
aes_key = hashlib.sha256(str(shared).encode("utf-8")).digest()
```

This produces a 256-bit AES key.

#### AES-256 Encryption

The backend uses PyCryptodome AES-CBC:

```python
cipher = AES.new(key, AES.MODE_CBC, iv)
ciphertext = cipher.encrypt(pad(message.encode("utf-8"), AES.block_size))
```

Returned values:

- Base64 IV
- Base64 ciphertext
- AES key strength
- Shared secret preview
- Sender public key preview
- Receiver public key preview

#### CRC-32 Integrity Verification

CRC is generated with Python `zlib`:

```python
zlib.crc32(message.encode("utf-8")) & 0xFFFFFFFF
```

The sender CRC and receiver CRC are compared:

```python
crcValid = sent_crc == received_crc
```

If CRC tampering is enabled, the decrypted receiver message is altered before CRC verification. This forces a mismatch.

### 4.4 Quantum-Inspired Detection Module

Implemented in:

```text
backend/quantum/bb84.py
```

The module simulates a BB84-inspired detection workflow.

Generated data:

- Random sender bits
- Random sender bases
- Random receiver bases
- Measured receiver bits
- Matching-basis sample set
- Sampled error count
- Error rate
- Stability score
- Detection boolean

Basis options:

```python
BASES = ["+", "x"]
```

Simulation flow:

1. Generate random bit sequence.
2. Generate random sender bases.
3. Generate random receiver bases.
4. If eavesdropping is active, simulate measurement disturbance.
5. If quantum noise is active, flip selected bits.
6. Compare only matching sender/receiver basis positions.
7. Calculate sampled errors.
8. Compute error rate.
9. Trigger detection if error rate exceeds threshold.

Detection condition:

```python
detected = error_rate > 0.18
```

Stability:

```python
stability = max(0.0, 1.0 - error_rate)
```

### 4.5 Metrics

The backend returns live metrics:

```python
{
  "encryptionStrength": 256,
  "quantumStability": ...,
  "errorRate": ...,
  "packetIntegrity": ...,
  "threatLevel": ...,
  "secure": ...
}
```

Metric meanings:

- **Encryption strength:** AES key length in bits
- **Quantum stability:** inverse of quantum error rate
- **Error rate:** sampled BB84-inspired mismatch rate
- **Packet integrity:** CRC success score
- **Threat level:** combined risk score from attacks, CRC mismatch, and quantum detection
- **Secure:** true only if CRC is valid and no quantum disturbance is detected

### 4.6 Visual State Mapping

The backend sends a `visualState` field:

```python
"attack" if quantum_result["detected"] or intercept
else "crc" if not transmission["crcValid"]
else "noise" if noise
else "stable"
```

Frontend uses this value to update:

- Beam color
- Bit carrier colors
- Status text
- Threat panel colors
- Receiver analytics
- Quantum detection message

## 5. API Response Shape

Example response from `POST /api/transmit`:

```json
{
  "transmission": {
    "original": "hello",
    "encrypted": "base64-ciphertext",
    "iv": "base64-iv",
    "decrypted": "hello",
    "sharedSecret": "secret-preview",
    "alicePublic": "public-preview",
    "bobPublic": "public-preview",
    "crc": "83DB2F8D",
    "receivedCrc": "83DB2F8D",
    "crcValid": true,
    "aesBits": 256,
    "intercepted": false
  },
  "quantum": {
    "bits": [1, 0, 1],
    "sender_bases": ["+", "x"],
    "receiver_bases": ["+", "+"],
    "sampled_errors": 0,
    "compared_bits": 12,
    "error_rate": 0.0,
    "detected": false,
    "stability": 1.0
  },
  "metrics": {
    "encryptionStrength": 256,
    "quantumStability": 100,
    "errorRate": 0,
    "packetIntegrity": 100,
    "threatLevel": 15,
    "secure": true,
    "mode": "quantum-secure"
  },
  "visualState": "stable"
}
```

## 6. Running the Project

### Backend

```bash
cd q-seccom/backend
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### Frontend

```bash
cd q-seccom/frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## 7. Current Verification

The project has been verified with:

- Frontend Vite build
- Backend health endpoint
- Backend transmit endpoint
- AES-256 encryption output
- CRC verification
- Eavesdropping detection
- Stable secure transmission response

Example verified transmit result:

```json
{
  "CrcValid": true,
  "AesBits": 256,
  "Visual": "stable",
  "Secure": true
}
```

## 8. Notes and Limitations

- The BB84 implementation is a quantum-inspired educational simulation, not physical quantum key distribution.
- Diffie-Hellman and AES are real cryptographic operations, but this project is a simulation dashboard and should not be used as a production security system without hardening.
- AES currently uses CBC mode with padding for clear educational visibility. A production system should prefer authenticated encryption such as AES-GCM.
- The shared secret shown in the UI is truncated for readability.
- The visualization prioritizes explanation and research demonstration over mathematical quantum-state rendering.

## 9. Main Files

Important frontend files:

- `frontend/src/pages/Landing.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/visuals/QuantumScene.jsx`
- `frontend/src/components/LiveLogs.jsx`
- `frontend/src/components/MetricCard.jsx`
- `frontend/src/index.css`

Important backend files:

- `backend/app.py`
- `backend/crypto/secure_channel.py`
- `backend/quantum/bb84.py`
- `backend/requirements.txt`

