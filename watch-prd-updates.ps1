# File Watcher for PRD Auto-Update
# Simpler alternative to Task Scheduler - watches issue files and runs PRD notebook on changes
# 
# Usage: .\watch-prd-updates.ps1
# Keep this window open to monitor for changes. Press Ctrl+C to stop.

$PROJECT_ROOT = $PSScriptRoot
$ISSUES_DIR = Join-Path $PROJECT_ROOT ".vscode\github-issues"
$SCRIPT_PATH = Join-Path $PROJECT_ROOT "auto-update-prd.ps1"

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRD File Watcher (Simple Mode)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Watching: $ISSUES_DIR" -ForegroundColor Gray
Write-Host "  Script:   $SCRIPT_PATH" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

if (-not (Test-Path $ISSUES_DIR)) {
    Write-Host "❌ Issues directory not found: $ISSUES_DIR" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $SCRIPT_PATH)) {
    Write-Host "❌ Update script not found: $SCRIPT_PATH" -ForegroundColor Red
    exit 1
}

Write-Host "👀 Watching for changes to issue files..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop`n" -ForegroundColor Gray

# Create file system watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $ISSUES_DIR
$watcher.Filter = "issue-*.md"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

# Debounce timer (prevent multiple rapid triggers)
$debounceTimer = $null
$debounceDelay = 2000  # 2 seconds

# Function to run update
function Invoke-PRDUpdate {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ⚡ Change detected - running update..." -ForegroundColor Cyan
    
    try {
        & $SCRIPT_PATH
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Update complete`n" -ForegroundColor Green
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ Update failed: $_`n" -ForegroundColor Red
    }
}

# Debounced update function
function Start-DebouncedUpdate {
    if ($null -ne $debounceTimer) {
        $debounceTimer.Stop()
        $debounceTimer.Dispose()
    }
    
    $debounceTimer = New-Object System.Timers.Timer
    $debounceTimer.Interval = $debounceDelay
    $debounceTimer.AutoReset = $false
    
    Register-ObjectEvent -InputObject $debounceTimer -EventName Elapsed -Action {
        Invoke-PRDUpdate
    } | Out-Null
    
    $debounceTimer.Start()
}

# Event handlers
$onChange = Register-ObjectEvent -InputObject $watcher -EventName Changed -Action {
    $name = $Event.SourceEventArgs.Name
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 📝 Changed: $name" -ForegroundColor Gray
    Start-DebouncedUpdate
}

$onCreate = Register-ObjectEvent -InputObject $watcher -EventName Created -Action {
    $name = $Event.SourceEventArgs.Name
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ➕ Created: $name" -ForegroundColor Gray
    Start-DebouncedUpdate
}

$onDelete = Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action {
    $name = $Event.SourceEventArgs.Name
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ➖ Deleted: $name" -ForegroundColor Gray
    Start-DebouncedUpdate
}

# Run initial update
Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 🚀 Running initial update..." -ForegroundColor Cyan
& $SCRIPT_PATH
Write-Host "`n"

# Keep running until Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Cleanup
    Write-Host "`n🛑 Stopping watcher..." -ForegroundColor Yellow
    
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    
    Unregister-Event -SourceIdentifier $onChange.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $onCreate.Name -ErrorAction SilentlyContinue
    Unregister-Event -SourceIdentifier $onDelete.Name -ErrorAction SilentlyContinue
    
    if ($null -ne $debounceTimer) {
        $debounceTimer.Dispose()
    }
    
    Write-Host "✅ Watcher stopped`n" -ForegroundColor Green
}
