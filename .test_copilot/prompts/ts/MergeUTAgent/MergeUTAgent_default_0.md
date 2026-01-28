# Action Required: Merge and Cleanup Separated Unit Test Files

## Task
Merge multiple separated TypeScript unit test files into a single comprehensive test file. The comprehensive test file may or may not exist; if it does not exist, create it.

## Files
### Merged Test File (Target):
<<<TargetFilePath>>>

### Separated Test Files (Sources to Merge):
<<<FilePathList>>>

## Instructions
Perform these steps strictly in order:

1. **Ensure Target File Exists**
   - If the merged test file at `<<<TargetFilePath>>>` does not exist, create it first as an empty valid test file suitable for the framework `<<<TestFramework>>>`.

2. **Merge Test Cases**
   - Append all tests from each separated test file listed above into the merged test file.
   - Move module mocks inside corresponding `describe` blocks to prevent conflicts.
   - Clearly resolve naming conflicts and duplication.

3. **Cleanup Merged File**
   - Remove duplicate imports, redundant mocks, or unnecessary code.
   - Ensure the merged test file is clean, readable, and correctly formatted.

4. **Validation**
   - Run the merged test file using the testing framework `<<<TestFramework>>>`.
   - Confirm that all tests pass without errors.
   - **Do NOT proceed** if any tests fail.

5. **Coverage Measurement**
   - Run coverage analysis on the merged test file using `<<<TestFramework>>>` coverage tools (e.g., `jest --coverage` or `nyc`).
   - Report the coverage metrics: **line coverage %**, **branch coverage %**, **function coverage %**, and **statement coverage %**.
   - If coverage is below `<<<MinCoverage>>>%` (default: 75%), generate additional test cases to cover uncovered branches and lines.
   - Re-run validation after adding new tests.
   - **Success criteria**: All tests pass AND coverage >= `<<<MinCoverage>>>%`.

6. **Delete Separated Files**
   - Only after successful validation and coverage requirements are met, delete all separated test files listed above.

## Safety Measures
- Keep the `@aiContributed-@{date}` tag before the test cases (if it exists).
- Do **NOT** delete any source files if merging or validation fails.
- Do **NOT** overwrite or delete unrelated files.
- Do **NOT** return or output any file contents or logs.

## Execution Note
Perform these actions silently and accurately, adhering strictly to these instructions.