#!/bin/bash
# Coverage Validator for New Code
# Validates that new/modified code meets 75% coverage threshold

set -e

if [ -z "$1" ]; then
  echo "Usage: check-new-coverage.sh <source-file> [threshold]"
  echo ""
  echo "Examples:"
  echo "  check-new-coverage.sh src/mcpServer/tools.ts"
  echo "  check-new-coverage.sh src/agents/orchestrator.ts 90"
  exit 1
fi

SOURCE_FILE=$1
THRESHOLD=${2:-75}  # Default 75%, can override for P1 tasks (90%)

echo "📊 Checking coverage for: $SOURCE_FILE"
echo "🎯 Threshold: ${THRESHOLD}%"
echo ""

# Find corresponding test file
TEST_FILE=$(echo "$SOURCE_FILE" | sed 's/\.ts$/.test.ts/' | sed 's|\(src/[^/]*/\)\(.*\)|\1__tests__/\2|')

if [ ! -f "$TEST_FILE" ]; then
  echo "❌ Test file not found: $TEST_FILE"
  echo ""
  echo "Create a test file first:"
  mkdir -p $(dirname "$TEST_FILE")
  echo "  mkdir -p $(dirname $TEST_FILE)"
  echo "  touch $TEST_FILE"
  exit 1
fi

# Run tests with coverage for specific file
echo "🏃 Running tests..."
npm test -- --coverage --collectCoverageFrom="$SOURCE_FILE" "$TEST_FILE" --silent

# Parse coverage from JSON report
COVERAGE_JSON="coverage/coverage-summary.json"

if [ ! -f "$COVERAGE_JSON" ]; then
  echo "❌ Coverage report not found at $COVERAGE_JSON"
  exit 1
fi

echo ""
echo "📈 Analyzing coverage..."
echo ""

# Use Node.js to parse JSON and calculate metrics
node -e "
const coverage = require('./$COVERAGE_JSON');
const sourceFile = '$SOURCE_FILE';

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
const threshold = $THRESHOLD;

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
"
