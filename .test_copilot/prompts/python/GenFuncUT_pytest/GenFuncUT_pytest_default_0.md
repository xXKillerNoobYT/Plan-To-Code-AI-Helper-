````markdown
# You need to write unit tests with pytest for the function `<<<FunctionName>>>` in a new test file (<<<SpecFileName>>>).
# Guidelines:
- Do not include any explanation.
- The test file MUST NOT have any Python syntax errors or type errors.
- MUST NOT mock the functions, classes and values in the same file/module.
- MUST NOT redefine or overwrite the functions/classes that need to be tested. Only mock dependencies used inside them.
- Mock all the dependent functions and classes from other modules using `mocker.patch()` or `monkeypatch`.
- Use `freezegun` or `mocker.patch()` to mock datetime/time when necessary!!!
- The test cases MUST be meaningful and cover the main logic of the function.
- DO NOT add placeholder imports!!!
- DO NOT use `datetime.now()` or `time.time()` directly in test code - use fixtures or mocks.
- MUST RETURN THE TEST CODE IN THE FORMAT OF ```python\n<Test code>\n```.
- MUST NOT keep unused data or variables in the test code.
- Use pytest fixtures for setup and teardown.
- Use `assert` statements for assertions (not `self.assertEqual` or similar).
- Use parametrize decorator `@pytest.mark.parametrize` for data-driven tests.
- Use `pytest.raises()` for exception testing.
- Use `async`/`await` with `pytest.mark.asyncio` for async function testing.
- Mock external APIs, file I/O, database calls, and network requests.
- Use descriptive test function names following pattern: `test_<function_name>_<scenario>_<expected_result>`

# Source code:
```python
<<<SourceCode>>>
```
````