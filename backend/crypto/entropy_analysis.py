from collections import Counter
import math

def calculate_shannon_entropy(data: bytes) -> float:
    """
    Computes the Shannon entropy of a byte stream.
    Max entropy for bytes is 8.0 bits per byte.
    """
    if not data:
        return 0.0
        
    freq = Counter(data)
    len_data = len(data)
    probs = [c / len_data for c in freq.values()]
    return -sum(p * math.log2(p) for p in probs)

def analyze_entropy_drift(original_entropy: float, current_entropy: float) -> float:
    """
    Calculates the relative drift in entropy.
    Used to detect subtle reconstruction or tampering patterns.
    """
    if original_entropy == 0:
        return 0.0
    return abs(current_entropy - original_entropy) / original_entropy
