"""TEM PSHA2025 shallow areal source zones (area sources) for Taiwan.

The source geometry lives in a plain coordinate asset
(`data/raw/Coordinates-area_source.txt`) with one block per zone:

    > S01 [a-value]
    <longitude><TAB><latitude>
    ...

Each block is a closed ring (the first vertex is repeated as the last). A Gutenberg-Richter
a-value may follow the zone id on the header line (`> S01 4.17`); it is optional, so the
geometry stays loadable on its own. This module parses that asset into polygons and exposes
them for map rendering and diagnostics. Rings are kept in file order; out-of-range vertices
are dropped rather than allowed to plot off-Earth. `tests/test_area_source.py` pins the
expected zone set.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

from src.config import RAW_DATA_DIR

DEFAULT_AREA_SOURCE_PATH = RAW_DATA_DIR / "Coordinates-area_source.txt"

_LON_RANGE = (-180.0, 180.0)
_LAT_RANGE = (-90.0, 90.0)

Coordinate = Tuple[float, float]  # (longitude, latitude)


@dataclass(frozen=True)
class AreaSource:
    """One polygonal areal source zone."""

    id: str
    coordinates: List[Coordinate]
    a_value: Optional[float] = None  # Gutenberg-Richter a-value, when the asset carries it

    @property
    def vertex_count(self) -> int:
        return len(self.coordinates)

    @property
    def centroid(self) -> Coordinate:
        """Unweighted vertex mean, adequate for labelling a source zone."""
        lon = sum(c[0] for c in self.coordinates) / len(self.coordinates)
        lat = sum(c[1] for c in self.coordinates) / len(self.coordinates)
        return (round(lon, 4), round(lat, 4))

    @property
    def bbox(self) -> Tuple[float, float, float, float]:
        """(min_lon, min_lat, max_lon, max_lat)."""
        lons = [c[0] for c in self.coordinates]
        lats = [c[1] for c in self.coordinates]
        return (min(lons), min(lats), max(lons), max(lats))

    def as_lat_lon(self) -> List[List[float]]:
        """Leaflet-friendly ring: [[lat, lon], ...]."""
        return [[lat, lon] for lon, lat in self.coordinates]

    def contains_point(self, lon: float, lat: float) -> bool:
        """Ray-casting algorithm to test if point (lon, lat) is within the zone polygon."""
        min_lon, min_lat, max_lon, max_lat = self.bbox
        if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
            return False
        inside = False
        n = len(self.coordinates)
        for i in range(n):
            j = (i - 1) % n
            xi, yi = self.coordinates[i]
            xj, yj = self.coordinates[j]
            intersect = ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi)
            if intersect:
                inside = not inside
        return inside


class AreaSourceCatalog:
    """In-memory catalog of the on- and offshore areal source zones."""

    def __init__(self, sources: Sequence[AreaSource]):
        self._sources = list(sources)
        self._by_id: Dict[str, AreaSource] = {s.id: s for s in self._sources}

    @property
    def total_sources(self) -> int:
        return len(self._sources)

    def list_all(self) -> List[AreaSource]:
        return list(self._sources)

    def get_by_id(self, source_id: str) -> Optional[AreaSource]:
        return self._by_id.get(source_id.strip().upper())

    def find_containing_sources(self, lon: float, lat: float) -> List[AreaSource]:
        """Find all areal source zones whose polygon contains the point (lon, lat)."""
        return [s for s in self._sources if s.contains_point(lon, lat)]

    @classmethod
    def load_from_text(cls, path: Optional[Path] = None) -> "AreaSourceCatalog":
        """Parse the coordinate asset, skipping malformed lines and degenerate rings."""
        asset = Path(path or DEFAULT_AREA_SOURCE_PATH)
        if not asset.exists():
            return cls([])

        sources: List[AreaSource] = []
        current_id: Optional[str] = None
        current_a_value: Optional[float] = None
        points: List[Coordinate] = []

        for raw_line in asset.read_text(encoding="utf-8-sig").splitlines():
            line = raw_line.strip()
            if not line:
                continue

            if line.startswith(">"):
                if current_id and len(points) >= 3:
                    sources.append(AreaSource(current_id, points, current_a_value))
                current_id, current_a_value = _parse_header(line)
                points = []
                continue

            if current_id is None:
                continue

            parts = line.split()
            if len(parts) < 2:
                continue
            try:
                lon, lat = float(parts[0]), float(parts[1])
            except ValueError:
                continue
            if not (_LON_RANGE[0] <= lon <= _LON_RANGE[1] and _LAT_RANGE[0] <= lat <= _LAT_RANGE[1]):
                continue
            points.append((lon, lat))

        if current_id and len(points) >= 3:
            sources.append(AreaSource(current_id, points, current_a_value))

        return cls(sources)


def _parse_header(line: str) -> Tuple[Optional[str], Optional[float]]:
    """Read a `> S01` or `> S01 4.17` / `> S01 a=4.17` zone header.

    The a-value is optional so the geometry asset stays usable on its own; an unparsable
    trailing token is ignored rather than failing the whole load.
    """
    tokens = line.lstrip(">").strip().split()
    if not tokens:
        return (None, None)

    source_id = tokens[0].upper()
    a_value: Optional[float] = None
    if len(tokens) > 1:
        try:
            a_value = float(tokens[1].split("=")[-1])
        except ValueError:
            a_value = None
    return (source_id, a_value)
