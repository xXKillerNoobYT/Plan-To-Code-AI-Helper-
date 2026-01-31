# COE View Container Migration Breakdown

**Original Task**: Move "COE Task Queue" and "Completed task history" from Explorer to a custom Activity Bar container with sub-tabs.
**Estimated**: ~45-60 minutes (too large for one session)
**Split Into**: 3 atomic tasks (~15-20 minutes each)

## Atomic Tasks (~20 min each)

### Task 1: Add COE ViewContainer in package.json
- **Time**: ~15 min
- **File**: package.json
- **Concern**: Register new Activity Bar container and move views under it.
- **Changes**:
  - Add `contributes.viewsContainers.activitybar` with `id: "coe-views"`, title, and icon.
  - Move `coe-task-queue` and `coe-completed-history` views under `contributes.views["coe-views"]`.
  - Remove those views from Explorer container.
- **Acceptance Criteria**:
  - New "COE" Activity Bar container appears.
  - Task Queue + Completed History are listed as sub-tabs under COE container.
  - Explorer no longer lists those two views.

### Task 2: Register TreeDataProviders in extension.ts
- **Time**: ~20 min
- **File**: src/extension.ts
- **Concern**: Ensure view IDs match new container and refresh hooks remain intact.
- **Changes**:
  - Confirm `registerTreeDataProvider` uses new view IDs (`coe-task-queue`, `coe-completed-history`).
  - Ensure refresh events still trigger (`onDidChangeTreeData`).
- **Acceptance Criteria**:
  - Providers load without error in COE container.
  - View updates on task changes still refresh correctly.

### Task 3: Add icon asset + basic view placement test
- **Time**: ~20 min
- **Files**: media/coe-icon.svg, tests/**
- **Concern**: Provide Activity Bar icon and a minimal placement test.
- **Changes**:
  - Add `media/coe-icon.svg` (simple SVG).
  - Add Jest test to verify views are declared in `coe-views` container.
- **Acceptance Criteria**:
  - Extension loads with icon (no manifest errors).
  - Test passes confirming view container placement.

## Execution Order
1. Task 1 → Test manifest load
2. Task 2 → Verify view refresh works
3. Task 3 → Add icon + test

## Notes
- Keep total changes under 200 lines.
- No new dependencies.
- Use existing TreeDataProvider patterns.
