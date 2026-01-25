# PRD Update Script Guide

## Overview
The `update-prd` script keeps PRD.md and Status/status-log.md in sync with open GitHub issues. It categorizes open issues (bugs → Testing notes, features/enhancements → Plans) and appends concise entries to PRD and the status log.

## Quick Start
1) Ensure you have a GitHub token with `repo` or `public_repo` scope:
   - PowerShell: `$env:GITHUB_TOKEN = "<token>"`
2) (Optional) Override owner/repo:
   - `$env:COE_GITHUB_OWNER = "xXKillerNoobYT"`
   - `$env:COE_GITHUB_REPO = "Plan-To-Code-AI-Helper-"`
3) Run the script: `npm run update-prd`
4) Review PRD.md and Status/status-log.md for new entries, then commit if correct.

## API Reference
- **Command**: `npm run update-prd`
  - Uses `ts-node/register` to execute `src/scripts/update-prd.ts`.
- **Env Vars**:
  - `GITHUB_TOKEN` (or `GH_TOKEN`): authentication (required)
  - `COE_GITHUB_OWNER`: owner override (default `xXKillerNoobYT`)
  - `COE_GITHUB_REPO`: repo override (default `Plan-To-Code-AI-Helper-`)
- **Outputs**:
  - Appends to `PRD.md` under `## Updates from GitHub Issues`:
    - `- From issue #<n>: <title> (<url>) [Testing|Plans]`
  - Appends to `Status/status-log.md` with dated section:
    - `## YYYY-MM-DD: GitHub Issue Sync`

## Examples
```bash
# Basic run
$env:GITHUB_TOKEN = "ghp_example"; npm run update-prd

# Different fork
$env:COE_GITHUB_OWNER = "my-org"; $env:COE_GITHUB_REPO = "coe"; npm run update-prd
```

## Common Mistakes
- ❌ Running without `GITHUB_TOKEN` → script fails fast with a clear error.
- ❌ Expecting uncategorized issues to appear → only issues labeled `bug` map to Testing; `feature`/`enhancement` map to Plans.
- ❌ Running from a different CWD → paths resolve relative to repo root; run from project root.

## Troubleshooting
- **No updates added**: Issues may lack `bug`/`feature`/`enhancement` labels or entries already exist in PRD.md.
- **Duplicate entries**: Script dedupes by issue number; verify existing PRD text follows `From issue #<n>:` format.
- **Permission errors**: Ensure token has repo access, especially for private repositories.

## Related Docs
- `.github/copilot-instructions.md` (PRD update rules & operational note)
- `Status/status-log.md` (log destination)
- `PRD.md` (primary requirements doc)
