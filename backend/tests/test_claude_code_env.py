"""Claude Code adapter: subprocess environment must not leak CheetahFlow secrets."""

from agentflow.adapters.claude_code import _claude_subprocess_env


def test_claude_subprocess_env_excludes_cheetahflow_and_app_secrets(monkeypatch):
    monkeypatch.setenv("CHEETAHFLOW_ADMIN_TOKEN", "secret-admin-token")
    monkeypatch.setenv("CHEETAHFLOW_DATABASE_URL", "sqlite+aiosqlite:///./db.db")
    monkeypatch.setenv("CHEETAHFLOW_OPENROUTER_API_KEY", "sk-or-app")
    monkeypatch.setenv("CHEETAHFLOW_LANGFUSE_SECRET_KEY", "sk-lf")
    monkeypatch.setenv("PATH", "/usr/bin:/bin")
    monkeypatch.setenv("OPENROUTER_API_KEY", "plain-openrouter")  # unrelated key; should not appear unless allowlisted

    env = _claude_subprocess_env()

    assert not any(k.startswith("CHEETAHFLOW_") for k in env)
    assert "CHEETAHFLOW_ADMIN_TOKEN" not in env
    assert "OPENROUTER_API_KEY" not in env
    assert env.get("PATH") == "/usr/bin:/bin"
    assert env["CLAUDE_NO_COLOR"] == "1"


def test_claude_subprocess_env_passes_anthropic_cli_vars(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-cli")
    monkeypatch.setenv("ANTHROPIC_BASE_URL", "https://example.com")
    env = _claude_subprocess_env()
    assert env["ANTHROPIC_API_KEY"] == "sk-ant-cli"
    assert env["ANTHROPIC_BASE_URL"] == "https://example.com"
