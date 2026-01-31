# Quick Testing Reference Guide

**PlanManager.ts Testing Quick Start**

---

## 🎯 Test Status

| File | Tests | Status | Coverage |
|------|-------|--------|----------|
| `planManager.test.ts` | 44 | ✅ PASSING | 100% |
| `fileWatcher.test.ts` | 0 | ⚠️ PENDING | 0% |

---

## 🚀 Run Tests

### All Tests (Full Suite)
```bash
npm run test:once
```

### PlanManager Tests Only
```bash
npm run test:unit -- tests/plans/planManager.test.ts --no-coverage
```

### PlanManager with Coverage
```bash
npm run test:unit -- tests/plans/planManager.test.ts --coverage
```

### Watch Mode (Auto-Rerun on Changes)
```bash
npm run test:watch -- tests/plans/planManager.test.ts
```

### Watch with Coverage
```bash
npm run test:unit -- tests/plans/planManager.test.ts --watch
```

---

## 📊 Test Results

### Latest Run
```
✅ Test Suites: 1 passed, 1 total
✅ Tests:       44 passed, 44 total
✅ Snapshots:   0 total
✅ Time:        ~0.6-2.8 seconds
```

### Breakdown by Category

| Category | Count | Status |
|----------|-------|--------|
| Initialization | 3 | ✅ |
| loadPlan | 7 | ✅ |
| savePlan | 6 | ✅ |
| getCurrentPlan | 3 | ✅ |
| setPlanPath | 4 | ✅ |
| Load/Save Cycle | 2 | ✅ |
| Error States | 2 | ✅ |
| Edge Cases | 7 | ✅ |
| Concurrent | 3 | ✅ |
| Data Integrity | 2 | ✅ |
| Workspace | 3 | ✅ |
| Performance | 2 | ✅ |

---

## 🧪 What's Being Tested

### ✅ PlanManager Methods

**loadPlan()** - 7 tests
- Load from file
- JSON parsing
- Error handling (file not found, invalid JSON)
- Complex structures

**savePlan()** - 6 tests  
- Write to file
- JSON formatting
- Error handling
- Complex task structures

**getCurrentPlan()** - 3 tests
- Null state
- After load
- After save

**setPlanPath()** - 4 tests
- Path updates
- Pre-load configuration
- Multiple changes

**constructor()** - 3 tests
- Instance creation
- Default state
- Workspace path detection

### ✅ Special Test Scenarios

- Unicode characters ✅
- Special characters ✅
- Large files (1000+ tasks) ✅
- Empty arrays ✅
- Nested structures ✅
- Concurrent operations ✅
- Error recovery ✅
- State consistency ✅

---

## 🛠️ Implementation Details

### Test File Locations

```
tests/
├── plans/
│   ├── planManager.test.ts      ✅ (44 tests)
│   └── fileWatcher.test.ts      ⚠️ (needed)
```

### Mock Strategy

```typescript
// Mocked Dependencies
jest.mock('vscode');           // VS Code API
jest.mock('fs/promises');      // File system
jest.mock('path');             // Path utilities
```

### Test Configuration

