# Release Management MCP Integration

This workspace now includes a production-style Jira MCP integration for ticket analysis.

## Architecture

- `mcp-servers/jira-server/server.py`: Jira MCP server that calls the live Atlassian Jira Cloud REST API.
- `autogen-orchestrator/main.py`: FastAPI backend exposing `POST /analyze-ticket`.
- `autogen-orchestrator/agents/planner_agent.py`: PlannerAgent that calls only the Jira MCP server.
- `release-dashboard/src/App.jsx`: React UI for Jira ticket analysis, loading state, result card, and activity logs.

## Environment variables

Set these in `autogen-orchestrator/.env`:

```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=your_jira_api_token
```

Do not hardcode credentials in source files.

## Backend run command

```powershell
cd "C:\Users\NTh542\Desktop\release_mangement\autogen-orchestrator"
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

## Frontend run command

```powershell
cd "C:\Users\NTh542\Desktop\release_mangement\release-dashboard"
npm install
npm run dev
```

## Request example

```json
{
	"ticketId": "SR-2"
}
```

## Error behavior

- Invalid ticket: `Ticket Not Found`
- Jira auth failure: `Jira authentication failed`
