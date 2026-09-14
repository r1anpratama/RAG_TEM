"""Tests for the TEM PSHA2025 areal source coordinate asset parser."""

from src.domain.area_source import AreaSourceCatalog


def load() -> AreaSourceCatalog:
    return AreaSourceCatalog.load_from_text()


def test_asset_parses_into_the_full_zone_set():
    catalog = load()
    assert catalog.total_sources == 28
    assert catalog.list_all()[0].id == "S01"
    assert catalog.list_all()[-1].id == "S21"
    assert catalog.get_by_id("s05a") is not None, "IDs must resolve case-insensitively"


def test_every_zone_is_a_closed_taiwan_ring():
    for source in load().list_all():
        assert source.vertex_count >= 3, f"{source.id} is degenerate"
        assert source.coordinates[0] == source.coordinates[-1], f"{source.id} ring is not closed"

        min_lon, min_lat, max_lon, max_lat = source.bbox
        assert 118.0 <= min_lon < max_lon <= 124.0, f"{source.id} longitude outside Taiwan"
        assert 20.0 <= min_lat < max_lat <= 27.0, f"{source.id} latitude outside Taiwan"


def test_lat_lon_ring_shape_for_leaflet():
    zone = load().get_by_id("S05A")
    assert zone is not None
    lat_lon = zone.as_lat_lon()
    assert len(lat_lon) == zone.vertex_count
    # Leaflet wants [lat, lon]; the asset stores lon first.
    assert lat_lon[0] == [zone.coordinates[0][1], zone.coordinates[0][0]]


def test_malformed_and_out_of_range_lines_are_skipped(tmp_path):
    asset = tmp_path / "broken.txt"
    asset.write_text(
        "> S99\n"
        "120.0\t24.0\n"
        "not-a-coordinate\n"
        "999.0\t24.1\n"  # longitude out of range
        "120.1\t24.1\n"
        "120.2\t24.2\n"
        "120.0\t24.0\n",
        encoding="utf-8",
    )
    catalog = AreaSourceCatalog.load_from_text(asset)
    assert catalog.total_sources == 1
    # 4 of the 6 data lines survive: the junk line and the out-of-range longitude are dropped.
    assert catalog.get_by_id("S99").coordinates == [
        (120.0, 24.0),
        (120.1, 24.1),
        (120.2, 24.2),
        (120.0, 24.0),
    ]


def test_missing_asset_yields_an_empty_catalog(tmp_path):
    assert AreaSourceCatalog.load_from_text(tmp_path / "absent.txt").total_sources == 0


def test_a_value_is_optional_on_the_header_line(tmp_path):
    asset = tmp_path / "with_a.txt"
    asset.write_text(
        "> S01 4.17\n120.0\t24.0\n120.1\t24.1\n120.2\t24.2\n"
        "> S02 a=5.39\n120.0\t24.0\n120.1\t24.1\n120.2\t24.2\n"
        "> S03\n120.0\t24.0\n120.1\t24.1\n120.2\t24.2\n"
        "> S04 not-a-number\n120.0\t24.0\n120.1\t24.1\n120.2\t24.2\n",
        encoding="utf-8",
    )
    catalog = AreaSourceCatalog.load_from_text(asset)
    assert catalog.get_by_id("S01").a_value == 4.17
    assert catalog.get_by_id("S02").a_value == 5.39
    assert catalog.get_by_id("S03").a_value is None
    assert catalog.get_by_id("S04").a_value is None, "junk a-value must not break the zone"


def test_shipped_asset_loads_even_without_a_values():
    """The geometry asset must stay usable while the a-values are still outstanding."""
    for source in load().list_all():
        assert source.a_value is None or isinstance(source.a_value, float)
