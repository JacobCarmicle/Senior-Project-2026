from app.services import auth_local


def test_signup_success_returns_token_and_user(client):
    res = client.post(
        "/auth/signup",
        json={
            "email": "newuser@example.com",
            "password": "Password123!",
            "full_name": "New User",
        },
    )

    assert res.status_code == 201
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "newuser@example.com"
    assert body["user"]["full_name"] == "New User"


def test_signup_duplicate_email_returns_409(client):
    payload = {
        "email": "dupe@example.com",
        "password": "Password123!",
        "full_name": "Dupe User",
    }
    first = client.post("/auth/signup", json=payload)
    second = client.post("/auth/signup", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409


def test_password_is_hashed_not_plaintext(client):
    client.post(
        "/auth/signup",
        json={
            "email": "hashcheck@example.com",
            "password": "Password123!",
            "full_name": "Hash Check",
        },
    )

    stored = auth_local.USERS_BY_EMAIL["hashcheck@example.com"]
    assert stored["password_hash"] != "Password123!"
    assert stored["password_hash"]


def test_login_success_returns_token_and_user(client):
    client.post(
        "/auth/signup",
        json={
            "email": "login@example.com",
            "password": "Password123!",
            "full_name": "Login User",
        },
    )

    res = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "Password123!"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["access_token"]
    assert body["user"]["email"] == "login@example.com"


def test_login_wrong_password_returns_401(client):
    client.post(
        "/auth/signup",
        json={
            "email": "wrongpass@example.com",
            "password": "Password123!",
            "full_name": "Wrong Pass",
        },
    )

    res = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "Wrong123!"},
    )

    assert res.status_code == 401


def test_me_requires_auth_and_returns_profile(client):
    signup = client.post(
        "/auth/signup",
        json={
            "email": "me@example.com",
            "password": "Password123!",
            "full_name": "Me User",
        },
    )
    token = signup.json()["access_token"]

    unauth = client.get("/auth/me")
    assert unauth.status_code == 401

    authd = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert authd.status_code == 200
    assert authd.json()["email"] == "me@example.com"


def test_forgot_and_reset_password_flow(client):
    client.post(
        "/auth/signup",
        json={
            "email": "reset@example.com",
            "password": "Password123!",
            "full_name": "Reset User",
        },
    )

    forgot = client.post("/auth/forgot-password", json={"email": "reset@example.com"})
    assert forgot.status_code == 200

    token = auth_local.latest_reset_token_for("reset@example.com")
    assert token

    reset = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "NewPassword123!"},
    )
    assert reset.status_code == 200

    login_old = client.post(
        "/auth/login",
        json={"email": "reset@example.com", "password": "Password123!"},
    )
    assert login_old.status_code == 401

    login_new = client.post(
        "/auth/login",
        json={"email": "reset@example.com", "password": "NewPassword123!"},
    )
    assert login_new.status_code == 200


def test_reset_password_with_invalid_token_returns_400(client):
    res = client.post(
        "/auth/reset-password",
        json={"token": "invalid", "new_password": "NewPassword123!"},
    )

    assert res.status_code == 400


def test_validation_for_email_and_password_rules(client):
    bad_email = client.post(
        "/auth/signup",
        json={
            "email": "not-an-email",
            "password": "Password123!",
            "full_name": "Bad Email",
        },
    )
    assert bad_email.status_code == 422

    weak_password = client.post(
        "/auth/signup",
        json={
            "email": "valid@example.com",
            "password": "short",
            "full_name": "Weak Password",
        },
    )
    assert weak_password.status_code == 422
