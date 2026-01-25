# Coverage Validator for New Code (PowerShell)
# Validates that new/modified code meets 75% coverage threshold

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceFile,
    
    [Parameter(Mandatory=$false)]
    [int]$Threshold = 75  # Default 75%, can override for P1 tasks (90%)
)

$ErrorActionPreference = "Stop"

Write-Host "📊 Checking coverage for: $SourceFile" -ForegroundColor Cyan
Write-Host "🎯 Threshold: ${Threshold}%" -ForegroundColor Cyan
Write-Host ""

# Find corresponding test file
$testFile = $SourceFile -replace '\.ts$', '.test.ts' -replace '(src\\[^\\]*)\\(.*)', '$1\__tests__\$2'

if (-not (Test-Path $testFile)) {
    Write-Host "❌ Test file not found: $testFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create a test file first:" -ForegroundColor Yellow
    $testDir = Split-Path $testFile -Parent
    Write-Host "  mkdir $testDir" -ForegroundColor Gray
    Write-Host "  New-Item $testFile" -ForegroundColor Gray
    exit 1
}

# Run tests with coverage for specific file
Write-Host "🏃 Running tests..." -ForegroundColor Cyan
npm test -- --coverage --collectCoverageFrom="$SourceFile" "$testFile" --silent
$exitCode = $LASTEXITCODE

# Parse coverage from JSON report
$coverageJson = "coverage\coverage-summary.json"

if (-not (Test-Path $coverageJson)) {
    Write-Host "❌ Coverage report not found at $coverageJson" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📈 Analyzing coverage..." -ForegroundColor Cyan
Write-Host ""

# Use Node.js to parse JSON and calculate metrics
$analysisScript = @"
const coverage = require('./$coverageJson');
const sourceFile = '$SourceFile'.replace(/\\/g, '/');

// Find the file in coverage report
const fileKey = Object.keys(coverage).find(k => k.includes(sourceFile));

if (!fileKey) {
  console.error('❌ File not found in coverage report');
  process.exit(1);
}

const metrics = coverage[fileKey];

// Extract percentages
const linesPct = metrics.lines.pct;
const branchesPct = metrics.branches.pct;
const functionsPct = metrics.functions.pct;
const statementsPct = metrics.statements.pct;

// Calculate weighted score
// Lines: 40%, Branches: 30%, Functions: 20%, Statements: 10%
const weighted = (linesPct * 0.4) + (branchesPct * 0.3) + (functionsPct * 0.2) + (statementsPct * 0.1);

// Display results
console.log('Coverage Breakdown:');
console.log('-------------------');
console.log(\`Lines:      \${linesPct.toFixed(1)}% (\${metrics.lines.covered}/\${metrics.lines.total})\`);
console.log(\`Branches:   \${branchesPct.toFixed(1)}% (\${metrics.branches.covered}/\${metrics.branches.total})\`);
console.log(\`Functions:  \${functionsPct.toFixed(1)}% (\${metrics.functions.covered}/\${metrics.functions.total})\`);
console.log(\`Statements: \${statementsPct.toFixed(1)}% (\${metrics.statements.covered}/\${metrics.statements.total})\`);
console.log('');
console.log(\`Weighted Score: \${weighted.toFixed(1)}%\`);
console.log('');

// Check against threshold
const threshold = $Threshold;

if (weighted >= threshold) {
  console.log(\`✅ PASS: Coverage \${weighted.toFixed(1)}% meets \${threshold}% threshold\`);
  process.exit(0);
} else {
  console.log(\`❌ FAIL: Coverage \${weighted.toFixed(1)}% below \${threshold}% threshold\`);
  console.log('');
  console.log('Action required:');
  console.log(\`  - Add tests to improve coverage by \${(threshold - weighted).toFixed(1)}%\`);
  console.log('  - Focus on uncovered lines (see HTML report)');
  console.log('  - Run: npm test -- --coverage --coverageReporters=html');
  process.exit(1);
}
"@

# Run Node.js analysis
node -e $analysisScript
exit $LASTEXITCODE
