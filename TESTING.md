# Testing Guide

**Last Updated**: January 24, 2026  
**Coverage Target**: ≥80%  
**Test Framework**: pytest

---

## Quick Start

### Run All Tests
```bash
# Run all tests with coverage
pytest

# Run tests in parallel (faster)
pytest -n auto

# Run with detailed output
pytest -v

# Run specific test file
pytest test_unified_agent.py
```

### Run Specific Test Categories
```bash
# Unit tests only
pytest -m unit

# Integration tests only
pytest -m integration

# Performance tests (excluding slow tests)
pytest test_performance.py -m "not slow"

# Edge case tests
pytest test_edge_cases.py
```

### Coverage Reports
```bash
# Generate coverage report
pytest --cov=. --cov-report=html

# View HTML coverage report
# Opens in browser: htmlcov/index.html

# Generate terminal coverage report
pytest --cov=. --cov-report=term-missing

# XML coverage (for CI/CD)
pytest --cov=. --cov-report=xml
```

---

## Test Structure

### Test Files

| File | Purpose | Test Count |
|------|---------|------------|
| `test_unified_agent.py` | Core functionality tests | 15 |
| `test_edge_cases.py` | Boundary conditions & edge cases | 30+ |
| `test_performance.py` | Performance benchmarks | 10+ |

### Test Markers

Tests are organized using pytest markers:

```python
@pytest.mark.unit          # Unit tests
@pytest.mark.integration   # Integration tests
@pytest.mark.e2e          # End-to-end tests
@pytest.mark.performance  # Performance tests
@pytest.mark.slow         # Tests taking >5 seconds
@pytest.mark.vagueness    # Vagueness detection tests
@pytest.mark.workflow     # Workflow tests
@pytest.mark.background   # Background worker tests
```

---

## Test Coverage

### Current Coverage Status

**Overall Coverage**: To be measured  
**Target Coverage**: ≥80%

### Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| SmartPlan | ✅ Comprehensive | Unit + Edge |
| ZenTasks | ✅ Comprehensive | Unit + Edge |
| Tasksync | ✅ Comprehensive | Unit + Edge |
| Context | ✅ Good | Unit + Edge |
| Roles (5) | ✅ Good | Unit + Integration |
| Overseer | ✅ Good | Integration + E2E |
| BackgroundWorker | ✅ Good | Unit + Integration |

---

## Test Types

### 1. Unit Tests
Test individual functions and methods in isolation.

**Location**: `test_unified_agent.py`

**Examples**:
- `test_smart_plan_vagueness_detection()` - Test vagueness detection logic
- `test_zen_tasks_workflow()` - Test task management
- `test_context_management()` - Test context data handling

**Coverage Target**: ≥85%

### 2. Integration Tests
Test component interactions and workflows.

**Location**: `test_unified_agent.py`

**Examples**:
- `test_role_execution()` - Test all roles execute correctly
- `test_overseer_workflow()` - Test complete workflow integration
- `test_tasksync_feedback()` - Test feedback system integration

**Coverage Target**: ≥70%

### 3. Edge Case Tests
Test boundary conditions and error scenarios.

**Location**: `test_edge_cases.py`

**Examples**:
- Empty inputs
- Very large inputs
- Invalid inputs
- Unicode handling
- Circular dependencies
- Concurrent access

**Coverage Target**: Major edge cases covered

### 4. Performance Tests
Benchmark performance and scalability.

**Location**: `test_performance.py`

**Examples**:
- Execution time benchmarks
- Memory usage tests
- Scalability tests
- Stress tests

**Performance Targets**:
- Workflow execution: <5 seconds
- Vagueness detection (1000 lines): <1 second
- Task creation (1000 tasks): <0.1 second

### 5. End-to-End Tests
Test complete user workflows.

**Location**: `test_unified_agent.py`

**Examples**:
- `test_overseer_workflow()` - Complete workflow from requirements to execution
- `test_vague_requirements_handling()` - Vague requirements workflow

---

## Writing Tests

### Test Template

```python
import pytest
from unified_agent import Overseer, RoleType

class TestMyFeature:
    """Test suite for MyFeature"""
    
    def test_basic_functionality(self):
        """Test basic feature behavior"""
        # Arrange
        overseer = Overseer("Test", "Requirements")
        
        # Act
        result = overseer.execute_workflow()
        
        # Assert
        assert result["workflow_status"]["completed"] == 5
    
    def test_edge_case(self):
        """Test edge case handling"""
        # Test implementation
        pass
    
    @pytest.mark.slow
    def test_performance(self):
        """Test performance characteristics"""
        # Performance test implementation
        pass
```

