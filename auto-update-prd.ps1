# Auto-Update PRD Script
# Monitors GitHub Issues for changes and regenerates PRD.md & PRD.json automatically
# 
# Usage:
#   .\auto-update-prd.ps1          # Run once (check and update if needed)
#   .\auto-update-prd.ps1 -Watch   # Continuous monitoring mode
#   .\auto-update-prd.ps1 -Force   # Force regeneration

param(
    [switch]$Watch,     # Continuous monitoring mode
    [switch]$Force      # Force regeneration even if no changes detected
)

# Configuration
$PROJECT_ROOT = $PSScriptRoot
$ISSUES_DIR = Join-Path $PROJECT_ROOT ".vscode\github-issues"
$NOTEBOOK_PATH = Join-Path $PROJECT_ROOT "PRD.ipynb"
$CACHE_FILE = Join-Path $PROJECT_ROOT ".vscode\github-issues\prd-update-cache.json"
$LOG_FILE = Join-Path $PROJECT_ROOT ".vscode\github-issues\prd-update.log"

# Ensure cache directory exists
$CACHE_DIR = Split-Path $CACHE_FILE -Parent
if (-not (Test-Path $CACHE_DIR)) {
    New-Item -ItemType Directory -Path $CACHE_DIR -Force | Out-Null
}

# Function: Get hash of all issue files
function Get-IssuesHash {
    if (-not (Test-Path $ISSUES_DIR)) {
        return ""
    }
    
    $issueFiles = Get-ChildItem -Path $ISSUES_DIR -Filter "issue-*.md" -File | Sort-Object Name
    
    if ($issueFiles.Count -eq 0) {
        return ""
    }
    
    $combinedContent = ""
    foreach ($file in $issueFiles) {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $combinedContent += $content
    }
    
    # Calculate SHA256 hash
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($combinedContent)
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash($bytes)
    $hash = [System.BitConverter]::ToString($hashBytes).Replace("-", "")
    
    return $hash
}

# Function: Load cache
function Get-Cache {
    if (Test-Path $CACHE_FILE) {
        try {
            $cache = Get-Content $CACHE_FILE -Raw | ConvertFrom-Json
            return $cache
        } catch {
            Write-Host "⚠️  Failed to load cache, creating new one" -ForegroundColor Yellow
            return @{
                lastHash = ""
                lastUpdateTime = ""
                updateCount = 0
            }
        }
    }
    return @{
        lastHash = ""
        lastUpdateTime = ""
        updateCount = 0
    }
}

# Function: Save cache
function Save-Cache {
    param($cache)
    
    $cacheJson = $cache | ConvertTo-Json -Depth 10
    Set-Content -Path $CACHE_FILE -Value $cacheJson -Encoding UTF8
}

# Function: Log message
function Write-Log {
    param([string]$Message)
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] $Message"
    Add-Content -Path $LOG_FILE -Value $logEntry -Encoding UTF8
    Write-Host $logEntry
}

# Function: Run Jupyter notebook
function Invoke-NotebookExecution {
    Write-Log "🚀 Starting PRD notebook execution..."
    
    # Check if jupyter is installed
    $jupyterCheck = Get-Command jupyter -ErrorAction SilentlyContinue
    if (-not $jupyterCheck) {
        Write-Log "❌ Jupyter not found. Install with: pip install jupyter nbconvert"
        return $false
    }
    
    # Execute notebook (overwrites in place)
    try {
        Write-Host "   Running: jupyter nbconvert --execute --to notebook --inplace PRD.ipynb" -ForegroundColor Cyan
        $output = & jupyter nbconvert --execute --to notebook --inplace $NOTEBOOK_PATH 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Notebook executed successfully"
            Write-Log "   Generated: PRD.md, PRD.json"
            return $true
        } else {
            Write-Log "❌ Notebook execution failed"
            Write-Log "   Error: $output"
            return $false
        }
    } catch {
        Write-Log "❌ Exception during notebook execution: $_"
        return $false
    }
}

# Function: Check and update PRD
function Update-PRD {
    param([bool]$ForceUpdate = $false)
    
    Write-Host "`n📊 Checking GitHub Issues for changes..." -ForegroundColor Cyan
    
    # Get current issues hash
    $currentHash = Get-IssuesHash
    
    if ([string]::IsNullOrEmpty($currentHash)) {
        Write-Log "⚠️  No issue files found in $ISSUES_DIR"
        return $false
    }
    
    # Load cache
    $cache = Get-Cache
    
    # Compare hashes
    if (-not $ForceUpdate -and $cache.lastHash -eq $currentHash) {
        Write-Host "✅ No changes detected (hash: $($currentHash.Substring(0, 8))...)" -ForegroundColor Green
        Write-Host "   Last update: $($cache.lastUpdateTime)" -ForegroundColor Gray
        return $false
    }
    
    # Changes detected!
    if ($ForceUpdate) {
        Write-Log "🔄 Force update requested"
    } else {
        Write-Log "⚡ Issue changes detected!"
        Write-Log "   Old hash: $($cache.lastHash.Substring(0, 8))..."
        Write-Log "   New hash: $($currentHash.Substring(0, 8))..."
    }
    
    # Run notebook
    $success = Invoke-NotebookExecution
    
    if ($success) {
        # Update cache
        $cache.lastHash = $currentHash
        $cache.lastUpdateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $cache.updateCount++
        Save-Cache $cache
        
        Write-Log "📈 Total updates: $($cache.updateCount)"
        return $true
    } else {
        Write-Log "⚠️  Update failed, cache not updated"
        return $false
    }
}

# Main execution
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRD Auto-Update Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Project: $PROJECT_ROOT" -ForegroundColor Gray
Write-Host "  Issues:  $ISSUES_DIR" -ForegroundColor Gray
Write-Host "  Notebook: $NOTEBOOK_PATH" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════`n" -ForegroundColor Cyan

if ($Watch) {
    Write-Host "👀 Entering watch mode (Ctrl+C to stop)..." -ForegroundColor Yellow
    Write-Host "   Checking for changes every 30 seconds`n" -ForegroundColor Gray
    
    while ($true) {
        Update-PRD -ForceUpdate:$Force
        Start-Sleep -Seconds 30
    }
} else {
    # Single run
    $updated = Update-PRD -ForceUpdate:$Force
    
    if ($updated) {
        Write-Host "`n🎉 PRD files updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n💤 No update needed" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Done!`n" -ForegroundColor Green
