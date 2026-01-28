# Prompt Composer Utility

## Purpose
The Prompt Composer is a utility for building multi-stage prompts by combining reusable template blocks with variable substitution.

## Architecture

### Prompt Chain Structure
```json
{
  "promptChainId": "GenFuncUT_Jest",
  "framework": "Jest",
  "language": "typescript",
  "stages": [
    {
      "stage": 0,
      "role": "user",
      "templatePath": "./GenFuncUT_default_0.md",
      "requiredVars": ["SourceCode", "FunctionName", "SpecFileName", "Language", "TestFramework"]
    },
    {
      "stage": 1,
      "role": "user",
      "templatePath": "./GenFuncUT_default_1.md",
      "requiredVars": ["SpecFileName", "FunctionName", "SourceFileName", "MockCode"]
    }
  ]
}
```

### Variable Substitution Engine

**Input:**
```typescript
interface PromptContext {
  sourceCode: string;
  functionName: string;
  specFileName: string;
  testFramework: 'Jest' | 'Vitest' | 'Mocha' | 'pytest';
  language: 'typescript' | 'javascript' | 'python';
  mockCode?: string;
  minCoverage?: number; // default: 75
}
```

**Substitution Rules:**
1. Replace `<<<VariableName>>>` with corresponding value from context
2. Apply framework-specific transformations:
   - `Jest`: Use `jest.fn(), jest.spyOn()`
   - `Vitest`: Use `vi.fn(), vi.spyOn()`
   - `Mocha`: Use `sinon.stub(), sinon.spy()`
   - `pytest`: Use `mocker.patch(), monkeypatch`
3. Validate all required variables are present before rendering
4. Throw descriptive error if required variable is missing

### Template Block System

**Reusable Blocks:**

#### Mock Code Block (TypeScript/Jest)
```typescript
// Block: mock-imports-jest
jest.mock('<<<ModulePath>>>', () => ({
  <<<NamedExports>>>
}));
```

#### Mock Code Block (Vitest)
```typescript
// Block: mock-imports-vitest
vi.mock('<<<ModulePath>>>', () => ({
  <<<NamedExports>>>
}));
```

#### Mock Code Block (Mocha/Sinon)
```typescript
// Block: mock-imports-mocha
import * as <<<ModuleName>>> from '<<<ModulePath>>>';
sinon.stub(<<<ModuleName>>>, '<<<ExportName>>>').returns(<<<MockValue>>>);
```

#### Test Structure Block (Jest/Vitest)
```typescript
// Block: test-structure-jest-vitest
describe('<<<DescribeBlockName>>>', () => {
  beforeEach(() => {
    // Setup code
  });

  afterEach(() => {
    // Cleanup code
  });

  it('<<<TestDescription>>>', () => {
    // Test implementation
  });
});
```

#### Test Structure Block (Mocha)
```typescript
// Block: test-structure-mocha
describe('<<<DescribeBlockName>>>', function() {
  beforeEach(function() {
    // Setup code
  });

  afterEach(function() {
    // Cleanup code
  });

  it('<<<TestDescription>>>', function() {
    // Test implementation
  });
});
```

#### Coverage Report Block
```markdown
// Block: coverage-report
## Coverage Results:
- **Line Coverage**: <<<LineCoverage>>>%
- **Branch Coverage**: <<<BranchCoverage>>>%
- **Function Coverage**: <<<FunctionCoverage>>>%
- **Statement Coverage**: <<<StatementCoverage>>>%

**Status**: <<<CoverageStatus>>> (Threshold: <<<MinCoverage>>>%)

<<<UncoveredLines>>>
```

### Framework Detection

**Auto-detect framework from project files:**

1. **Jest Detection**:
   - `jest.config.js` exists
   - `package.json` has `"jest"` in devDependencies
   - Test files match `*.test.js`, `*.test.ts`, `*.spec.js`, `*.spec.ts`

2. **Vitest Detection**:
   - `vitest.config.ts` exists
   - `package.json` has `"vitest"` in devDependencies
   - Test files match `*.test.js`, `*.test.ts`, `*.spec.js`, `*.spec.ts`

3. **Mocha Detection**:
   - `.mocharc.json` exists
   - `package.json` has `"mocha"` in devDependencies
   - Test files in `test/` directory or match `*.test.js`, `*.spec.js`

