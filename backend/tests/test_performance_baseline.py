import time
from concurrent.futures import ThreadPoolExecutor


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


def test_performance_health_handles_small_burst(client):
    def hit_health():
        t0 = time.perf_counter()
        r = client.get("/health")
        dt = time.perf_counter() - t0
        return r.status_code, dt

    with ThreadPoolExecutor(max_workers=5) as ex:
        results = list(ex.map(lambda _: hit_health(), range(10)))

    statuses = [s for s, _ in results]
    latencies = [dt for _, dt in results]

    assert all(s == 200 for s in statuses)
    assert (sum(latencies) / len(latencies)) < 0.30