### Best Practices

1. **One Assertion Per Test** (where possible)
   - Makes failures easier to diagnose
   - Clearer test intent

2. **Use Descriptive Names**
   - `test_vagueness_detection_with_empty_text()` ✅
   - `test_1()` ❌

3. **Arrange-Act-Assert Pattern**
   ```python
   # Arrange - Set up test data
   overseer = Overseer("Test", "Requirements")
   
   # Act - Execute the code being tested
   result = overseer.execute_workflow()
   
   # Assert - Verify expected outcome
   assert result["workflow_status"]["completed"] == 5
   ```

4. **Use Markers**
   ```python
   @pytest.mark.unit
   @pytest.mark.integration
   @pytest.mark.slow
   ```

5. **Test Both Success and Failure**
   ```python
   def test_success_case(self):
       result = function_under_test(valid_input)
       assert result == expected
   
   def test_failure_case(self):
       with pytest.raises(ValueError):
           function_under_test(invalid_input)
   ```

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

**Workflow File**: `.github/workflows/tests.yml`

### Test Matrix
- **OS**: Ubuntu, Windows, macOS
- **Python**: 3.9, 3.10, 3.11, 3.12

### Quality Gates

All tests must pass before PR merge:
- ✅ All test suites pass
- ✅ Coverage ≥80%
- ✅ No critical linting errors
- ✅ Performance tests pass

---

## Debugging Failed Tests

### 1. Run Failed Test in Verbose Mode
```bash
pytest test_file.py::test_name -v
```

### 2. Show Local Variables
```bash
pytest test_file.py::test_name -l
```

### 3. Drop into Debugger on Failure
```bash
pytest test_file.py::test_name --pdb
```

### 4. Print Output (remove capture)
```bash
pytest test_file.py::test_name -s
```

### 5. Run Only Failed Tests
```bash
pytest --lf  # last failed
pytest --ff  # failed first
```

---

## Common Issues & Solutions

### Issue: Tests Pass Locally But Fail in CI

**Solution**:
- Check Python version differences
- Verify all dependencies installed
- Check for platform-specific code
- Review environment variables

### Issue: Flaky Tests

**Solution**:
- Add timeouts: `@pytest.mark.timeout(10)`
- Fix race conditions
- Avoid time-dependent assertions
- Use retry decorator for external services

### Issue: Slow Tests

**Solution**:
- Mark slow tests: `@pytest.mark.slow`
- Use parallel execution: `pytest -n auto`
- Optimize test setup/teardown
- Use fixtures for shared setup

### Issue: Low Coverage

**Solution**:
- Run: `pytest --cov=. --cov-report=html`
- Open: `htmlcov/index.html`
- Identify uncovered lines
- Add targeted tests

---

## Test Configuration Files

### pytest.ini
Main pytest configuration:
- Test discovery patterns
- Default options
- Coverage settings
- Test markers

### .coveragerc
Coverage.py configuration:
- Source directories
- Omit patterns
- Report settings
- Exclusion rules

---

## Continuous Improvement

### Adding New Tests

When adding new features:
1. Write tests **before** implementation (TDD)
2. Ensure ≥80% coverage for new code
3. Add edge case tests
4. Consider performance impact

### Maintaining Tests

Regular maintenance tasks:
- Remove obsolete tests
- Update tests when requirements change
- Refactor duplicate test code
- Keep test documentation current

### Test Debt

Track test debt:
- Missing test coverage
- Skipped tests (`@pytest.mark.skip`)
- Known flaky tests
- Performance regressions

**Location**: Create issues with label `test-debt`

---

## Resources

### Documentation
- [pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [Python Testing Best Practices](https://docs.python-guide.org/writing/tests/)

### Tools
- **pytest**: Test framework
- **pytest-cov**: Coverage plugin
- **pytest-timeout**: Timeout plugin
- **pytest-xdist**: Parallel execution

### Project Documentation
- `Plans/QUICK-REFERENCE-CARD.md` - Testing quick reference
- `Status/testing.md` - Current testing status
- `.github/copilot-instructions.md` - Testing guidelines

---

## Contact & Support

For testing questions or issues:
1. Check this guide
2. Review existing test examples
3. Create issue with label `testing`
4. Ask in team discussion

---

**Remember**: Tests are documentation. Write tests that explain how the code should behave.
