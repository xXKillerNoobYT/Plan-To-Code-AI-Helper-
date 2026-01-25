# 🧪 Tests Folder (For Noobs!)

**Welcome to the testing zone!** 🎉

This folder contains **unit tests** for the COE extension. Unit tests check if individual pieces of code (functions, classes) work correctly in isolation.

---

## 📂 What Goes Here?

**✅ DO put here**:
- Unit tests for core functionality (`.test.ts` or `.spec.ts` files)
- Tests for utility functions, helpers, services
- Mocks and test fixtures
- Shared test setup files

**❌ DON'T put here**:
- Planning documents (those go in `Plans/`)
- Status updates (those go in `Status/`)
- VS Code extension E2E tests (those go in `src/test/`)
- Source code (that goes in `src/`)

---

## 🚀 Quick Start

### Run Tests

```bash
# Run all tests once
npm run test:unit

# Run tests and re-run automatically when files change (useful during development!)
npm run test:watch

# Run tests with coverage report (shows what % of code is tested)
npm run test:coverage
```

### Create a New Test

1. **Create a file** ending in `.test.ts` or `.spec.ts`:
   ```
   tests/myFeature.test.ts
   ```

2. **Write your test** (copy structure from `example.test.ts`):
   ```typescript
   describe('My Feature', () => {
     it('should do something', () => {
       expect(true).toBe(true);
     });
   });
   ```

3. **Run it**:
   ```bash
   npm run test:unit
   ```

4. **See it pass** ✅

---

## 📝 Test Structure

### Anatomy of a Test

```typescript
// 1️⃣ Group related tests together
describe('Calculator', () => {
  
  // 2️⃣ Define a single test case
  it('should add numbers correctly', () => {
    
    // 3️⃣ Arrange: Set up test data
    const a = 2;
    const b = 3;
    
    // 4️⃣ Act: Run the code you're testing
    const result = a + b;
    
    // 5️⃣ Assert: Check if it worked
    expect(result).toBe(5);  // ✅ PASS if true, ❌ FAIL if false
  });
});
```

### Common Patterns

**Testing a function**:
```typescript
import { myFunction } from '../src/utils';

describe('myFunction', () => {
  it('should return correct value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

**Testing with mocks** (fake data for testing):
```typescript
it('should call console.log', () => {
  // Create a spy to watch console.log
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  
  // Run code that calls console.log
  myFunction();
  
  // Check if console.log was called
  expect(spy).toHaveBeenCalled();
  
  // Clean up
  spy.mockRestore();
});
```

---

## 🎯 Test-Driven Development (TDD) - The Pro Way!

**What is TDD?** Writing tests BEFORE writing code. Sounds backward, but it works!

### The TDD Cycle (Red-Green-Refactor)

1. **🔴 Red**: Write a failing test
   ```typescript
   it('should multiply numbers', () => {
     expect(multiply(2, 3)).toBe(6);  // ❌ FAIL - function doesn't exist yet
   });
   ```

2. **🟢 Green**: Write just enough code to make it pass
   ```typescript
   function multiply(a: number, b: number) {
     return a * b;  // ✅ PASS - test now passes
   }
   ```

3. **♻️ Refactor**: Improve the code (keep tests passing)
   ```typescript
   const multiply = (a: number, b: number): number => a * b;  // ✅ Still passing, but cleaner
   ```

4. **Repeat** for next feature!

---

## 📊 Coverage Reports

**What is coverage?** The % of your code that's tested.

```bash
npm run test:coverage
```

This creates:
- **`coverage/index.html`** - Open in browser to see visual report (shows which lines are tested/untested)
- **`coverage/coverage-final.json`** - Machine-readable coverage data

**Coverage Targets** (from `jest.config.js`):
- ≥70% branches covered (if/else paths)
- ≥70% functions covered
- ≥70% lines covered
- ≥70% statements covered

**What's good coverage?**
- 80-100% = Excellent! 🌟
- 70-79% = Good ✅
- 50-69% = Needs improvement ⚠️
- <50% = Risky ❌

---

## 🎓 Example Files

### `example.test.ts`
**What it does**: Comprehensive testing examples for beginners
- Tests the extension's activate/deactivate functions
- Shows basic matchers (toBe, toContain, toHaveLength)
- Includes Jest cheat sheet with 20+ common matchers
- Explains mocking and spying

**Start here** if you're new to testing!

---

## 🆘 Common Issues

### "Cannot find module '../src/myFile'"
**Problem**: Import path is wrong  
**Solution**: Check the relative path (use `../src/` from tests folder)

### "Test fails even though code looks right"
**Problem**: Async code not awaited  
**Solution**: Use `async/await`:
```typescript
it('should fetch data', async () => {
  const result = await fetchData();  // Don't forget 'await'!
  expect(result).toBeTruthy();
});
```

### "Coverage is below threshold"
**Problem**: Not enough tests  
**Solution**: 
1. Run `npm run test:coverage`
2. Open `coverage/index.html` in browser
3. Look for red/yellow lines (untested code)
4. Write tests for those lines

### "Jest isn't finding my tests"
**Problem**: File name doesn't match pattern  
**Solution**: Name files `*.test.ts` or `*.spec.ts` or put in `__tests__/` folder

---

## 📚 Resources

- **Jest Docs**: https://jestjs.io/docs/getting-started
- **TypeScript + Jest**: https://kulshekhar.github.io/ts-jest/
- **Testing Best Practices**: https://github.com/goldbergyoni/javascript-testing-best-practices
- **Example Tests**: `example.test.ts` in this folder

---

## 🤔 Questions?

**"Why do we write tests?"**  
Tests catch bugs before users do! They also document how your code should work.

**"When should I write tests?"**  
Always! Tests should be written alongside code (or before, with TDD).

**"What should I test?"**  
- ✅ Public APIs and functions
- ✅ Edge cases (empty arrays, null values, large numbers)
- ✅ Error handling (what happens when things go wrong?)
- ❌ Don't test libraries/frameworks (they're already tested)

**"How do I know what to test?"**  
Ask: "What could go wrong?" Then write a test for it!

---

**Happy Testing! 🎉**

Remember: **Good tests = Good code = Happy users** ✨
