from __future__ import annotations

import math

CITY_COORDS: dict[str, tuple[float, float]] = {
    "wichita, ks": (37.6872, -97.3301),
    "kansas city, mo": (39.0997, -94.5786),
    "topeka, ks": (39.0473, -95.6752),
    "new york, ny": (40.7128, -74.0060),
    "chicago, il": (41.8781, -87.6298),
    "los angeles, ca": (34.0522, -118.2437),
    "dallas, tx": (32.7767, -96.7970),
}


def parse_location_coords(location: str | None) -> tuple[float, float] | None:
    if not location:
        return None
    key = location.strip().lower()
    if key in CITY_COORDS:
        return CITY_COORDS[key]
    return None


def haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 3958.8
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)

    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c
