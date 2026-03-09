from pydantic import BaseModel


class GoogleOAuthRequest(BaseModel):
    token: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
