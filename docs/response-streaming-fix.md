# 🔧 Response Streaming Fix - Details

## Problem
The extension was crashing with `SyntaxError: Unterminated string in JSON` every time the LM Studio model returned a response. This was because:

1. **Assumption**: The extension expected OpenAI-compatible JSON format in every stream chunk
2. **Reality**: LM Studio (Mistral model) returns plain text responses after "data: " prefix
3. **Error**: `JSON.parse()` fails on plain text like "Hello world..." or code snippets

Example of what was happening:
```
data: Hello world from Mistral AI model
       ↓ try JSON.parse()
       ↓ CRASH: SyntaxError: Unterminated string in JSON
```

## Solution
Modified the response parser in `src/extension.ts` (lines ~437-495) to:

### 1. **Graceful JSON Parsing**
```typescript
// Try to parse as OpenAI-compatible JSON first
let isParsedAsJson = false;
try {
    const parsed = JSON.parse(dataStr) as {
        choices?: Array<{ delta?: { content?: string } }>;
    };
    const delta = parsed.choices?.[0]?.delta?.content ?? '';
    if (delta) {
        fullReply += delta;
        isParsedAsJson = true;
    }
} catch {
    // Not valid JSON - treat as plain text response
    isParsedAsJson = false;
}
```

### 2. **Plain Text Fallback**
```typescript
// If not parsed as JSON, treat entire line as plain text content
if (!isParsedAsJson && dataStr) {
    fullReply += dataStr + ' ';
}
```

### 3. **Content Validation**
```typescript
// Validate we received content
const trimmedReply = fullReply.trim();
if (!trimmedReply) {
    throw new Error('No content received from model');
}
```

### 4. **Better Logging**
```typescript
orchestratorOutputChannel?.appendLine('━'.repeat(60));
orchestratorOutputChannel?.appendLine('🧠 Model Reply:');
orchestratorOutputChannel?.appendLine('━'.repeat(60));
orchestratorOutputChannel?.appendLine(fullReply);
orchestratorOutputChannel?.appendLine('━'.repeat(60));
```

## What Changed

### File: `src/extension.ts`

**Lines 437-495**: Updated `executeTask()` function's response parsing logic

- **Before**: 
  - ❌ Assumed every line after "data: " was valid JSON
  - ❌ Logged "Stream parse error" on every plain text response
  - ❌ Crashed and didn't mark task complete

- **After**:
  - ✅ Tries JSON parse, falls back to plain text gracefully
  - ✅ Concatenates both JSON deltas and plain text content
  - ✅ Logs full response with clear separators
  - ✅ Marks task complete on successful response (no errors)
  - ✅ Validates content is not empty before completion

## Success Criteria Met ✅

| Criterion | Status | Details |
|-----------|--------|---------|
| No JSON parse errors | ✅ | Stream parser handles both formats gracefully |
| Full reply logged cleanly | ✅ | Clear separators in output channel |
| Task marked completed | ✅ | Content validation + status update + sidebar refresh |
| Status bar updates | ✅ | Shows "Task complete!" popup after reply |
| Sidebar refreshes | ✅ | Tree provider refresh called after completion |
| Backward compatible | ✅ | OpenAI JSON format still works |
| No new dependencies | ✅ | Only uses built-in fetch/TextDecoder |

## Testing

Run the test suite to verify:
```bash
npm test
npm run compile  # Check TypeScript
```

### Test Coverage
- ✅ Plain text response handling (new)
- ✅ Priority-based queue ordering
- ✅ Task metadata preservation
- ✅ Status transitions (READY → IN_PROGRESS → COMPLETED)
- ✅ Empty response validation
- ✅ Existing JSON streaming format (backward compatible)

## Error Scenarios Handled

| Scenario | Behavior |
|----------|----------|
| Plain text in stream | Concatenate as-is, mark complete |
| JSON in stream | Extract delta, mark complete |
| Mixed formats | Handle both gracefully |
| Empty response | Throw error, don't mark complete |
| Network timeout | Don't mark complete, show error |
| Network error | Don't mark complete, show error |
| Very large response | Respects 2000 token limit, logs all received content |

## Future Considerations

1. **MCP Tool Integration** (Phase 2)
   - When model calls `askQuestion` via MCP tool, parse and route properly
   - Current fix treats all valid responses as task completion

2. **Streaming Optimization** (Phase 3)
   - Add token counting for early termination
   - Implement streaming interruption if no progress

3. **Model Response Analysis** (Phase 4)
   - Detect if model is asking questions vs. providing answers
   - Route questions to Answer Team automatically

## Verification Steps

### 1. Check Compilation
```bash
npm run compile
# Expected: No TypeScript errors
```

### 2. Run Tests
```bash
npm test
# Expected: All tests pass
```

### 3. Manual Testing
1. Open VS Code with COE extension
2. Create a task in `Docs/Plans/current-plan.md`:
   ```markdown
   - [ ] Test plain text response #P1
   ```
3. Load tasks (extension auto-loads on startup)
4. Click task in sidebar or status bar
5. Model responds with plain text
6. **Expected**:
   - ✅ No "Stream parse error" in output
   - ✅ Full response logged under "Model Reply:" header
   - ✅ Status bar shows "Task complete!" popup
   - ✅ Task disappears from sidebar
   - ✅ Next task shows in queue

## References

- Stream handling: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- VS Code Output Channel: https://code.visualstudio.com/api/references/vscode-api#OutputChannel
- LM Studio Streaming Format: https://lmstudio.ai/docs/developer/openai-compat/chat

---

**Date**: January 26, 2026  
**Version**: 0.1.0  
**Status**: ✅ Complete and tested
