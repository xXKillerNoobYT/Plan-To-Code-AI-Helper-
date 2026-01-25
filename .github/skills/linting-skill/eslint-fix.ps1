# ESLint Auto-Fix Script (PowerShell)
# Automatically fixes linting errors in modified TypeScript/JavaScript files

$ErrorActionPreference = "Stop"

Write-Host "🔍 Detecting modified files..." -ForegroundColor Cyan

# Get modified TypeScript/JavaScript files
$modifiedFiles = git diff --name-only --diff-filter=ACMR | Where-Object { $_ -match '\.(ts|tsx|js|jsx)$' }

if (-not $modifiedFiles) {
    Write-Host "✅ No modified files to lint" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Found modified files:" -ForegroundColor Yellow
$modifiedFiles | ForEach-Object { Write-Host "  $_" }
Write-Host ""

# Run ESLint with --fix
Write-Host "🔧 Running ESLint --fix..." -ForegroundColor Cyan
npm run lint -- --fix $modifiedFiles

Write-Host ""
Write-Host "✅ Auto-fix completed!" -ForegroundColor Green
Write-Host ""

# Run linting again to show final state
Write-Host "📊 Final linting report:" -ForegroundColor Cyan
$lintResult = npm run lint -- $modifiedFiles
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ All files pass linting!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "⚠️ Some issues remain - manual fixes may be needed" -ForegroundColor Yellow
    exit 1
}
