# Q-SecCom: Next-Gen Secure Communication System

Q-SecCom is a futuristic full-stack secure communication simulation dashboard. It combines real AES-256 encryption, Diffie-Hellman key exchange, CRC-32 integrity verification, Socket.IO event streaming, and a BB84-inspired quantum disturbance detector with a cyberpunk React interface.

## Features

- Cyberpunk landing page with particle effects, glassmorphism panels, glowing borders, and motion transitions
- Main operations dashboard with sender, receiver, live channel, attacker node, logs, and analytics
- Real AES-256-CBC encryption using PyCryptodome
- Diffie-Hellman session exchange for shared AES key derivation
- CRC-32 sender/receiver integrity verification
- BB84-inspired quantum simulation with random bits, random bases, basis comparison, error-rate scoring, and eavesdropping detection
- Socket.IO communication for live logs, packet phases, and simulation results
- Three.js quantum visualization with qubits, rings, particles, beams, and attack/noise color states
- Attack controls for interception, CRC tampering, and quantum noise
- Live metrics for encryption strength, quantum stability, error rate, packet integrity, threat level, and secure-channel status

## Project Structure

```text
q-seccom/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── visuals/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py
│   ├── crypto/
│   ├── quantum/
│   ├── networking/
│   └── requirements.txt
└── README.md
```

## Setup

### Backend

```bash
cd q-seccom/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd q-seccom/frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Usage

1. Open the landing page.
2. Launch the dashboard.
3. Enter a payload and choose a communication mode.
4. Click `Transmit Secure Packet`.
5. Use attack controls to simulate interception, CRC tampering, or quantum noise.
6. Watch the 3D channel, receiver analytics, and live logs update in real time.

## Communication Modes

- Normal Encrypted Communication
- CRC Error Detection
- Eavesdropping Detection
- Quantum Interference Simulation
- Quantum Secure Transmission

## Screenshots

Add screenshots after launch:

- `docs/screenshots/landing.png`
- `docs/screenshots/dashboard-stable.png`
- `docs/screenshots/dashboard-attack.png`

## Research Notes

The BB84 module is a quantum-inspired educational simulation, not a physical quantum key distribution implementation. It models basis selection, measurement disturbance, and sampled error-rate detection to visualize how observation can reveal interference in a secure communication channel.
