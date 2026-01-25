# PRD Auto-Update Setup

This script automatically regenerates `PRD.md` and `PRD.json` whenever GitHub Issues change.

## Quick Start

### 1. Install Jupyter (if not already installed)

```powershell
pip install jupyter nbconvert
```

### 2. Run the script

**Check once and update if needed:**
```powershell
.\auto-update-prd.ps1
```

**Force regeneration (ignores cache):**
```powershell
.\auto-update-prd.ps1 -Force
```

**Continuous monitoring (checks every 30 seconds):**
```powershell
.\auto-update-prd.ps1 -Watch
```

## How It Works

1. **Detects Changes**: Computes SHA256 hash of all `issue-*.md` files
2. **Smart Caching**: Skips regeneration if issue content hasn't changed
3. **Runs Notebook**: Executes `PRD.ipynb` to generate fresh PRD.md and PRD.json
4. **Logs Everything**: Keeps audit trail in `.vscode/github-issues/prd-update.log`

## Files Created

- `.vscode/github-issues/prd-update-cache.json` - Tracks last hash and update time
- `.vscode/github-issues/prd-update.log` - Audit log of all updates

## Automatic Scheduling (Optional)

### Option A: Windows Task Scheduler (Runs in background)

Run this setup script:
```powershell
.\setup-prd-scheduler.ps1
```

This creates a scheduled task that:
- Runs every 5 minutes
- Only when you're logged in
- Updates PRD if issues changed

### Option B: Manual watching

Keep a PowerShell window open:
```powershell
.\auto-update-prd.ps1 -Watch
```

### Option C: GitHub Issues sync integration

Add to your GitHub Issues sync script (if you have one):
```powershell
# After syncing issues
.\auto-update-prd.ps1
```

## Checking Status

View the log:
```powershell
Get-Content .vscode\github-issues\prd-update.log -Tail 20
```

View the cache:
```powershell
Get-Content .vscode\github-issues\prd-update-cache.json | ConvertFrom-Json | Format-List
```

## Troubleshooting

**"Jupyter not found"**
- Install: `pip install jupyter nbconvert`
- Restart PowerShell after install

**"Notebook execution failed"**
- Check log file for error details
- Run notebook manually in VS Code to see errors
- Verify all Python dependencies are installed

**"Permission denied"**
- Run PowerShell as Administrator
- Or: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

## Testing

Test the setup:
```powershell
# 1. Check current state
.\auto-update-prd.ps1

# 2. Force update to verify it works
.\auto-update-prd.ps1 -Force

# 3. Check that PRD.md was updated
(Get-Item PRD.md).LastWriteTime
```
