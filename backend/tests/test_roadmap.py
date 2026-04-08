"""Roadmap API tests."""

from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import ADMIN_HEADERS


@pytest.mark.asyncio
async def test_split_restores_status_when_openrouter_fails(client):
    p = await client.post(
        "/api/v1/projects",
        json={"name": "Roadmap project"},
        headers=ADMIN_HEADERS,
    )
    assert p.status_code == 201
    pid = p.json()["id"]

    r_item = await client.post(
        f"/api/v1/projects/{pid}/roadmap",
        json={"title": "Epic", "description": "desc", "status": "draft"},
        headers=ADMIN_HEADERS,
    )
    assert r_item.status_code == 201
    item_id = r_item.json()["id"]

    with patch("agentflow.api.roadmap.get_settings") as gs:
        gs.return_value = MagicMock(openrouter_api_key="fake-key-for-test")
        with patch(
            "agentflow.api.roadmap._split_via_openrouter",
            side_effect=RuntimeError("upstream failed"),
        ):
            r_split = await client.post(
                f"/api/v1/projects/{pid}/roadmap/{item_id}/split",
                headers=ADMIN_HEADERS,
            )

    assert r_split.status_code == 502
    assert "restored" in r_split.json()["detail"].lower()

    r_get = await client.get(
        f"/api/v1/projects/{pid}/roadmap/{item_id}",
        headers=ADMIN_HEADERS,
    )
    assert r_get.status_code == 200
    assert r_get.json()["status"] == "draft"
