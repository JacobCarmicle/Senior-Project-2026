import os

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    GoogleOAuthRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UserResponse,
)
from app.services import auth_local, google_auth

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


def _to_user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        created_at=user["created_at"],
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        claims = auth_local.decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    user_id = claims.get("sub")
    user = auth_local.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: RegisterRequest):
    try:
        user = auth_local.create_user(payload.email, payload.password, payload.full_name)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    token = auth_local.create_access_token(user)
    return AuthResponse(access_token=token, token_type="bearer", user=_to_user_response(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    user = auth_local.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = auth_local.create_access_token(user)
    return AuthResponse(access_token=token, token_type="bearer", user=_to_user_response(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserResponse)
def me(current_user: dict = Depends(get_current_user)):
    return _to_user_response(current_user)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    auth_local.create_reset_token(payload.email)
    return {"message": "If an account exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    try:
        auth_local.apply_password_reset(payload.token, payload.new_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"message": "Password reset successful"}


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

    return AuthResponse(access_token=token, token_type="bearer", user=_to_user_response(user))
