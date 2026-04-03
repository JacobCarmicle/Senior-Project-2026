import time


def test_performance_health_endpoint_under_250ms(client):
    start = time.perf_counter()
    res = client.get("/health")
    elapsed = time.perf_counter() - start

    assert res.status_code == 200
    assert elapsed < 0.25


def test_performance_listings_endpoint_under_400ms(client):
    start = time.perf_counter()
    res = client.get("/listings")
    elapsed = time.perf_counter() - start

    assert res.status_code == 200
    assert elapsed < 0.40
