from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services import auth_local, conversations, google_auth, realtime

router = APIRouter(tags=["realtime"])


def _get_user_from_token(token: str | None):
    if not token:
        return None
    try:
        claims = auth_local.decode_access_token(token)
    except ValueError:
        return None
    user_id = claims.get("sub")
    return auth_local.get_user_by_id(user_id) or google_auth.get_user_by_id(user_id)


@router.websocket("/ws/conversations/{conversation_id}")
async def conversation_ws(websocket: WebSocket, conversation_id: str):
    token = websocket.query_params.get("token")
    user = _get_user_from_token(token)
    if not user:
        await websocket.close(code=1008)
        return

    try:
        convo = conversations.get_for_user(conversation_id, user["id"])
    except PermissionError:
        await websocket.close(code=1008)
        return

    if not convo:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    queue = await realtime.subscribe(conversation_id)

    try:
        while True:
            event = await queue.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        await realtime.unsubscribe(conversation_id, queue)
