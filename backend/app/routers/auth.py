import os

from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import AuthResponse, GoogleOAuthRequest, UserResponse
from app.services import google_auth

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/oauth/google", response_model=AuthResponse)
def oauth_google(payload: GoogleOAuthRequest):
    try:
        claims = google_auth.verify_google_id_token(payload.token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        ) from exc

    expected_aud = os.environ.get("GOOGLE_CLIENT_ID", "")
    if claims.get("aud") != expected_aud:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience",
        )

    if claims.get("email_verified") is not True:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google email not verified",
        )

    if not claims.get("email"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account missing email",
        )

    user = google_auth.get_or_create_user(claims)
    token = google_auth.create_access_token(user)

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            created_at=user["created_at"],
        ),
    )
