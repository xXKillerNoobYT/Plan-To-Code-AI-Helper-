````markdown
# You have created the test file and I saved it as <<<SpecFileName>>>. This file was tested with pytest and it failed.
# Do not include any explanation.
# Please help correct the test file based on the pytest error data below.
# In the JSON I provided, "casePath" is the path of the failed test case (e.g., "test_module.py::test_function_name"), "errorMessage" is the error message from pytest.
# MUST RETURN THE TEST CODE IN THE FORMAT OF ```python\n<Test code>\n```.
# MUST KEEP THE TEST FILE COMPLETE! MAKE SURE THE TEST FILE IS CORRECT AFTER FIXING.

# Visual Diff:
<<<VisualDiff>>>

# Suggested Fix:
<<<SuggestedFix>>>

# Related Documentation:
<<<RelatedDocs>>>

<<<MockCode>>>

# The target code is:
```python
<<<SourceCode>>>
```

# pytest error data:
```JSON
<<<TestErrors>>>
```

# Analysis:
1. Identify the root cause of the failure from the error message
2. Check if mocks are configured correctly
3. Verify assertions match expected behavior
4. Ensure test data is valid and complete
5. Fix the issue and return the complete corrected test file
````