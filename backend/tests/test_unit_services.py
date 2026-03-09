from decimal import Decimal

import pytest

from app.services import auth_local, listings_memory, uploads


def test_auth_local_hash_and_verify_password():
    hashed = auth_local.hash_password("Password123!")
    assert hashed != "Password123!"
    assert auth_local.verify_password("Password123!", hashed) is True
    assert auth_local.verify_password("WrongPass123!", hashed) is False


def test_auth_local_create_and_authenticate_user():
    user = auth_local.create_user("unit@example.com", "Password123!", "Unit User")
    assert user["email"] == "unit@example.com"

    ok = auth_local.authenticate_user("unit@example.com", "Password123!")
    bad = auth_local.authenticate_user("unit@example.com", "Wrong123!")

    assert ok is not None
    assert bad is None


def test_auth_local_duplicate_user_raises():
    auth_local.create_user("dup-unit@example.com", "Password123!", "Dup 1")
    with pytest.raises(ValueError):
        auth_local.create_user("dup-unit@example.com", "Password123!", "Dup 2")


def test_auth_local_reset_token_and_apply_password_reset():
    auth_local.create_user("reset-unit@example.com", "Password123!", "Reset User")
    token = auth_local.create_reset_token("reset-unit@example.com")
    assert token

    auth_local.apply_password_reset(token, "NewPassword123!")

    assert auth_local.authenticate_user("reset-unit@example.com", "Password123!") is None
    assert auth_local.authenticate_user("reset-unit@example.com", "NewPassword123!") is not None


def test_listings_memory_create_update_search_delete_flow():
    created = listings_memory.create_listing(
        {
            "title": "Unit Listing",
            "description": "Listing from unit test",
            "price": 50,
            "category": "electronics",
            "location": "Wichita, KS",
            "images": ["https://img.test/a.jpg"],
        },
        seller_id="seller-1",
    )

    assert created["title"] == "Unit Listing"
    assert created["price"] == Decimal("50")

    updated = listings_memory.update_listing(created["id"], "seller-1", {"price": 45, "title": "Updated"})
    assert updated is not None
    assert updated["price"] == Decimal("45")
    assert updated["title"] == "Updated"

    results, total = listings_memory.search_listings(
        keyword="updated",
        category="electronics",
        min_price=Decimal("40"),
        max_price=Decimal("60"),
        page=1,
        page_size=20,
    )
    assert total == 1
    assert results[0]["id"] == created["id"]

    deleted = listings_memory.delete_listing(created["id"], "seller-1")
    assert deleted is True
    assert listings_memory.get_listing(created["id"]) is None


def test_listings_memory_owner_enforcement():
    created = listings_memory.create_listing(
        {
            "title": "Protected Listing",
            "description": "Only owner can modify",
            "price": 10,
            "category": "books",
            "location": "Wichita, KS",
            "images": ["https://img.test/book.jpg"],
        },
        seller_id="owner-1",
    )

    with pytest.raises(PermissionError):
        listings_memory.update_listing(created["id"], "other-user", {"price": 5})

    with pytest.raises(PermissionError):
        listings_memory.delete_listing(created["id"], "other-user")


def test_uploads_rejects_invalid_mime_and_large_file(monkeypatch):
    with pytest.raises(ValueError, match="Unsupported file type"):
        uploads.upload_image(b"abc", "text/plain", "bad.txt", "u1")

    monkeypatch.setattr(uploads, "MAX_UPLOAD_BYTES", 1)
    with pytest.raises(ValueError, match="File too large"):
        uploads.upload_image(b"abc", "image/jpeg", "a.jpg", "u1")


def test_uploads_local_success(monkeypatch):
    monkeypatch.setenv("UPLOADS_BACKEND", "local")
    result = uploads.upload_image(b"jpeg-bytes", "image/jpeg", "photo.jpg", "u123")
    assert result["public_url"].startswith("/uploads/listing-images/")
    assert result["object_key"].startswith("u123/")
