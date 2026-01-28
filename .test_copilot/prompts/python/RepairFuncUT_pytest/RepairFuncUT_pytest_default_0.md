````markdown
# The source function `<<<FunctionName>>>` has been modified. You need to update the existing test file `<<<SpecFileName>>>` to reflect the changes.

# Old Source Code:
```python
<<<OldSourceCode>>>
```

# New Source Code:
```python
<<<NewSourceCode>>>
```

# Existing Test File:
```python
<<<ExistingTestCode>>>
```

# Guidelines:
- Analyze the differences between old and new source code
- Update test cases to match the new function signature, behavior, and logic
- Add new test cases for newly added functionality
- Remove or update test cases for removed or changed functionality
- Keep all existing test cases that are still valid
- MUST NOT have any Python syntax errors or type errors
- MUST NOT mock functions/classes in the same module
- Mock all external dependencies using `mocker.patch()` or `monkeypatch`
- Follow pytest best practices (fixtures, parametrize, descriptive test names)
- MUST RETURN THE COMPLETE UPDATED TEST CODE IN THE FORMAT OF ```python\n<Test code>\n```
- Preserve test structure and organization where possible
- Keep `# @aiContributed-@{date}` tags if present

# Change Summary:
<<<ChangeSummary>>>

# Expected Updates:
1. Identify which test cases are affected by the changes
2. Update or add test cases as needed
3. Ensure all edge cases and error conditions are still covered
4. Return the complete updated test file
````