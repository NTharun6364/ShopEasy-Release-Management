from __future__ import annotations

from typing import Any


class QAService:
    """Simple QA result provider keyed by Jira ticket ID."""

    def __init__(self) -> None:
        self._qa_dataset: dict[str, dict[str, Any]] = {
            "SR-2": {
                "qaStatus": "Passed",
                "totalTests": 120,
                "passed": 120,
                "failed": 0,
                "coverage": 96.2,
            },
            "SR-3": {
                "qaStatus": "Failed",
                "totalTests": 110,
                "passed": 103,
                "failed": 7,
                "coverage": 82.7,
            },
            "SR-4": {
                "qaStatus": "In Progress",
                "totalTests": 90,
                "passed": 58,
                "failed": 0,
                "coverage": 64.1,
            },
        }

    def get_qa_result(self, ticket_id: str) -> dict[str, Any]:
        normalized_ticket_id = ticket_id.strip().upper()
        if normalized_ticket_id in self._qa_dataset:
            return self._qa_dataset[normalized_ticket_id]

        # Default fallback for tickets not yet configured.
        return {
            "qaStatus": "In Progress",
            "totalTests": 0,
            "passed": 0,
            "failed": 0,
            "coverage": 0.0,
        }
