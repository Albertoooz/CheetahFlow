import pytest

from tests.conftest import ADMIN_HEADERS


@pytest.mark.asyncio
async def test_create_list_project(client):
    r = await client.post(
        "/api/v1/projects",
        json={"name": "Alpha", "description": "Test project"},
        headers=ADMIN_HEADERS,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Alpha"
    assert data["task_count"] == 0
    assert "backlog" in data["columns"]

    r2 = await client.get("/api/v1/projects", headers=ADMIN_HEADERS)
    assert r2.status_code == 200
    assert len(r2.json()) == 1


@pytest.mark.asyncio
async def test_project_tasks_and_move(client):
    p = await client.post("/api/v1/projects", json={"name": "Board"}, headers=ADMIN_HEADERS)
    pid = p.json()["id"]

    t = await client.post(
        "/api/v1/tasks",
        json={"title": "Card 1", "project_id": pid, "status": "backlog", "position": 1.0},
        headers=ADMIN_HEADERS,
    )
    assert t.status_code == 201
    tid = t.json()["id"]

    r_list = await client.get(f"/api/v1/projects/{pid}/tasks", headers=ADMIN_HEADERS)
    assert r_list.status_code == 200
    assert len(r_list.json()) == 1

    mv = await client.patch(
        f"/api/v1/tasks/{tid}/move",
        json={"status": "in_progress", "position": 2.0},
        headers=ADMIN_HEADERS,
    )
    assert mv.status_code == 200
    assert mv.json()["status"] == "in_progress"
    assert mv.json()["position"] == 2.0

    bad = await client.patch(
        f"/api/v1/tasks/{tid}/move",
        json={"status": "not_a_column", "position": 0},
        headers=ADMIN_HEADERS,
    )
    assert bad.status_code == 422
