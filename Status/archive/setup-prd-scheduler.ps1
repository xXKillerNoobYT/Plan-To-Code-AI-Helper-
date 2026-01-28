# Setup Windows Task Scheduler for PRD Auto-Update
# Creates a scheduled task that runs every 5 minutes to check for GitHub Issues changes
# and regenerates PRD.md/PRD.json automatically

$PROJECT_ROOT = $PSScriptRoot
$SCRIPT_PATH = Join-Path $PROJECT_ROOT "auto-update-prd.ps1"
$TASK_NAME = "PRD-Auto-Update"
$CHECK_INTERVAL = 5  # minutes

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRD Auto-Update Scheduler Setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Scheduled task will only run when you're logged in`n" -ForegroundColor Gray
}

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Task '$TASK_NAME' already exists`n" -ForegroundColor Yellow
    $response = Read-Host "Do you want to replace it? (y/n)"
    
    if ($response -ne 'y') {
        Write-Host "❌ Setup cancelled" -ForegroundColor Red
        exit
    }
    
    Unregister-ScheduledTask -TaskName $TASK_NAME -Confirm:$false
    Write-Host "✅ Removed existing task`n" -ForegroundColor Green
}

# Create scheduled task
Write-Host "📅 Creating scheduled task..." -ForegroundColor Cyan

# Task action: Run PowerShell script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -File `"$SCRIPT_PATH`"" `
    -WorkingDirectory $PROJECT_ROOT

# Task trigger: Every X minutes
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes $CHECK_INTERVAL) -RepetitionDuration ([TimeSpan]::MaxValue)

# Task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# Task principal (run as current user)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

# Register the task
try {
    $task = Register-ScheduledTask `
        -TaskName $TASK_NAME `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Automatically updates PRD.md and PRD.json when GitHub Issues change (every $CHECK_INTERVAL minutes)" `
        -ErrorAction Stop
    
    # Verify task was actually created
    Start-Sleep -Seconds 1
    $verifyTask = Get-ScheduledTask -TaskName $TASK_NAME -ErrorAction SilentlyContinue
    
    if (-not $verifyTask) {
        throw "Task registration appeared successful but task not found in scheduler"
    }
    
    Write-Host "✅ Scheduled task created and verified successfully!`n" -ForegroundColor Green
    
    # Display task details
    Write-Host "📋 Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $TASK_NAME" -ForegroundColor Gray
    Write-Host "   Interval: Every $CHECK_INTERVAL minutes" -ForegroundColor Gray
    Write-Host "   Script: $SCRIPT_PATH" -ForegroundColor Gray
    Write-Host "   Status: Ready" -ForegroundColor Gray
    
    # Offer to run now
    Write-Host "`n"
    $runNow = Read-Host "Do you want to run the task now to test it? (y/n)"
    
    if ($runNow -eq 'y') {
        Write-Host "`n🚀 Running task..." -ForegroundColor Cyan
        try {
            Start-ScheduledTask -TaskName $TASK_NAME -ErrorAction Stop
            Start-Sleep -Seconds 3
            
            # Check task status
            $taskInfo = Get-ScheduledTaskInfo -TaskName $TASK_NAME
            $lastResult = if ($taskInfo.LastTaskResult -eq 0) { "Success (0)" } else { "Error ($($taskInfo.LastTaskResult))" }
            Write-Host "   Last Run: $lastResult" -ForegroundColor Gray
            Write-Host "   Next Run: $($taskInfo.NextRunTime)" -ForegroundColor Gray
            
            # Check if log file was created
            Start-Sleep -Seconds 2
            $logPath = Join-Path $PROJECT_ROOT ".vscode\github-issues\prd-update.log"
            if (Test-Path $logPath) {
                Write-Host "`n📋 Recent log entries:" -ForegroundColor Cyan
                Get-Content $logPath -Tail 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
            }
        } catch {
            Write-Host "   ⚠️  Failed to run task: $_" -ForegroundColor Yellow
            Write-Host "   Try running manually: Start-ScheduledTask -TaskName '$TASK_NAME'" -ForegroundColor Gray
        }
    }
    
    Write-Host "`n✨ Setup complete!" -ForegroundColor Green
    Write-Host "`n📚 What happens now:" -ForegroundColor Cyan
    Write-Host "   1. Task runs every $CHECK_INTERVAL minutes automatically" -ForegroundColor Gray
    Write-Host "   2. Checks if GitHub Issues changed" -ForegroundColor Gray
    Write-Host "   3. Regenerates PRD.md/PRD.json if changes detected" -ForegroundColor Gray
    Write-Host "   4. Logs everything to .vscode\github-issues\prd-update.log" -ForegroundColor Gray
    
    Write-Host "`n🔧 Management commands:" -ForegroundColor Cyan
    Write-Host "   View status:  Get-ScheduledTask -TaskName '$TASK_NAME'" -ForegroundColor Gray
    Write-Host "   Run manually: Start-ScheduledTask -TaskName '$TASK_NAME'" -ForegroundColor Gray
    Write-Host "   Disable:      Disable-ScheduledTask -TaskName '$TASK_NAME'" -ForegroundColor Gray
    Write-Host "   Remove:       Unregister-ScheduledTask -TaskName '$TASK_NAME'" -ForegroundColor Gray
    
    Write-Host "`n📊 View logs:" -ForegroundColor Cyan
    Write-Host "   Get-Content .vscode\github-issues\prd-update.log -Tail 20" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ Failed to create scheduled task" -ForegroundColor Red
    Write-Host "   Error: $_`n" -ForegroundColor Red
    
    # Provide troubleshooting guidance
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    
    if (-not $isAdmin) {
        Write-Host "   1. Try running PowerShell as Administrator" -ForegroundColor Gray
        Write-Host "      Right-click PowerShell → Run as Administrator" -ForegroundColor Gray
    }
    
    Write-Host "   2. Check if Task Scheduler service is running:" -ForegroundColor Gray
    Write-Host "      Get-Service -Name Schedule" -ForegroundColor Gray
    Write-Host "   3. Try the manual approach instead:" -ForegroundColor Gray
    Write-Host "      .\auto-update-prd.ps1 -Watch" -ForegroundColor Gray
    
    exit 1
}

Write-Host "`n"
