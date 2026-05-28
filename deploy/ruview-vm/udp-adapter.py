#!/usr/bin/env python3
"""UDP compatibility adapter for HomeMonitor RuView VM deployments.

RuView ESP32 firmware v0.6.x sends ADR-081 feature_state packets as the
default low-bandwidth upstream payload. Current wifi-densepose Docker builds
still update their UI from ADR-018 raw CSI and ADR-039 vitals packets. This
adapter sits on the public UDP port, forwards native packets unchanged, and
translates feature_state into a minimal vitals packet that RuView already
understands.
"""

from __future__ import annotations

import argparse
import socket
import struct
import time
import zlib


RAW_CSI_MAGIC = 0xC5110001
VITALS_MAGIC = 0xC5110002
FEATURE_STATE_MAGIC = 0xC5110006
FEATURE_STATE_SIZE = 60
VITALS_SIZE = 32

QFLAG_PRESENCE_VALID = 1 << 0
QFLAG_RESPIRATION_VALID = 1 << 1
QFLAG_HEARTBEAT_VALID = 1 << 2
QFLAG_ANOMALY_TRIGGERED = 1 << 3

FEATURE_STATE_STRUCT = struct.Struct("<IBBHQfffffffffHHI")


def parse_addr(value: str) -> tuple[str, int]:
    host, _, port = value.rpartition(":")
    if not host or not port:
        raise argparse.ArgumentTypeError("address must be host:port")
    return host, int(port)


def crc32_ieee(data: bytes) -> int:
    return zlib.crc32(data) & 0xFFFFFFFF


def clamp(value: float, low: float, high: float) -> float:
    return min(high, max(low, value))


def feature_state_to_vitals(packet: bytes, default_rssi: int) -> bytes | None:
    if len(packet) < FEATURE_STATE_SIZE:
        return None

    unpacked = FEATURE_STATE_STRUCT.unpack_from(packet)
    (
        magic,
        node_id,
        _mode,
        _seq,
        ts_us,
        motion_score,
        presence_score,
        respiration_bpm,
        respiration_conf,
        heartbeat_bpm,
        heartbeat_conf,
        anomaly_score,
        _env_shift_score,
        _node_coherence,
        quality_flags,
        _reserved,
        expected_crc,
    ) = unpacked

    if magic != FEATURE_STATE_MAGIC:
        return None

    actual_crc = crc32_ieee(packet[: FEATURE_STATE_SIZE - 4])
    if actual_crc != expected_crc:
        return None

    presence_score = clamp(float(presence_score), 0.0, 1.0)
    motion_score = clamp(float(motion_score), 0.0, 1.0)
    respiration_conf = clamp(float(respiration_conf), 0.0, 1.0)
    heartbeat_conf = clamp(float(heartbeat_conf), 0.0, 1.0)
    anomaly_score = clamp(float(anomaly_score), 0.0, 1.0)

    presence = (
        (quality_flags & QFLAG_PRESENCE_VALID) != 0
        or presence_score >= 0.35
        or motion_score >= 0.30
    )
    motion = motion_score >= 0.25
    fall = (quality_flags & QFLAG_ANOMALY_TRIGGERED) != 0 or anomaly_score >= 0.80

    flags = 0
    if presence:
        flags |= 0x01
    if fall:
        flags |= 0x02
    if motion:
        flags |= 0x04

    breathing_raw = 0
    if (quality_flags & QFLAG_RESPIRATION_VALID) or respiration_conf > 0:
        breathing_raw = int(clamp(float(respiration_bpm), 0.0, 200.0) * 100)

    heartrate_raw = 0
    if (quality_flags & QFLAG_HEARTBEAT_VALID) or heartbeat_conf > 0:
        heartrate_raw = int(clamp(float(heartbeat_bpm), 0.0, 240.0) * 10000)

    out = bytearray(VITALS_SIZE)
    struct.pack_into("<I", out, 0, VITALS_MAGIC)
    struct.pack_into("<B", out, 4, node_id)
    struct.pack_into("<B", out, 5, flags)
    struct.pack_into("<H", out, 6, breathing_raw)
    struct.pack_into("<I", out, 8, heartrate_raw)
    struct.pack_into("<b", out, 12, int(clamp(default_rssi, -127, 0)))
    struct.pack_into("<B", out, 13, 1 if presence else 0)
    struct.pack_into("<f", out, 16, motion_score)
    struct.pack_into("<f", out, 20, presence_score)
    struct.pack_into("<I", out, 24, int(ts_us // 1000) & 0xFFFFFFFF)
    return bytes(out)


def packet_magic(packet: bytes) -> int | None:
    if len(packet) < 4:
        return None
    return struct.unpack_from("<I", packet, 0)[0]


def run(listen: tuple[str, int], forward: tuple[str, int], default_rssi: int) -> None:
    listen_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    listen_sock.bind(listen)

    send_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    forward_addr = socket.getaddrinfo(forward[0], forward[1], socket.AF_INET, socket.SOCK_DGRAM)[0][4]

    counters = {
        "forwarded": 0,
        "feature_state": 0,
        "converted": 0,
        "bad_feature_state": 0,
    }
    last_log = time.monotonic()

    print(f"HomeMonitor UDP adapter listening on {listen[0]}:{listen[1]}", flush=True)
    print(f"Forwarding RuView packets to {forward[0]}:{forward[1]}", flush=True)

    while True:
        packet, source = listen_sock.recvfrom(4096)
        magic = packet_magic(packet)

        if magic == FEATURE_STATE_MAGIC:
            counters["feature_state"] += 1
            converted = feature_state_to_vitals(packet, default_rssi)
            if converted is not None:
                send_sock.sendto(converted, forward_addr)
                counters["converted"] += 1
            else:
                counters["bad_feature_state"] += 1
        else:
            send_sock.sendto(packet, forward_addr)
            counters["forwarded"] += 1

        now = time.monotonic()
        if now - last_log >= 30:
            print(
                "stats "
                + " ".join(f"{name}={count}" for name, count in counters.items())
                + f" last_source={source[0]}:{source[1]}",
                flush=True,
            )
            last_log = now


def self_test() -> None:
    packet = bytearray(FEATURE_STATE_SIZE)
    FEATURE_STATE_STRUCT.pack_into(
        packet,
        0,
        FEATURE_STATE_MAGIC,
        7,
        1,
        42,
        123_456_789,
        0.4,
        0.7,
        14.5,
        0.8,
        72.0,
        0.6,
        0.1,
        0.0,
        0.9,
        QFLAG_PRESENCE_VALID | QFLAG_RESPIRATION_VALID | QFLAG_HEARTBEAT_VALID,
        0,
        0,
    )
    struct.pack_into("<I", packet, FEATURE_STATE_SIZE - 4, crc32_ieee(packet[: FEATURE_STATE_SIZE - 4]))
    vitals = feature_state_to_vitals(bytes(packet), -51)
    assert vitals is not None
    assert packet_magic(vitals) == VITALS_MAGIC
    assert vitals[4] == 7
    assert vitals[5] & 0x01
    assert struct.unpack_from("<H", vitals, 6)[0] == 1450
    assert struct.unpack_from("<I", vitals, 8)[0] == 720000
    print("self-test ok")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--listen", type=parse_addr, default=("0.0.0.0", 5005))
    parser.add_argument("--forward", type=parse_addr, default=("ruview", 5005))
    parser.add_argument("--default-rssi", type=int, default=-50)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    run(args.listen, args.forward, args.default_rssi)


if __name__ == "__main__":
    main()
