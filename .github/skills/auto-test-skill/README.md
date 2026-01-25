# Auto Test Generator Skill

**AI-powered test generation for COE TypeScript code** 🤖🧪

## Quick Start

### Option 1: Use Copilot Directly

Just ask Copilot:
```
"Generate tests for src/mcpServer/tools.ts"
```

Copilot will automatically follow the instructions in `SKILL.md` to:
1. Analyze the code
2. Suggest test scenarios
3. Generate a comprehensive test file
4. Run tests and measure coverage

### Option 2: Use the Script

```bash
# Generate tests for a single file
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/mcpServer/tools.ts

# Generate tests for a directory
npx ts-node .github/skills/auto-test-skill/generate-tests.ts src/agents/

# Interactive mode
npx ts-node .github/skills/auto-test-skill/generate-tests.ts --interactive
```

## What's Inside

- **`SKILL.md`** - Comprehensive guide for Copilot on how to generate tests
  - 500+ lines of detailed instructions
  - Test patterns for backend (MCP, agents, task queue)
  - Test patterns for frontend (React components, UI panels)
  - MCP integration examples
  - Troubleshooting guide

- **`generate-tests.ts`** - Optional TypeScript script for automated test generation
  - Analyzes source files and extracts functions
  - Generates test scenarios (critical, edge cases, errors)
  - Creates Jest test files with mocks
  - Handles VS Code extension testing

- **`README.md`** - This file!

## Features

✅ **AI-Powered Analysis** - Understands your code and suggests relevant test cases  
✅ **Comprehensive Coverage** - Generates critical, edge case, and error tests  
✅ **Smart Mocking** - Automatically creates mocks for VS Code, file system, network  
✅ **MCP Integration** - Uses `askQuestion` tool when requirements are unclear  
✅ **Beginner Friendly** - Generated tests include comments explaining what they do  
✅ **Quality Gates** - Enforces ≥75% coverage before task completion  

## Examples

### Backend Testing (MCP Server)

```typescript
describe('getNextTask MCP Tool', () => {
  it('should return P1 task when queue not empty', async () => {
    const queue = new TaskQueue();
    queue.addTask({ id: '1', priority: 'P1', status: 'ready' });
    
    const result = await getNextTask('plan-1');
    
    expect(result.task.id).toBe('1');
  });
});
```

### Frontend Testing (React Components)

```typescript
import { render, screen } from '@testing-library/react';

describe('VerificationPanel', () => {
  it('should render task details', () => {
    const task = { id: 'TASK-001', title: 'Test' };
    render(<VerificationPanel task={task} />);
    
    expect(screen.getByText('TASK-001')).toBeInTheDocument();
  });
});
```

## When to Use

- ✅ Just implemented a new feature
- ✅ Coverage is below 75%
- ✅ Refactored code needs updated tests
- ✅ Onboarding legacy code

## Quality Gates

Before marking task complete:

| Gate | Requirement |
|------|-------------|
| Tests Pass | All tests ✅ |
| Coverage | ≥75% for new code |
| No Warnings | Zero ESLint warnings (P1) |
| Documentation | Tests have comments |

## Resources

- **Full Guide**: See `SKILL.md` for comprehensive instructions
- **Jest Docs**: https://jestjs.io/docs/getting-started
- **Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Example Tests**: See `tests/example.test.ts` in project root

## Troubleshooting

**"Cannot find module 'vscode'"**  
→ Add VS Code mock at top of test file (see SKILL.md)

**"Coverage below threshold"**  
→ Run `npm run test:coverage` and check `coverage/index.html`

**"Test timeout"**  
→ Increase timeout: `it('test', async () => {...}, 10000);`

## Integration with COE

This skill is part of the COE testing infrastructure:
- Works with Jest framework (configured in `jest.config.js`)
- Generates tests in `tests/` folder
- Integrates with MCP server via `askQuestion` tool
- Follows modular execution philosophy (one thing at a time)
- Enforces P1 quality standards (90% coverage for critical tasks)

---

**Happy Testing! 🎉**

For questions, use MCP's `askQuestion` tool or check the comprehensive guide in `SKILL.md`.
