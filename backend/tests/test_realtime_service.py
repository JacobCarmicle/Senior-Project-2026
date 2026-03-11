import asyncio

from app.services import realtime


def test_realtime_broadcast_delivers_to_subscribers():
    async def run():
        q1 = await realtime.subscribe("c1")
        q2 = await realtime.subscribe("c1")
        await realtime.broadcast("c1", {"type": "message.sent", "id": "m1"})

        evt1 = await asyncio.wait_for(q1.get(), timeout=1)
        evt2 = await asyncio.wait_for(q2.get(), timeout=1)

        assert evt1["type"] == "message.sent"
        assert evt2["id"] == "m1"

        await realtime.unsubscribe("c1", q1)
        await realtime.unsubscribe("c1", q2)

    asyncio.run(run())


def test_realtime_unsubscribe_stops_delivery():
    async def run():
        q = await realtime.subscribe("c2")
        await realtime.unsubscribe("c2", q)
        await realtime.broadcast("c2", {"type": "message.read"})
        assert q.empty()

    asyncio.run(run())
