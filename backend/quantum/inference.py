class DisturbanceInference:
    """
    Infers the type of network disturbance based on combined telemetry signals.
    """
    
    @staticmethod
    def infer_attack_vector(
        qber: float, 
        entropy_drift: float, 
        coherence_score: float, 
        integrity_valid: bool
    ) -> dict:
        """
        Identifies probable attack patterns.
        """
        confidence = 0.0
        vector = "NORMAL"
        diagnosis = "Channel parameters are within safe operational bounds."
        
        # 1. Eavesdropping Detection (High QBER, Low Entropy Drift)
        if qber > 0.18:
            vector = "EAVESDROP"
            confidence = min(0.98, qber * 3.5)
            diagnosis = "Significant QBER detected. High probability of passive quantum observation."
            
        # 2. MITM / Tampering Detection (Entropy Drift + Integrity Fail)
        elif not integrity_valid or entropy_drift > 0.12:
            vector = "MITM / TAMPER"
            confidence = 0.85 if not integrity_valid else 0.45
            diagnosis = "Payload integrity mismatch or entropy drift detected. Probable data manipulation."
            
        # 3. High Interference / Noise (Coherence Loss)
        elif coherence_score < 0.7:
            vector = "NOISE / DOS"
            confidence = (1.0 - coherence_score) * 1.5
            diagnosis = "Phase coherence collapse. Channel is experiencing high environmental or intentional noise."

        return {
            "type": vector,
            "confidence": round(confidence, 2),
            "diagnosis": diagnosis
        }
