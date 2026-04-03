from app.services import auth_local


def _signup(client, email: str, full_name: str = "User"):
    res = client.post(
        "/auth/signup",
        json={"email": email, "password": "Password123!", "full_name": full_name},
    )
    assert res.status_code == 201
    return res.json()["user"], res.json()["access_token"]


def test_users_get_user_public_profile_found_and_not_found(client):
    user, _ = _signup(client, "public-profile@example.com", "Public Profile")

    found = client.get(f"/users/{user['id']}")
    assert found.status_code == 200
    assert found.json()["id"] == user["id"]
    assert found.json()["full_name"] == "Public Profile"

    missing = client.get("/users/does-not-exist")
    assert missing.status_code == 404


def test_admin_users_requires_admin_role(client):
    _, token = _signup(client, "normal-user@example.com", "Normal User")

    res = client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert res.json()["detail"] == "Admins only"


def test_admin_can_list_and_patch_user_role_status(client):
    admin_user, admin_token = _signup(client, "admin-user@example.com", "Admin User")
    target_user, _ = _signup(client, "target-user@example.com", "Target User")

    auth_local.set_user_role(admin_user["id"], "admin")

    listed = client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert listed.status_code == 200
    assert any(u["id"] == target_user["id"] for u in listed.json())

    patched_role = client.patch(
        f"/admin/users/{target_user['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "admin"},
    )
    assert patched_role.status_code == 200
    assert patched_role.json()["role"] == "admin"

    patched_status = client.patch(
        f"/admin/users/{target_user['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "disabled"},
    )
    assert patched_status.status_code == 200
    assert patched_status.json()["status"] == "disabled"


def test_admin_cannot_modify_own_account(client):
    admin_user, admin_token = _signup(client, "self-admin@example.com", "Self Admin")
    auth_local.set_user_role(admin_user["id"], "admin")

    res = client.patch(
        f"/admin/users/{admin_user['id']}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "disabled"},
    )
    assert res.status_code == 400
    assert "Cannot modify your own account" in res.json()["detail"]


def test_reports_create_validation_and_admin_patch(client, monkeypatch):
    admin_user, admin_token = _signup(client, "report-admin@example.com", "Report Admin")
    reporter, reporter_token = _signup(client, "reporter@example.com", "Reporter")
    auth_local.set_user_role(admin_user["id"], "admin")

    fake_reports: list[dict] = []

    def fake_create_report(**kwargs):
        row = {
            "id": f"r{len(fake_reports)+1}",
            "reporter_id": kwargs["reporter_id"],
            "target_type": kwargs["target_type"],
            "target_id": kwargs["target_id"],
            "listing_id": kwargs.get("listing_id"),
            "reason": kwargs["reason"],
            "description": kwargs.get("description") or "",
            "status": "pending",
        }
        fake_reports.append(row)
        return row

    def fake_list_reports():
        return list(fake_reports)

    def fake_update_report_status(report_id: str, status: str, resolved_by: str | None = None):
        if status not in ("pending", "reviewed", "dismissed"):
            raise ValueError("Invalid status")
        for row in fake_reports:
            if row["id"] == report_id:
                row["status"] = status
                row["resolved_by"] = resolved_by
                return row
        return None

    from app.services import reports as reports_service

    monkeypatch.setattr(reports_service, "create_report", fake_create_report)
    monkeypatch.setattr(reports_service, "list_reports", fake_list_reports)
    monkeypatch.setattr(reports_service, "update_report_status", fake_update_report_status)

    bad_reason = client.post(
        "/reports",
        headers={"Authorization": f"Bearer {reporter_token}"},
        json={"target_type": "listing", "target_id": "l1", "reason": "NotAReason"},
    )
    assert bad_reason.status_code == 400

    created = client.post(
        "/reports",
        headers={"Authorization": f"Bearer {reporter_token}"},
        json={
            "target_type": "listing",
            "target_id": "l1",
            "reason": "Spam",
            "description": "Looks suspicious",
        },
    )
    assert created.status_code == 201
    report_id = created.json()["id"]
    assert created.json()["reporter_id"] == reporter["id"]

    listed = client.get("/admin/reports", headers={"Authorization": f"Bearer {admin_token}"})
    assert listed.status_code == 200
    assert any(r["id"] == report_id for r in listed.json())

    patched = client.patch(
        f"/admin/reports/{report_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"status": "reviewed"},
    )
    assert patched.status_code == 200
    assert patched.json()["status"] == "reviewed"
