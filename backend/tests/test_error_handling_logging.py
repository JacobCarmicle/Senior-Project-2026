def test_http_errors_include_standard_error_shape_and_request_id(client):
    res = client.get("/auth/me")

    assert res.status_code == 401
    assert res.headers.get("x-request-id")

    body = res.json()
    assert "request_id" in body
    assert body["request_id"] == res.headers.get("x-request-id")
    assert body["error"]["message"] == "Not authenticated"
    assert body["detail"] == "Not authenticated"


def test_validation_errors_are_standardized(client):
    res = client.post(
        "/auth/signup",
        json={
            "email": "not-an-email",
            "password": "short",
            "full_name": "Bad",
        },
    )

    assert res.status_code == 422
    body = res.json()
    assert body["error"]["code"] == "validation_error"
    assert isinstance(body["detail"], list)