4. **pytest Detection** (Python):
   - `pytest.ini` exists
   - `setup.py` or `pyproject.toml` has `pytest` in dependencies
   - Test files match `test_*.py` or `*_test.py`

### Usage Examples

#### Example 1: Generate Jest Test
```typescript
const composer = new PromptComposer();

const context: PromptContext = {
  sourceCode: 'export function add(a: number, b: number) { return a + b; }',
  functionName: 'add',
  specFileName: 'add.test.ts',
  testFramework: 'Jest',
  language: 'typescript',
  mockCode: ''
};

const promptChain = composer.buildPromptChain('GenFuncUT', context);
// Returns array of rendered prompts ready to send to LLM
```

#### Example 2: Fix Test Errors with Enhanced Diagnostics
```typescript
const context = {
  sourceCode: '...',
  specFileName: 'add.test.ts',
  testFramework: 'Jest',
  language: 'typescript',
  testErrors: JSON.stringify([{
    casePath: 'add › should return sum',
    errorMessage: 'Expected 3, received 4'
  }]),
  // Enhanced diagnostics
  visualDiff: generateVisualDiff(expected, actual),
  suggestedFix: 'Check if input values are correct',
  relatedDocs: 'https://jestjs.io/docs/expect#toequalvalue'
};

const fixPrompt = composer.buildPromptChain('FixTestErrors', context);
```

#### Example 3: Generate Python/pytest Test
```typescript
const context: PromptContext = {
  sourceCode: 'def add(a: int, b: int) -> int:\n    return a + b',
  functionName: 'add',
  specFileName: 'test_add.py',
  testFramework: 'pytest',
  language: 'python',
  mockCode: ''
};

const promptChain = composer.buildPromptChain('GenFuncUT_pytest', context);
```

## Implementation Pseudocode

```typescript
class PromptComposer {
  private templateCache: Map<string, string>;
  
  constructor() {
    this.templateCache = new Map();
  }

  buildPromptChain(promptType: string, context: PromptContext): PromptStage[] {
    // 1. Load prompt chain definition
    const chainDef = this.loadChainDefinition(promptType, context.testFramework);
    
    // 2. Validate context has all required variables
    this.validateContext(chainDef, context);
    
    // 3. Render each stage with variable substitution
    return chainDef.stages.map(stage => ({
      role: stage.role,
      content: this.renderTemplate(stage.templatePath, context)
    }));
  }

  private renderTemplate(templatePath: string, context: PromptContext): string {
    // Load template (with caching)
    const template = this.loadTemplate(templatePath);
    
    // Replace all <<<Variable>>> with actual values
    let rendered = template;
    for (const [key, value] of Object.entries(context)) {
      const varName = this.toPascalCase(key);
      rendered = rendered.replace(
        new RegExp(`<<<${varName}>>>`, 'g'),
        value?.toString() || ''
      );
    }
    
    return rendered;
  }

  private validateContext(chainDef: ChainDefinition, context: PromptContext): void {
    for (const stage of chainDef.stages) {
      for (const requiredVar of stage.requiredVars) {
        const contextKey = this.toCamelCase(requiredVar);
        if (!(contextKey in context)) {
          throw new Error(
            `Missing required variable "${requiredVar}" for stage ${stage.stage}`
          );
        }
      }
    }
  }
}
```

## Extension Points

### Adding New Frameworks

1. Create new prompt folder: `prompts/ts/GenFuncUT_<Framework>/`
2. Define framework-specific guidelines in `_default_0.md`
3. Create result format templates in `_default_1.md`, `_default_2.md`
4. Update `index.json` with prompt chain
5. Add framework detection rules in Prompt Composer
6. Document framework-specific template variables

### Adding New Languages

1. Create language folder: `prompts/<language>/`
2. Port existing prompt types to new language syntax
3. Create language-specific template blocks
4. Update Prompt Composer with language detection
5. Add language to `template-variables.md`

## Benefits

✅ **DRY Principle**: Reusable template blocks reduce duplication  
✅ **Consistency**: All prompts use same variable naming convention  
✅ **Validation**: Catch missing variables before sending to LLM  
✅ **Framework Agnostic**: Easy to add new test frameworks  
✅ **Type Safety**: TypeScript interfaces ensure correct context structure  
✅ **Maintainability**: Change template once, affects all prompts  
