import base64
import hashlib
import secrets
import zlib
from dataclasses import dataclass

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad


P = int(
    "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E08"
    "8A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B"
    "302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9"
    "A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE6"
    "49286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8"
    "FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D"
    "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C"
    "180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF695581718"
    "3995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFF"
    "FFFFFFFF",
    16,
)
G = 2


@dataclass
class DHExchange:
    alice_public: int
    bob_public: int
    shared_secret: str
    aes_key: bytes


def create_diffie_hellman_exchange() -> DHExchange:
    alice_private = secrets.randbelow(P - 3) + 2
    bob_private = secrets.randbelow(P - 3) + 2
    alice_public = pow(G, alice_private, P)
    bob_public = pow(G, bob_private, P)
    shared = pow(bob_public, alice_private, P)
    shared_secret = hex(shared)[2:]
    aes_key = hashlib.sha256(str(shared).encode("utf-8")).digest()
    return DHExchange(
        alice_public=alice_public,
        bob_public=bob_public,
        shared_secret=shared_secret,
        aes_key=aes_key,
    )


def crc32_hex(message: str) -> str:
    return f"{zlib.crc32(message.encode('utf-8')) & 0xFFFFFFFF:08X}"


def encrypt_message(message: str, key: bytes) -> dict:
    iv = secrets.token_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(pad(message.encode("utf-8"), AES.block_size))
    return {
        "iv": base64.b64encode(iv).decode("utf-8"),
        "ciphertext": base64.b64encode(ciphertext).decode("utf-8"),
    }


def decrypt_message(payload: dict, key: bytes) -> str:
    iv = base64.b64decode(payload["iv"])
    ciphertext = base64.b64decode(payload["ciphertext"])
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(ciphertext), AES.block_size).decode("utf-8")


def simulate_secure_transmission(message: str, tamper_crc: bool = False, intercept: bool = False, reveal_decrypted: bool = True) -> dict:
    exchange = create_diffie_hellman_exchange()
    encrypted = encrypt_message(message, exchange.aes_key)
    decrypted = decrypt_message(encrypted, exchange.aes_key)

    sent_crc = crc32_hex(message)
    received_message = decrypted
    if tamper_crc:
        received_message = f"{decrypted}#"
    received_crc = crc32_hex(received_message)

    return {
        "original": message,
        "encrypted": encrypted["ciphertext"],
        "iv": encrypted["iv"],
        "decrypted": received_message if reveal_decrypted else "",
        "sharedSecret": exchange.shared_secret[:64],
        "alicePublic": hex(exchange.alice_public)[2:34],
        "bobPublic": hex(exchange.bob_public)[2:34],
        "crc": sent_crc,
        "receivedCrc": received_crc,
        "crcValid": sent_crc == received_crc,
        "aesBits": 256,
        "intercepted": intercept,
    }
