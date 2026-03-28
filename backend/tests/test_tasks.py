import pytest

from tests.conftest import ADMIN_HEADERS


@pytest.mark.asyncio
async def test_create_task(client):
    r = await client.post(
        "/api/v1/tasks",
        json={"title": "Implement login", "body": "Add OAuth2 login flow"},
        headers=ADMIN_HEADERS,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Implement login"


@pytest.mark.asyncio
async def test_list_and_delete_task(client):
    await client.post("/api/v1/tasks", json={"title": "Task 1"}, headers=ADMIN_HEADERS)
    await client.post("/api/v1/tasks", json={"title": "Task 2"}, headers=ADMIN_HEADERS)

    r = await client.get("/api/v1/tasks", headers=ADMIN_HEADERS)
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 2

    task_id = items[0]["id"]
    r2 = await client.delete(f"/api/v1/tasks/{task_id}", headers=ADMIN_HEADERS)
    assert r2.status_code == 204
