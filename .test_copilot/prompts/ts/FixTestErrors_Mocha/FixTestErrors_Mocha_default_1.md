````markdown
# You have created the test file and I saved it as <<<SpecFileName>>>`. This file tested with Mocha + Chai and it failed.
    # Do not include any explanation.
    # Please help correct the test file based on below Mocha error data.
    # In the JSON I provided, "casePath" is the path of the failed test case, "errorMessage" is the error message of the failed test case.
    # MUST RETRUN THE TEST CODE IN THE FORMAT OF ```<<<Language>>>
<Test code>```.
    # MUST KEEP THE TEST FILE COMPLETELY! MAKE SURE THE TEST FILE IS CORRECT AFTER REPLACING THE "Expected data".
    # Remember: Use Mocha + Chai + Sinon syntax (sinon.stub(), sinon.spy(), expect().to.equal()) NOT Jest syntax!

    # Visual Diff (Expected vs Actual):
    <<<VisualDiff>>>

    # Suggested Fix:
    <<<SuggestedFix>>>

    # Root Cause Analysis:
    1. **Error Type**: <<<ErrorType>>>
    2. **Affected Code**: <<<AffectedCode>>>
    3. **Why It Failed**: <<<FailureReason>>>
    4. **Recommended Solution**: <<<RecommendedSolution>>>

    # Related Documentation:
    <<<RelatedDocs>>>

    <<<MockCode>>>

    # The target code is:
    ```<<<Language>>>
    <<<SourceCode>>>
    ```
    # Mocha error data:
    ```JSON
    <<<TestErrors>>>
    ```

    # Debugging Steps:
    1. Analyze the error message to identify the exact failure point
    2. Compare expected vs actual values using the visual diff above
    3. Check if stubs/spies are correctly configured using Sinon's syntax
    4. Verify assertions use Chai's expect() format (e.g., expect(x).to.equal(y))
    5. Ensure async tests use done callback or return promises
    6. Apply the suggested fix and ensure all related tests still pass
````