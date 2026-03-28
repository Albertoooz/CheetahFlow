import pytest

from tests.conftest import ADMIN_HEADERS


@pytest.mark.asyncio
async def test_list_agents_empty(client):
    r = await client.get("/api/v1/agents", headers=ADMIN_HEADERS)
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.asyncio
async def test_create_and_get_agent(client):
    payload = {
        "role_key": "planner",
        "display_name": "Planner",
        "model_provider": "openrouter",
        "model_name": "openai/gpt-4o-mini",
    }
    r = await client.post("/api/v1/agents", json=payload, headers=ADMIN_HEADERS)
    assert r.status_code == 201
    data = r.json()
    assert data["role_key"] == "planner"
    agent_id = data["id"]

    r2 = await client.get(f"/api/v1/agents/{agent_id}", headers=ADMIN_HEADERS)
    assert r2.status_code == 200
    assert r2.json()["id"] == agent_id


@pytest.mark.asyncio
async def test_update_agent(client):
    r = await client.post(
        "/api/v1/agents",
        json={"role_key": "reviewer", "display_name": "Reviewer"},
        headers=ADMIN_HEADERS,
    )
    agent_id = r.json()["id"]
    r2 = await client.patch(f"/api/v1/agents/{agent_id}", json={"enabled": False}, headers=ADMIN_HEADERS)
    assert r2.status_code == 200
    assert r2.json()["enabled"] is False


@pytest.mark.asyncio
async def test_delete_agent(client):
    r = await client.post(
        "/api/v1/agents",
        json={"role_key": "temp", "display_name": "Temp"},
        headers=ADMIN_HEADERS,
    )
    agent_id = r.json()["id"]
    r2 = await client.delete(f"/api/v1/agents/{agent_id}", headers=ADMIN_HEADERS)
    assert r2.status_code == 204
    r3 = await client.get(f"/api/v1/agents/{agent_id}", headers=ADMIN_HEADERS)
    assert r3.status_code == 404


@pytest.mark.asyncio
async def test_auth_required(client):
    r = await client.get("/api/v1/agents")
    assert r.status_code == 422  # missing header


@pytest.mark.asyncio
async def test_wrong_token(client):
    r = await client.get("/api/v1/agents", headers={"X-Admin-Token": "wrong"})
    assert r.status_code == 401
