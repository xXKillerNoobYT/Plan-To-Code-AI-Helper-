I have a source file `<<<SourceFileName>>>` and two spec files:
- `<<<SpecFileName>>>`
- `<<<TargetFilePath>>>`
            
Merge `<<<SpecFileName>>>` into `<<<TargetFilePath>>>`, preserving all tests and resolving conflicts clearly.

Return only the merged file content within a single code block marked as ```typescript```. Do not include explanations, file paths, metadata, or additional text.

Use <<<TestFramework>>> as the test framework. Ensure the merged file is valid TypeScript and follows the framework's conventions.

# Guidelines:
1. **Imports**: 
   - Gather imports from both files.
   - Remove duplicates and sort alphabetically at the top of the merged file.

2. **Mocks/Stubs**:
   - Place mocks/stubs clearly within their relevant `describe` blocks.
   - If a mock/stub is used across multiple describes, place it globally at the top, directly below imports.

3. **Describes/Context Blocks**:
   - Merge blocks (`describe`, `context`, etc.) with identical titles by sequentially combining their contents.
   - Preserve separate blocks with unique titles without modification.
   - Maintain the original order from the target file; append new blocks from the source file afterward.

4. **Setup/Teardown Hooks** (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`, or equivalent):
   - When identical hooks exist in the same scope, sequentially combine their bodies, starting with the target file hook content, then source file hook content.
   - Explicitly retain all hook statements without deduplication.

5. **Tests (`it`, `test`, etc.)**:
   - Preserve all original test cases unchanged.
   - Keep the `@aiContributed-@{date}` tag if it exists.
   - Maintain tests within their original blocks after merging.

Do not alter or optimize test logic; preserve exact original behavior.

# Files

## <<<SpecFileName>>>
```ts
<<<Spec>>>
```

## <<<TargetFilePath>>>
```ts
<<<SpecTemplate>>>
```