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

### Option A: File Watcher (Recommended - No admin needed)

**Simplest approach** - watches issue files and auto-runs on changes:

```powershell
.\watch-prd-updates.ps1
```

Keep this window open. It will:
- ✅ Watch for changes to `issue-*.md` files
- ✅ Run PRD update automatically when changes detected
- ✅ Debounce rapid changes (waits 2 seconds)
- ✅ No administrator privileges required

Press `Ctrl+C` to stop watching.

---

### Option B: Windows Task Scheduler (Runs in background)

**For unattended operation** - requires administrator:

```powershell
# Must run PowerShell as Administrator
.\setup-prd-scheduler.ps1
```

This creates a scheduled task that:
- Runs every 5 minutes in the background
- Only when you're logged in
- Updates PRD if issues changed

**⚠️ Troubleshooting Task Scheduler:**

If you get "The system cannot find the file specified":
1. Try running PowerShell as Administrator (Right-click → Run as Administrator)
2. Check Task Scheduler service: `Get-Service -Name Schedule`
3. Use Option A (File Watcher) or Option C instead

---

### Option C: Manual watching (Original method)

Keep a PowerShell window open:
```powershell
.\auto-update-prd.ps1 -Watch
```

Checks every 30 seconds and updates if changes detected.

---

### Option D: Integrate with GitHub Issues sync

If you have a GitHub Issues sync script, add this at the end:

```powershell
# After syncing issues from GitHub
& "$PSScriptRoot\auto-update-prd.ps1"
```

This ensures PRD updates immediately after issues sync completes.

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
