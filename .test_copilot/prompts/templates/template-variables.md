# Prompt Template Variables Reference

This document defines all reusable template variables used across UT Gen Copilot prompts.

## Variable Categories

### Source Code Context
- `<<<SourceCode>>>` - The source code to be tested
- `<<<SourceFileName>>>` - Name of the source file (without extension)
- `<<<FunctionName>>>` - Name of the target function or component
- `<<<ClassName>>>` - Name of the target class (for class member tests)

### Test File Context
- `<<<SpecFileName>>>` - Name of the test/spec file to be generated
- `<<<TargetFilePath>>>` - Full path to the target test file
- `<<<FilePathList>>>` - List of test files to merge (newline-separated)

### Testing Framework
- `<<<TestFramework>>>` - Testing framework name (Jest, Vitest, Mocha, pytest, etc.)
- `<<<Language>>>` - Programming language (typescript, javascript, python, etc.)

### Mock & Test Data
- `<<<MockCode>>>` - Mock/stub code for dependencies
- `<<<TestErrors>>>` - JSON-formatted test error data from test runner
- `<<<LintErrors>>>` - ESLint/linter error output

### Configuration
- `<<<MinCoverage>>>` - Minimum required code coverage percentage (default: 75)
- `<<<MaxRetries>>>` - Maximum retry attempts for fixing errors (default: 3)

### File System
- `<<<WorkspaceRoot>>>` - Absolute path to workspace root
- `<<<TestDirectory>>>` - Directory containing test files

### Advanced Context
- `<<<DependencyGraph>>>` - JSON representation of module dependencies
- `<<<TypeDefinitions>>>` - TypeScript type definitions for better context
- `<<<DesignSystemRefs>>>` - References to design system components

## Usage Pattern

Template variables should always be enclosed in triple angle brackets:
```
<<<VariableName>>>
```

### Example Usage in Prompt

````markdown
# Generate tests for function `<<<FunctionName>>>` in file `<<<SpecFileName>>>`

## Source Code:
```<<<Language>>>
<<<SourceCode>>>
```

## Mock Dependencies:
<<<MockCode>>>

## Framework: <<<TestFramework>>>
## Required Coverage: <<<MinCoverage>>>%
````

## Framework-Specific Variables

### Jest/Vitest
- `<<<JestConfig>>>` - Jest configuration object
- `<<<SetupFiles>>>` - Setup files to include

### Mocha
- `<<<MochaOpts>>>` - Mocha options
- `<<<ChaiPlugins>>>` - Chai plugins to load

### pytest (Python)
- `<<<PytestFixtures>>>` - Pytest fixtures to use
- `<<<PytestMarkers>>>` - Test markers (e.g., @pytest.mark.slow)

## Validation Rules

1. **Required Variables**: Some variables MUST be present in every prompt:
   - `<<<SourceCode>>>` (for generation prompts)
   - `<<<Language>>>` (for all code-generating prompts)
   - `<<<TestFramework>>>` (for all test prompts)

2. **Optional Variables**: Can be omitted if not applicable:
   - `<<<MockCode>>>` (if no mocking needed)
   - `<<<MinCoverage>>>` (falls back to default)

3. **Variable Substitution Order**: Variables should be substituted in this order:
   1. Configuration variables (TestFramework, Language, MinCoverage)
   2. File context variables (SourceFileName, SpecFileName)
   3. Code content variables (SourceCode, MockCode)
   4. Error data variables (TestErrors, LintErrors)

## Extension Guidelines

When adding new template variables:
1. Use descriptive PascalCase names
2. Enclose in triple angle brackets `<<<>>>`
3. Document in this file with description and usage example
4. Add to appropriate category
5. Update validation rules if the variable is required
