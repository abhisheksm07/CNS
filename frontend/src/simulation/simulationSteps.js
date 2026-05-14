export const SIMULATION_STEPS = [
  {
    id: "compose",
    symbol: "M",
    title: "Message Composition",
    shortLabel: "Compose",
    description: "Sender prepares the plaintext payload. No packet has left the sender node yet.",
    color: "cyan",
    canManipulate: false,
    log: "[STEP] Message composed at sender node"
  },
  {
    id: "key-exchange",
    symbol: "K",
    title: "Diffie-Hellman Key Exchange",
    shortLabel: "Key",
    description: "Sender and receiver exchange public values and derive a shared secret.",
    color: "blue",
    canManipulate: true,
    log: "[KEY] Diffie-Hellman exchange initialized"
  },
  {
    id: "crc-generate",
    symbol: "C",
    title: "CRC Generation",
    shortLabel: "CRC",
    description: "A CRC-32 checksum is generated so the receiver can detect tampering.",
    color: "yellow",
    canManipulate: true,
    log: "[CRC] Checksum generated"
  },
  {
    id: "encrypt",
    symbol: "E",
    title: "AES Encryption",
    shortLabel: "Encrypt",
    description: "The plaintext and CRC-protected packet are encrypted with AES-256.",
    color: "violet",
    canManipulate: true,
    log: "[AES] Payload encrypted"
  },
  {
    id: "quantum-encode",
    symbol: "Q",
    title: "Quantum Basis Encoding",
    shortLabel: "Encode",
    description: "BB84-inspired random bits and bases are generated for disturbance detection.",
    color: "violet",
    canManipulate: true,
    log: "[QKD] BB84 bases generated"
  },
  {
    id: "transmit",
    symbol: "T",
    title: "Channel Transmission",
    shortLabel: "Transmit",
    description: "The encrypted packet moves across the quantum communication channel.",
    color: "cyan",
    canManipulate: true,
    log: "[CHANNEL] Packet traveling through quantum channel"
  },
  {
    id: "intercept",
    symbol: "A",
    title: "Interception Window",
    shortLabel: "Intercept",
    description: "The attacker window opens. Eavesdropping or quantum interference can be injected.",
    color: "red",
    canManipulate: true,
    log: "[ATTACK] Interception window opened"
  },
  {
    id: "decrypt",
    symbol: "D",
    title: "AES Decryption",
    shortLabel: "Decrypt",
    description: "The receiver decrypts the packet using the shared session key.",
    color: "blue",
    canManipulate: false,
    log: "[AES] Receiver decrypted packet"
  },
  {
    id: "crc-verify",
    symbol: "V",
    title: "CRC Verification",
    shortLabel: "Verify",
    description: "The receiver recalculates CRC-32 and compares it with the sender checksum.",
    color: "yellow",
    canManipulate: false,
    log: "[VERIFY] CRC verification executed"
  },
  {
    id: "basis-compare",
    symbol: "B",
    title: "BB84 Basis Comparison",
    shortLabel: "Basis",
    description: "Sender and receiver bases are compared to estimate quantum-channel disturbance.",
    color: "violet",
    canManipulate: false,
    log: "[QKD] Quantum bases compared"
  },
  {
    id: "result",
    symbol: "R",
    title: "Final Security Result",
    shortLabel: "Result",
    description: "Final receiver output, CRC status, quantum error rate, and threat level are revealed.",
    color: "green",
    canManipulate: false,
    log: "[RESULT] Final security decision calculated"
  }
];

export const MANIPULATIONS = [
  {
    id: "none",
    label: "No Manipulation",
    description: "Keep this stage stable.",
    tone: "cyan"
  },
  {
    id: "eavesdrop",
    label: "Eavesdropping",
    description: "Inject observation disturbance into BB84 sampling.",
    tone: "red"
  },
  {
    id: "crc-tamper",
    label: "CRC Tampering",
    description: "Alter packet data so receiver CRC fails.",
    tone: "yellow"
  },
  {
    id: "quantum-noise",
    label: "Quantum Noise",
    description: "Add violet basis instability and mismatch pressure.",
    tone: "violet"
  }
];

export function createLog(message, category = "sim", level = "info") {
  return {
    time: new Date().toISOString(),
    level,
    category,
    message
  };
}
