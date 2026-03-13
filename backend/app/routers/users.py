from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import PublicUser
from app.services import auth_local, google_auth

router = APIRouter(prefix="/users", tags=["users"])


# def _to_user_response(user: dict) -> UserResponse:
#     return UserResponse(
#         id=user["id"],
#         email=user["email"],
#         full_name=user["full_name"],
#         role=user["role"],
#         created_at=user["created_at"],
#     )

def _to_public_user(user: dict) -> PublicUser:
    return PublicUser(
        id=user["id"],
        full_name=user["full_name"],
        created_at=user["created_at"],
    )


@router.get("/{user_id}", response_model=PublicUser)
def get_user(user_id: str):
    user = auth_local.get_user_by_id(user_id)

    if not user:
        user = google_auth.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return _to_user_response(user)