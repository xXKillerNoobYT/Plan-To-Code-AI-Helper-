# Jest Failures Breakdown (2026-01-29)

**Original Request**: Fix failing Jest tests and global coverage threshold.
**Estimated Effort**: ~60-90 minutes total (too large for one atomic task).
**Split Into**: 4 atomic tasks (~15-20 min each).

## Atomic Tasks

### Task 1: Fix activate.web.spec TicketDatabase initialization expectation
- **Time**: ~20 min
- **File**: `tests/extension.spec/activate.web.spec.ts`
- **Concern**: Ensure mock TicketDatabase.initialize is invoked and test assertion aligns with activation flow.
- **Acceptance Criteria**:
  - Test `activate > should initialize the TicketDatabase` passes.
  - No other tests changed.

### Task 2: Fix GitHubAPI.setContext.web.spec TypeScript mock typing
- **Time**: ~20 min
- **File**: `tests/api.spec/GitHubAPI.setContext.web.spec.ts`
- **Concern**: Provide complete `ExtensionContext` mock with required `Memento.keys` and `GlobalEnvironmentVariableCollection.getScoped` typings.
- **Acceptance Criteria**:
  - Test file compiles (no TS2741/TS2322 errors).
  - No runtime logic changes.

### Task 3: Fix TicketDatabase.getStats.web.spec typing for mocked tickets
- **Time**: ~15 min
- **File**: `tests/ticketsDb.spec/TicketDatabase.getStats.web.spec.ts`
- **Concern**: Type-safe mock for `getAllTickets` return value.
- **Acceptance Criteria**:
  - Test file compiles (no TS2345 errors).
  - Tests still assert stats correctly.

### Task 4: Re-check coverage threshold after test fixes
- **Time**: ~15 min
- **Files**: `jest.config.js` or test additions if needed
- **Concern**: Ensure branch coverage ≥ 60% once failures are resolved.
- **Acceptance Criteria**:
  - Jest coverage threshold passes without reducing required threshold.

## Execution Order
1. Task 1 → Verify test passes
2. Task 2 → Verify TypeScript compile errors cleared
3. Task 3 → Verify TypeScript compile errors cleared
4. Task 4 → Run full test suite/coverage to confirm threshold
