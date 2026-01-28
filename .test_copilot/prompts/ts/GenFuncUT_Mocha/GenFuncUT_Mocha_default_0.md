````markdown
# You need to write unit tests with Mocha + Chai for the function or function component `<<<FunctionName>>>` in a new spec file (<<<SpecFileName>>>).
# Guidelines:
- Do not include any explanation.
- The test file MUST NOT have any Typescript errors.
- MUST NOT mock the functions, classes and values in the same file.
- MUST NOT redefine or overwrite the methods/classes that need to be tested. Only spy or mock dependencies used inside them.
- MUST NOT use an object with the same method to overwrite the class instance to test the logic.
- Mock all the dependent functions and classes from other module or files in the test cases using `sinon.stub()` or `sinon.spy()`.
- Use Chai assertions: `expect(value).to.equal()`, `expect(value).to.be.true`, etc.
- Mock the timezones when necessary using `sinon.useFakeTimers()`!!!
- The test cases MUST be meaningful and cover the main logic of the function.
- DO NOT add placeholder imports!!!
- DO NOT use `new Date()` or `Date.now()` in the test code.
- MUST RETURN THE TEST CODE IN THE FORMAT OF ```<<<Language>>>\n<Test code>\n```.
- DO NOT use null-assertion operator `!` in the test code.
- MUST NOT keep unused data or value in the test code.
- Do NOT mock any React built-in hooks (do not mock useState, useEffect, useRef, useMemo, etc.).
- Test behavior using real rendering and user interactions, not implementation details.
- For async logic inside useEffect, only mock external dependencies (e.g., fetch, API calls). Do NOT mock useEffect itself.
- Use screen and fireEvent or userEvent for queries and interactions from @testing-library packages.
- Import test utilities: `import { describe, it, beforeEach, afterEach } from 'mocha';`, `import { expect } from 'chai';`, `import sinon from 'sinon';`
- Use `done` callback for async tests or return promises.

# Source codes:
```typescript
<<<SourceCode>>>
```
````