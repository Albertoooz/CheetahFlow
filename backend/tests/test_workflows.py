import pytest

from tests.conftest import ADMIN_HEADERS

VALID_STAGES = [
    {"id": "plan", "type": "agent", "role_key": "planner", "executor": "openrouter"},
    {"id": "gate", "type": "human_gate", "label": "Human review"},
    {"id": "impl", "type": "agent", "role_key": "implementer", "executor": "claude_code"},
]


@pytest.mark.asyncio
async def test_create_and_list_workflow(client):
    r = await client.post(
        "/api/v1/workflows",
        json={"name": "Default Pipeline", "stages": VALID_STAGES},
        headers=ADMIN_HEADERS,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Default Pipeline"
    assert len(data["stages"]) == 3

    r2 = await client.get("/api/v1/workflows", headers=ADMIN_HEADERS)
    assert r2.status_code == 200
    assert len(r2.json()) == 1


@pytest.mark.asyncio
async def test_invalid_stage_type(client):
    r = await client.post(
        "/api/v1/workflows",
        json={"name": "Bad", "stages": [{"id": "x", "type": "unknown"}]},
        headers=ADMIN_HEADERS,
    )
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_update_workflow(client):
    r = await client.post(
        "/api/v1/workflows",
        json={"name": "Old Name", "stages": []},
        headers=ADMIN_HEADERS,
    )
    wf_id = r.json()["id"]
    r2 = await client.patch(f"/api/v1/workflows/{wf_id}", json={"name": "New Name"}, headers=ADMIN_HEADERS)
    assert r2.json()["name"] == "New Name"
