from __future__ import annotations

import importlib.util
from pathlib import Path


class BuilderAgent:
    """Agent that searches GitHub PRs by Jira ticket ID through Git MCP server."""

    name = "BuilderAgent"

    def __init__(self) -> None:
        server_path = (
            Path(__file__).resolve().parents[2] / "mcp-servers" / "git-server" / "server.py"
        )
        spec = importlib.util.spec_from_file_location("git_mcp_server", server_path)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"Unable to load Git MCP Server from {server_path}")

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        self._server = module.create_server()

    def search_pr_by_jira_id(self, jira_id: str) -> dict:
        """Search for GitHub PRs matching a Jira ticket ID.

        Args:
            jira_id: Jira ticket ID (e.g., 'SR-2')

        Returns:
            Dictionary with search results and metadata
        """
        normalized_ticket_id = jira_id.strip().upper()

        try:
            results = self._server.run_tool(
                "search_pull_requests", ticket_id=normalized_ticket_id
            )

            return {
                "ticketId": normalized_ticket_id,
                "prCount": len(results),
                "prs": results,
                "logs": [
                    {
                        "step": "BuilderAgent -> MCP Git Server",
                        "message": f"Searching for Jira ticket '{normalized_ticket_id}' in GitHub PR titles.",
                    },
                    {
                        "step": "MCP Git Server -> GitHub API",
                        "message": "Fetched pull requests from configured repository and filtered by ticket ID.",
                    },
                    {
                        "step": "Results Retrieved",
                        "message": f"Found {len(results)} pull request(s) matching ticket ID.",
                    },
                    {
                        "step": "BuilderAgent Decision",
                        "message": "PR lookup completed successfully.",
                    },
                ],
            }

        except Exception as exc:
            return {
                "ticketId": normalized_ticket_id,
                "prCount": 0,
                "prs": [],
                "error": str(exc),
                "logs": [
                    {
                        "step": "BuilderAgent Error",
                        "message": f"Git MCP search failed: {str(exc)}",
                    }
                ],
            }
