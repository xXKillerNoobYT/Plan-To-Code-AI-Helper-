# UT Gen Copilot Prompts - Enhanced Structure

This directory contains all prompt templates for automated test generation across multiple languages and testing frameworks.

## Directory Structure

```
prompts/
├── templates/
│   ├── template-variables.md      # Complete variable reference
│   └── prompt-composer.md         # Multi-stage prompt builder
├── ts/                            # TypeScript/JavaScript prompts
│   ├── GenFuncUT/                 # Jest (default)
│   ├── GenFuncUT_Vitest/          # Vitest variant
│   ├── GenFuncUT_Mocha/           # Mocha + Chai variant
│   ├── GenClassMemberUT/          # Class member tests
│   ├── FixTestErrors/             # Enhanced error fixing
│   ├── FixLintErrors/             # ESLint error fixing
│   ├── FixTestDataErrors/         # Test data correction
│   ├── RepairFuncUT/              # Update tests after code changes
│   ├── RepairClassMemberUT/       # Update class tests
│   ├── UpdateSpecBlock/           # Surgical block updates
│   ├── UpdateSpecFile/            # Full file updates
│   ├── MergeUTAgent/              # Test file consolidation (now with coverage!)
│   ├── MergeUTFile/               # Two-file merge
│   ├── snapshotUTAgentForReact/   # React snapshot tests
│   ├── snapshotUTAgentForFastWC/  # FAST Web Component snapshots
│   └── FillMsnStudioDocVariants/  # MSN Studio docs
└── python/                        # Python prompts
    ├── GenFuncUT_pytest/          # pytest test generation
    ├── FixTestErrors_pytest/      # pytest error fixing
    └── RepairFuncUT_pytest/       # Update pytest tests

```

## What's New

### ✨ Multi-Framework Support
Now supporting **3 JavaScript testing frameworks**:
- **Jest** (default) - `prompts/ts/GenFuncUT/`
- **Vitest** - `prompts/ts/GenFuncUT_Vitest/`
- **Mocha + Chai** - `prompts/ts/GenFuncUT_Mocha/`

Each framework has framework-specific syntax for mocking, assertions, and test structure.

### 📊 Coverage Integration
**MergeUTAgent** now includes:
- Automatic coverage measurement after test merging
- Reports line, branch, function, and statement coverage
- Auto-generates missing test cases to meet coverage thresholds
- Configurable minimum coverage requirement (default: 75%)

### 🐍 Python Support
Full pytest support for Python projects:
- Function test generation
- Error fixing with pytest-specific diagnostics
- Test repair when source code changes

### 🔧 Template System
Reusable prompt building blocks:
- **template-variables.md** - All template variables documented
- **prompt-composer.md** - Multi-stage prompt builder architecture
- Framework-agnostic variable substitution

### 🩺 Enhanced Error Diagnostics
**FixTestErrors** now includes:
- **Visual diff** showing expected vs actual values
- **Suggested fix** with explanation
- **Root cause analysis** (error type, affected code, failure reason)
- **Related documentation** links
- **Debugging steps** checklist

## Usage Examples

### Generate Jest Test (Default)
```typescript
// Uses prompts/ts/GenFuncUT/
// Variables: SourceCode, FunctionName, SpecFileName, TestFramework=Jest
```

### Generate Vitest Test
```typescript
// Uses prompts/ts/GenFuncUT_Vitest/
// Same variables, but outputs Vitest-specific syntax (vi.fn(), vi.mock())
```

### Generate pytest Test
```python
# Uses prompts/python/GenFuncUT_pytest/
# Variables: SourceCode, FunctionName, SpecFileName, TestFramework=pytest
```

### Fix Test Errors with Enhanced Diagnostics
```typescript
// Uses prompts/ts/FixTestErrors/
// New variables: VisualDiff, SuggestedFix, ErrorType, FailureReason, RelatedDocs
```

### Merge Tests with Coverage Analysis
```typescript
// Uses prompts/ts/MergeUTAgent/
// New variable: MinCoverage (default: 75)
// Reports coverage metrics and auto-generates missing tests
```

## Configuration

Each prompt folder contains an `index.json` defining the prompt chain:

```json
{
    "default": [
        {
            "promptPath": "./PromptName_default_0.md"
        },
        {
            "role": "assistant",
            "promptPath": "./PromptName_default_1.md"
        }
    ],
    "merge": []
}
```

## Framework Detection

The extension auto-detects the testing framework from:
1. Config files (`jest.config.js`, `vitest.config.ts`, `.mocharc.json`, `pytest.ini`)
2. `package.json` dependencies
3. Test file patterns

## Variable Reference

See `templates/template-variables.md` for complete list of template variables.

**Common Variables:**
- `<<<SourceCode>>>` - Source code to test
- `<<<FunctionName>>>` - Target function name
- `<<<SpecFileName>>>` - Test file name
- `<<<TestFramework>>>` - Jest, Vitest, Mocha, pytest
- `<<<Language>>>` - typescript, javascript, python
- `<<<MockCode>>>` - Mock/stub code
- `<<<MinCoverage>>>` - Minimum coverage % (default: 75)
- `<<<VisualDiff>>>` - Visual diff for error fixing
- `<<<SuggestedFix>>>` - Recommended solution for errors

## Extension Points

### Adding New Framework
1. Create `prompts/ts/GenFuncUT_<Framework>/`
2. Write framework-specific guidelines in `_default_0.md`
3. Create result templates in `_default_1.md`, `_default_2.md`
4. Add `index.json` with prompt chain
5. Document framework-specific variables

### Adding New Language
1. Create `prompts/<language>/`
2. Port existing prompt types
3. Add language-specific guidelines
4. Update template-variables.md

## Best Practices

1. **Use Template Variables** - Always use `<<<>>>` syntax for substitution
2. **Multi-Stage Prompts** - Chain prompts for complex workflows
3. **Framework Agnostic** - Write prompts that work across frameworks when possible
4. **Validate Context** - Ensure all required variables are present before rendering
5. **Document Changes** - Update template-variables.md when adding new variables

## Testing Prompt Changes

After modifying prompts:
1. Test with each supported framework
2. Verify variable substitution works correctly
3. Ensure generated tests compile and pass
4. Check coverage meets minimum threshold
5. Validate error fixing produces correct fixes

## Maintenance

- Review prompts quarterly for best practices updates
- Keep framework-specific syntax current with latest versions
- Update guidelines based on common errors/failures
- Maintain backward compatibility when possible