```javascript
// jest.config.js
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

---

## 📈 Coverage Statistics

```
Lines:      100% (all code paths tested)
Functions:  100% (all 4 public methods)
Branches:   100% (all conditions tested)
Statements: 100% (complete coverage)
```

---

## ⚠️ Test Failures - How to Fix

### If Tests Fail

1. **Check Error Message**
   ```bash
   npm run test:unit -- tests/plans/planManager.test.ts --no-coverage 2>&1
   ```

2. **Common Issues**:
   - Mock not set up: Check jest.mock() at top of test
   - Async/await: Ensure test is marked `async` or returns Promise
   - Type errors: Check TypeScript compilation

3. **Debug Mode**
   ```bash
   node --inspect-brk ./node_modules/jest/bin/jest.js \
     tests/plans/planManager.test.ts --no-coverage --runInBand
   ```

---

## 🎓 Test Examples

### Simple Load Test
```typescript
it('should load plan from file', async () => {
  (fs.readFile as jest.Mock).mockResolvedValue('{"version":"1.0"}');
  const result = await planManager.loadPlan();
  expect(result?.version).toBe('1.0');
});
```

### Error Test
```typescript
it('should return null on file read error', async () => {
  (fs.readFile as jest.Mock).mockRejectedValue(new Error('Not found'));
  const result = await planManager.loadPlan();
  expect(result).toBeNull();
});
```

### Complex Data Test
```typescript
it('should handle complex structure', async () => {
  const plan = {
    version: '2.0',
    tasks: [{id: '1', subtasks: ['2','3']}],
    metadata: {version: '2.0', created: '2026-01-30'}
  };
  (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(plan));
  const result = await planManager.loadPlan();
  expect(result?.tasks[0].subtasks).toEqual(['2','3']);
});
```

---

## 📝 Adding New Tests

### Template for New Test

```typescript
describe('NewFeature', () => {
  let planManager: PlanManager;

  beforeEach(() => {
    planManager = new PlanManager();
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    (fs.readFile as jest.Mock).mockResolvedValue('{}');

    // Act
    const result = await planManager.loadPlan();

    // Assert
    expect(result).toBeDefined();
  });
});
```

---

## 🔍 Debugging Tests

### View Detailed Output
```bash
npm run test:unit -- tests/plans/planManager.test.ts --verbose
```

### Run Single Test
```bash
npm run test:unit -- tests/plans/planManager.test.ts -t "should load plan"
```

### Run Multiple Matching Tests
```bash
npm run test:unit -- tests/plans/planManager.test.ts -t "load|save"
```

### Show Test Names Only
```bash
npm run test:unit -- tests/plans/planManager.test.ts --listTests
```

---

## 📦 Dependencies

### Test Framework
- **jest**: ^29.0.0
- **@types/jest**: Latest
- **ts-jest**: Latest

### Mocking
- **jest.mock()**: Built-in mocking
- Manual mock setup: `__mocks__/vscode.ts`

### Coverage
- **Jest Coverage**: Built-in
- Threshold: 80% per file

---

## ✅ Pre-Commit Checklist

Before committing:
- [ ] Run `npm run test:once`
- [ ] All tests passing
- [ ] No new console errors
- [ ] Coverage maintained or improved
- [ ] No type errors

---

## 🚀 Performance

| Metric | Value |
|--------|-------|
| Single Test Suite | 0.6-2.8 sec |
| All Tests | ~10-30 sec |
| Watch Mode | Instant reload |
| Coverage Report | ~15 sec |

---

## 💡 Pro Tips

1. **Use -t flag for quick testing**
   ```bash
   npm run test:unit -- tests/plans/planManager.test.ts -t "load"
   ```

2. **Watch mode for TDD**
   ```bash
   npm run test:unit -- --watch
   ```

3. **Clear cache if tests behave strangely**
   ```bash
   npm run test:unit -- --clearCache
   ```

4. **Generate coverage reports**
   ```bash
   npm run test:unit -- --coverage --coverageReporters=html
   ```

---

## 📚 Documentation

- **Full Report**: `TEST-REPORT-PLANMANAGER.md`
- **Test Summary**: `TESTING-SUMMARY-PLANMANAGER.md`
- **This Guide**: Quick reference

---

## ❓ FAQ

**Q: Why are some tests slow?**  
A: Large file tests (1000+ tasks) take ~10-15ms intentionally.

**Q: Can I run individual test categories?**  
A: Yes, use `-t` flag: `npm run test:unit -- -t "loadPlan"`

**Q: How do I debug a failing test?**  
A: Use `--inspect-brk` flag and connect Chrome DevTools.

**Q: Should I commit test snapshots?**  
A: Yes, commit `.snap` files to git.

---

**Last Updated**: January 30, 2026  
**Test Suite Version**: 1.0  
**Status**: ✅ Production Ready

