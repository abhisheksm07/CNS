import random

class CoherenceEngine:
    """
    Simulates communication coherence, inspired by quantum phase stability.
    Translates network jitter and delay into a 'Coherence Score'.
    """
    
    @staticmethod
    def calculate_coherence(jitter: float, delay_variance: float, retransmissions: int) -> float:
        """
        Computes a coherence score between 0.0 and 1.0.
        Higher is better (more stable).
        """
        # Penalty factors
        jitter_penalty = min(0.4, jitter * 0.8)
        variance_penalty = min(0.3, delay_variance * 0.5)
        retrans_penalty = min(0.3, retransmissions * 0.1)
        
        score = 1.0 - (jitter_penalty + variance_penalty + retrans_penalty)
        return max(0.0, min(1.0, score))

    @staticmethod
    def simulate_network_signals(noise_level: float = 0.0) -> dict:
        """
        Generates realistic network telemetry based on environmental noise.
        """
        base_jitter = 0.05 + (noise_level * 0.4)
        base_variance = 0.02 + (noise_level * 0.3)
        retrans = 0 if noise_level < 0.2 else random.randint(1, 3) if noise_level < 0.6 else random.randint(4, 10)
        
        jitter = base_jitter * random.uniform(0.8, 1.2)
        variance = base_variance * random.uniform(0.7, 1.3)
        
        return {
            "jitter": round(jitter, 3),
            "delay_variance": round(variance, 3),
            "retransmissions": retrans
        }
