from crypto.entropy_analysis import calculate_shannon_entropy, analyze_entropy_drift
from quantum.coherence import CoherenceEngine
from quantum.trust_engine import TrustEngine
from quantum.inference import DisturbanceInference

class QDAE:
    """
    Quantum Disturbance Analytics Engine (QDAE)
    The main intelligence layer that orchestrates real-time telemetry extraction.
    """
    
    @staticmethod
    def analyze(tx_id: str, transmission: dict, quantum: dict, noise_level: float = 0.0) -> dict:
        # 1. Entropy Analysis
        # Assume ideal entropy for a random ciphertext is ~7.99 for small messages
        ideal_entropy = 7.95 
        current_data = transmission.get("decrypted", "").encode() if transmission.get("decrypted") else b""
        current_entropy = calculate_shannon_entropy(current_data)
        drift = analyze_entropy_drift(ideal_entropy, current_entropy)
        
        # 2. Coherence Analysis
        network_stats = CoherenceEngine.simulate_network_signals(noise_level)
        coherence_score = CoherenceEngine.calculate_coherence(
            network_stats["jitter"], 
            network_stats["delay_variance"], 
            network_stats["retransmissions"]
        )
        
        # 3. Trust Scoring
        qber = quantum.get("error_rate", 0.0)
        integrity = transmission.get("crcValid", True)
        
        trust_score = TrustEngine.calculate_trust_score(
            qber, drift, coherence_score, integrity
        )
        
        # 4. Threat Inference
        inference = DisturbanceInference.infer_attack_vector(
            qber, drift, coherence_score, integrity
        )
        
        return {
            "txId": tx_id,
            "metrics": {
                "qber": round(qber, 4),
                "entropy": round(current_entropy, 3),
                "entropyDrift": round(drift, 4),
                "coherence": round(coherence_score, 3),
                "network": network_stats
            },
            "intelligence": {
                "trustScore": trust_score,
                "threatLevel": TrustEngine.map_threat_level(trust_score),
                "inference": inference
            }
        }
