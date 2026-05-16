class TrustEngine:
    """
    The core scoring engine that aggregates signals from 
    Quantum (BB84), Classical (AES/CRC), and Network (Coherence) layers.
    """
    
    @staticmethod
    def calculate_trust_score(
        qber: float, 
        entropy_drift: float, 
        coherence_score: float, 
        integrity_valid: bool
    ) -> float:
        """
        Computes the final Channel Trust Score (0-100).
        """
        # Base score
        score = 100.0
        
        # QBER Penalty (Heavy weight: 40 points)
        # Safe < 0.05, Warning < 0.15, Critical > 0.30
        qber_penalty = min(40.0, qber * 100.0 * 1.3)
        score -= qber_penalty
        
        # Entropy Drift Penalty (Medium weight: 20 points)
        # Drift > 0.1 indicates potential pattern analysis
        entropy_penalty = min(20.0, entropy_drift * 100.0 * 2.0)
        score -= entropy_penalty
        
        # Coherence Penalty (Medium weight: 20 points)
        # loss of coherence indicates instability or interference
        coherence_penalty = (1.0 - coherence_score) * 20.0
        score -= coherence_penalty
        
        # Integrity Penalty (Medium weight: 20 points)
        if not integrity_valid:
            score -= 20.0
            
        return max(0.0, min(100.0, round(score, 1)))

    @staticmethod
    def map_threat_level(score: float) -> str:
        if score > 85: return "LOW"
        if score > 60: return "ELEVATED"
        if score > 35: return "HIGH"
        return "CRITICAL"
