#!/bin/bash
# Jest Test Runner
# Runs tests for modified source files with coverage reporting

set -e

echo "🧪 Running Jest tests for modified files..."
echo ""

# Get modified source files (exclude test files)
MODIFIED_SRC=$(git diff --name-only --diff-filter=ACMR | grep -E 'src/.*\.ts$' | grep -v '\.test\.ts$' || true)

if [ -z "$MODIFIED_SRC" ]; then
  echo "✅ No source files modified - skipping tests"
  exit 0
fi

echo "📝 Modified source files:"
echo "$MODIFIED_SRC"
echo ""

# Find corresponding test files
TEST_FILES=""
MISSING_TESTS=""

for file in $MODIFIED_SRC; do
  # Try pattern: src/foo/bar.ts → src/foo/__tests__/bar.test.ts
  TEST_FILE=$(echo "$file" | sed 's/\.ts$/.test.ts/' | sed 's|\(src/[^/]*/\)\(.*\)|\1__tests__/\2|')
  
  if [ -f "$TEST_FILE" ]; then
    TEST_FILES="$TEST_FILES $TEST_FILE"
    echo "✅ Found test: $TEST_FILE"
  else
    MISSING_TESTS="$MISSING_TESTS\n  - $file"
  fi
done

echo ""

if [ -n "$MISSING_TESTS" ]; then
  echo "⚠️  WARNING: Missing test files for:$MISSING_TESTS"
  echo ""
  echo "Consider creating test files before proceeding."
  echo ""
fi

if [ -z "$TEST_FILES" ]; then
  echo "❌ No test files found for modified sources"
  exit 1
fi

# Run tests with coverage
echo "🏃 Executing tests with coverage..."
echo ""

npm test -- --coverage --collectCoverageFrom="$MODIFIED_SRC" $TEST_FILES

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Tests failed - see details above"
fi

exit $EXIT_CODE
