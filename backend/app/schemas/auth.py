from pydantic import BaseModel, EmailStr, Field, field_validator

from app.services.auth_local import validate_password_rules


class GoogleOAuthRequest(BaseModel):
    token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=120)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not validate_password_rules(value):
            raise ValueError("Password must be at least 8 chars and include letters and numbers")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, value: str) -> str:
        if not validate_password_rules(value):
            raise ValueError("Password must be at least 8 chars and include letters and numbers")
        return value


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str

class PublicUser(BaseModel):
    id: str
    full_name: str
    created_at: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
