#!/bin/bash
# ESLint Auto-Fix Script
# Automatically fixes linting errors in modified TypeScript/JavaScript files

set -e

echo "🔍 Detecting modified files..."

# Get modified TypeScript/JavaScript files
MODIFIED_FILES=$(git diff --name-only --diff-filter=ACMR | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$MODIFIED_FILES" ]; then
  echo "✅ No modified files to lint"
  exit 0
fi

echo "📝 Found modified files:"
echo "$MODIFIED_FILES"
echo ""

# Run ESLint with --fix
echo "🔧 Running ESLint --fix..."
npm run lint -- --fix $MODIFIED_FILES

echo ""
echo "✅ Auto-fix completed!"
echo ""

# Run linting again to show final state
echo "📊 Final linting report:"
npm run lint -- $MODIFIED_FILES || {
  echo ""
  echo "⚠️ Some issues remain - manual fixes may be needed"
  exit 1
}

echo ""
echo "✅ All files pass linting!"
