# P1 Task Linting Validator (PowerShell)
# Enforces zero-warning requirement for critical priority tasks

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Validating P1 linting requirements for: $FilePath" -ForegroundColor Cyan
Write-Host ""

# Run ESLint with max-warnings=0 (P1 requirement)
npm run lint -- --max-warnings=0 $FilePath
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ PASS: P1 linting requirements met (zero warnings)" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "❌ FAIL: P1 tasks require zero warnings" -ForegroundColor Red
    Write-Host ""
    Write-Host "Action required:" -ForegroundColor Yellow
    Write-Host "1. Fix all warnings manually"
    Write-Host "2. Run: npm run lint -- --fix $FilePath"
    Write-Host "3. Review remaining issues"
    exit 1
}
