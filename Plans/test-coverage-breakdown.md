# Test Coverage Improvement Breakdown

**Original Request**: Increase branch coverage to 80%+, test 54 untested files, optimize test performance, add integration tests, ensure tests pass.
**Estimated**: 2–6+ hours (too large for single session)
**Split Into**: Atomic tasks (~20 min each)

## Atomic Tasks (~20 min each)

### Task 1: Fix failing branch coverage tests (compilation errors)
- **Time**: ~20 min
- **Files**: `tests/services.branchCoverage.test.ts`, `tests/orchestrator.branchCoverage.test.ts`
- **Concern**: Resolve TypeScript errors (private constructor, invalid enums, wrong method name)
- **Test**: `npm run test:once -- tests/services.branchCoverage.test.ts tests/orchestrator.branchCoverage.test.ts`
- **Acceptance**: Both suites compile and run (no TS errors)

### Task 2: Add targeted branch tests for bossRouter
- **Time**: ~20 min
- **Files**: `tests/services/bossRouter.branchCoverage.test.ts` (new)
- **Concern**: Cover conditional branches in `src/services/bossRouter.ts` (lines 66-154)
- **Test**: `npm run test:once -- tests/services/bossRouter.branchCoverage.test.ts`
- **Acceptance**: Branch coverage increases for bossRouter; no failures

### Task 3: Add targeted branch tests for programmingOrchestrator (part 1)
- **Time**: ~20 min
- **Files**: `tests/orchestrator/programmingOrchestrator.branchCoverage.part1.test.ts` (new)
- **Concern**: Cover early branches in `src/orchestrator/programmingOrchestrator.ts` (top-level guards)
- **Test**: `npm run test:once -- tests/orchestrator/programmingOrchestrator.branchCoverage.part1.test.ts`
- **Acceptance**: Branch coverage increases; tests pass

### Task 4: Add targeted branch tests for programmingOrchestrator (part 2)
- **Time**: ~20 min
- **Files**: `tests/orchestrator/programmingOrchestrator.branchCoverage.part2.test.ts` (new)
- **Concern**: Cover deeper branches in `src/orchestrator/programmingOrchestrator.ts` (queue/status helpers)
- **Test**: `npm run test:once -- tests/orchestrator/programmingOrchestrator.branchCoverage.part2.test.ts`
- **Acceptance**: Branch coverage increases; tests pass

### Task 5: Add tests for CoeTaskTreeProvider
- **Time**: ~20 min
- **Files**: `tests/tree/CoeTaskTreeProvider.test.ts`
- **Concern**: Cover tree provider branches in `src/tree/CoeTaskTreeProvider.ts`
- **Test**: `npm run test:once -- tests/tree/CoeTaskTreeProvider.test.ts`
- **Acceptance**: File has >=75% statements/branches

### Task 6: Add tests for completedTasksTreeProvider
- **Time**: ~20 min
- **Files**: `tests/ui/completedTasksTreeProvider.test.ts`
- **Concern**: Cover tree UI branches in `src/ui/completedTasksTreeProvider.ts`
- **Test**: `npm run test:once -- tests/ui/completedTasksTreeProvider.test.ts`
- **Acceptance**: File has >=75% statements/branches

### Task 7: Add tests for github/api.ts branches
- **Time**: ~20 min
- **Files**: `tests/github/api.branchCoverage.test.ts`
- **Concern**: Cover branches in `src/github/api.ts` (lines 68-103)
- **Test**: `npm run test:once -- tests/github/api.branchCoverage.test.ts`
- **Acceptance**: Branch coverage improves for api.ts

### Task 8: Add tests for utils/streamingLLM branches
- **Time**: ~20 min
- **Files**: `tests/utils/streamingLLM.branchCoverage.test.ts`
- **Concern**: Cover branches around timeouts/edge cases in `src/utils/streamingLLM.ts`
- **Test**: `npm run test:once -- tests/utils/streamingLLM.branchCoverage.test.ts`
- **Acceptance**: Branch coverage improves for streamingLLM.ts

### Task 9: Add integration test for MCP workflow
- **Time**: ~20 min
- **Files**: `tests/integration/mcpWorkflow.test.ts`
- **Concern**: End-to-end flow of `getNextTask` → `reportTaskStatus`
- **Test**: `npm run test:once -- tests/integration/mcpWorkflow.test.ts`
- **Acceptance**: Integration test passes consistently

### Task 10: Performance optimization pass for tests
- **Time**: ~20 min
- **Files**: Targeted test files with expensive setup
- **Concern**: Remove redundant setup, share fixtures, reduce per-test overhead
- **Test**: `npm run test:once`
- **Acceptance**: Suite runtime reduced (baseline recorded)

### Task 11: Run full suite and confirm 80% thresholds
- **Time**: ~20 min
- **Files**: None
- **Concern**: Validate coverage thresholds for statements/branches/functions/lines
- **Test**: `npm run test:once -- --coverage`
- **Acceptance**: Jest global coverage thresholds pass

## Execution Order
1. Task 1 → fix failing tests
2. Task 2 → bossRouter branches
3. Task 3 → orchestrator branches (part 1)
4. Task 4 → orchestrator branches (part 2)
5. Task 5 → CoeTaskTreeProvider tests
6. Task 6 → completedTasksTreeProvider tests
7. Task 7 → github/api.ts branches
8. Task 8 → streamingLLM branches
9. Task 9 → integration test
10. Task 10 → performance optimization
11. Task 11 → full suite + coverage gates
