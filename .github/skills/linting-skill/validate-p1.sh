#!/bin/bash
# P1 Task Linting Validator
# Enforces zero-warning requirement for critical priority tasks

set -e

if [ -z "$1" ]; then
  echo "Usage: validate-p1.sh <file-path>"
  exit 1
fi

FILE_PATH=$1

echo "🔍 Validating P1 linting requirements for: $FILE_PATH"
echo ""

# Run ESLint with max-warnings=0 (P1 requirement)
npm run lint -- --max-warnings=0 "$FILE_PATH"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ PASS: P1 linting requirements met (zero warnings)"
  exit 0
else
  echo ""
  echo "❌ FAIL: P1 tasks require zero warnings"
  echo ""
  echo "Action required:"
  echo "1. Fix all warnings manually"
  echo "2. Run: npm run lint -- --fix $FILE_PATH"
  echo "3. Review remaining issues"
  exit 1
fi
