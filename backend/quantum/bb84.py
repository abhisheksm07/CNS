import random
from dataclasses import dataclass


BASES = ["+", "x"]


@dataclass
class BB84Result:
    bits: list[int]
    sender_bases: list[str]
    receiver_bases: list[str]
    sampled_errors: int
    compared_bits: int
    error_rate: float
    detected: bool
    stability: float


def run_bb84_simulation(length: int = 48, eavesdrop: bool = False, noise: bool = False) -> BB84Result:
    bits = [random.randint(0, 1) for _ in range(length)]
    sender_bases = [random.choice(BASES) for _ in range(length)]
    receiver_bases = [random.choice(BASES) for _ in range(length)]
    measured = []

    for bit, sender_basis, receiver_basis in zip(bits, sender_bases, receiver_bases):
        candidate = bit
        if eavesdrop and random.random() < 0.42:
            attacker_basis = random.choice(BASES)
            if attacker_basis != sender_basis:
                candidate = random.randint(0, 1)
        if noise and random.random() < 0.22:
            candidate = 1 - candidate
        if receiver_basis != sender_basis:
            candidate = random.randint(0, 1)
        measured.append(candidate)

    matching_indexes = [i for i, pair in enumerate(zip(sender_bases, receiver_bases)) if pair[0] == pair[1]]
    sample = matching_indexes[: max(6, len(matching_indexes) // 2)]
    if eavesdrop:
        for i in sample:
            if random.random() < 0.34:
                measured[i] = 1 - bits[i]

    errors = sum(1 for i in sample if bits[i] != measured[i])
    compared = max(1, len(sample))
    error_rate = errors / compared
    detected = error_rate > 0.18
    stability = max(0.0, 1.0 - error_rate)

    return BB84Result(
        bits=bits,
        sender_bases=sender_bases,
        receiver_bases=receiver_bases,
        sampled_errors=errors,
        compared_bits=compared,
        error_rate=round(error_rate, 3),
        detected=detected,
        stability=round(stability, 3),
    )
