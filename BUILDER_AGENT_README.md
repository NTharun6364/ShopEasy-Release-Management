# BuilderAgent GitHub Integration

## Overview

BuilderAgent is a GitHub PR search agent that integrates with the Release Management dashboard. It searches for pull requests by Jira ticket ID and returns structured information about matching PRs.

## Features

- **Search GitHub PRs by Jira Ticket ID**: Enter a Jira ticket ID (e.g., `SR-2`) and find all related pull requests
- **Structured Results**: Returns PR number, title, status, branch, and repository information
- **Multi-Status Support**: Handles Open, Merged, and Closed PR statuses
- **Dashboard Integration**: Native React component in release dashboard

## Setup

### 1. Backend Configuration

Add your GitHub Personal Access Token to `autogen-orchestrator/.env`:

```
GITHUB_TOKEN=ghp_your_token_here
```

To generate a GitHub token:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)" 
3. Select `repo` scope (or `public_repo` if only public repos)
4. Copy the token and add to `.env`

### 2. Backend API Endpoints

**Search PRs by Jira Ticket ID:**
```
POST /api/search-pr
Content-Type: application/json

{
  "ticketId": "SR-2"
}
```

**Response:**
```json
{
  "ticketId": "SR-2",
  "prCount": 2,
  "prs": [
    {
      "prNumber": 42,
      "prTitle": "SR-2 Fix cart total calculation issue",
      "status": "Open",
      "branch": "SR-2-fix",
      "repoName": "NTharun6364/ShopEasy-Release-Management",
      "url": "https://github.com/NTharun6364/ShopEasy-Release-Management/pull/42"
    }
  ],
  "logs": [...]
}
```

### 3. Frontend Component

The `PRSearchPanel` component is integrated into the release dashboard at:
- **Location**: `release-dashboard/src/components/PRSearchPanel.jsx`
- **Integrated in**: `release-dashboard/src/App.jsx`

## Backend Structure

```
autogen-orchestrator/
├── services/
│   └── github_service.py          # GitHub API wrapper
├── agents/
│   └── builder_agent.py           # BuilderAgent service
└── main.py                        # FastAPI endpoints
```

### GitHub Service

**File**: `services/github_service.py`

Provides:
- `GitHubService.search_prs_by_jira_id(jira_id)` - Search PRs by ticket ID
- `GitHubService.get_pr_details(owner, repo, pr_number)` - Get PR details
- `GitHubSearchResult` - Data model for search results

### BuilderAgent

**File**: `agents/builder_agent.py`

Provides:
- `BuilderAgent.search_pr_by_jira_id(jira_id)` - Orchestrates PR search and returns activity logs

## Frontend Component

**File**: `release-dashboard/src/components/PRSearchPanel.jsx`

Features:
- Search input for Jira ticket ID
- Loading state with spinner
- Error handling and toast notifications
- PR result cards with status badges
- Direct links to GitHub PRs

## Example Usage

1. **Open Release Dashboard**: `http://localhost:5174`
2. **Scroll to PR Search Section**: BuilderAgent panel
3. **Enter Jira Ticket ID**: e.g., `SR-2`
4. **Click "Search PRs"**: Results display below
5. **Click PR Title**: Opens PR in GitHub

## Status Colors

- **Open**: Blue - Active pull request
- **Merged**: Purple - Successfully merged
- **Closed**: Gray - Closed without merge

## Error Handling

- Missing GITHUB_TOKEN: Returns clear error message
- GitHub API failures: Caught and returned as error logs
- No matching PRs: Returns success with empty results and info toast

## Activity Logs

Returns detailed activity logs showing:
- GitHub Search Initiated
- GitHub API Query details
- Results Retrieved count
- Completion status

## Future Enhancements

- [ ] PR filtering and sorting
- [ ] Integration with release notes
- [ ] Automatic PR assignment suggestions
- [ ] Custom search filters
- [ ] PR merge status tracking
