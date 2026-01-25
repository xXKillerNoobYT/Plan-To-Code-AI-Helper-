# Jest Test Runner (PowerShell)
# Runs tests for modified source files with coverage reporting

$ErrorActionPreference = "Stop"

Write-Host "🧪 Running Jest tests for modified files..." -ForegroundColor Cyan
Write-Host ""

# Get modified source files (exclude test files)
$modifiedSrc = git diff --name-only --diff-filter=ACMR | Where-Object { 
    $_ -match 'src\\.*\.ts$' -and $_ -notmatch '\.test\.ts$' 
}

if (-not $modifiedSrc) {
    Write-Host "✅ No source files modified - skipping tests" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Modified source files:" -ForegroundColor Yellow
$modifiedSrc | ForEach-Object { Write-Host "  $_" }
Write-Host ""

# Find corresponding test files
$testFiles = @()
$missingTests = @()

foreach ($file in $modifiedSrc) {
    # Convert src/foo/bar.ts → src/foo/__tests__/bar.test.ts
    $testFile = $file -replace '\.ts$', '.test.ts' -replace '(src\\[^\\]*)\\(.*)', '$1\__tests__\$2'
    
    if (Test-Path $testFile) {
        $testFiles += $testFile
        Write-Host "✅ Found test: $testFile" -ForegroundColor Green
    } else {
        $missingTests += $file
    }
}

Write-Host ""

if ($missingTests.Count -gt 0) {
    Write-Host "⚠️  WARNING: Missing test files for:" -ForegroundColor Yellow
    $missingTests | ForEach-Object { Write-Host "  - $_" }
    Write-Host ""
    Write-Host "Consider creating test files before proceeding." -ForegroundColor Yellow
    Write-Host ""
}

if ($testFiles.Count -eq 0) {
    Write-Host "❌ No test files found for modified sources" -ForegroundColor Red
    exit 1
}

# Run tests with coverage
Write-Host "🏃 Executing tests with coverage..." -ForegroundColor Cyan
Write-Host ""

$collectFrom = $modifiedSrc -join ','
npm test -- --coverage --collectCoverageFrom="$collectFrom" $testFiles
$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Tests failed - see details above" -ForegroundColor Red
}

exit $exitCode
