# Quick Start Guide

Get started with the Unified Coding Agent in 5 minutes!

## Installation

```bash
# Clone the repository
git clone https://github.com/xXKillerNoobYT/Plan-To-Code-AI-Helper-.git
cd Plan-To-Code-AI-Helper-

# No dependencies needed - pure Python!
```

## Basic Usage

### 1. Simple Example

Create a file `my_project.py`:

```python
from unified_agent import Overseer

# Define what you want to build
requirements = """
Create a simple todo list application:
- Add tasks
- Mark tasks complete
- List all tasks
- Delete tasks
"""

# Create the agent
agent = Overseer(
    project_name="TodoApp",
    requirements=requirements
)

# Let the agent do its work!
results = agent.execute_workflow()

# See the plan
print(results["outputs"]["planner"])

# See the code
for filename, code in agent.context.code_files.items():
    print(f"\n=== {filename} ===")
    print(code)

# Get the final report
print(agent.generate_report())
```

Run it:
```bash
python3 my_project.py
```

### 2. Run the Demo

```bash
# See the full workflow in action
python3 unified_agent.py

# See multiple examples
python3 example_usage.py
```

## Understanding the Output

The agent produces output from each of its 5 roles:

1. **Planner** - Analysis and action plan
2. **Architect** - System design and structure
3. **Coder** - Implementation code
4. **Reviewer** - Quality assessment
5. **Executor** - Validation results

Plus a final comprehensive report!

## Common Use Cases

### Building a Web API

```python
requirements = """
Create a REST API for book management:
- GET /books - list all books
- POST /books - add new book
- PUT /books/:id - update book
- DELETE /books/:id - remove book
- JSON responses
- Error handling
"""

agent = Overseer("BookAPI", requirements)
results = agent.execute_workflow()
```

### Creating a CLI Tool

```python
requirements = """
Build a command-line file converter:
- Convert between JSON and CSV
- Input/output file arguments
- Validation and error messages
- Progress indication
"""

agent = Overseer("FileConverter", requirements)
results = agent.execute_workflow()
```

### Data Processing Script

```python
requirements = """
Develop a data cleaning script:
- Read CSV files
- Remove duplicates
- Handle missing values
- Export cleaned data
- Logging
"""

agent = Overseer("DataCleaner", requirements)
results = agent.execute_workflow()
```

## Handling Vague Requirements

If your requirements are unclear, the agent will ask questions:

```python
requirements = """
Create a web application:
- Maybe add user authentication (TBD)
- Process some data files
- Could include a dashboard
"""

agent = Overseer("WebApp", requirements)
results = agent.execute_workflow()

# Check for clarifying questions
questions = agent.get_clarifying_questions()
for q in questions:
    print(f"❓ {q}")

# Output:
# ❓ Please confirm: Maybe add user authentication (TBD) - Is this required or optional?
# ❓ Please clarify: Process some data files
# ❓ Please confirm: Could include a dashboard - Is this required or optional?
```

**Pro Tip**: Be specific in requirements to get better results!

## Accessing Generated Code

```python
agent = Overseer("MyApp", requirements)
results = agent.execute_workflow()

# Get all generated files
files = agent.context.code_files

# Access specific file
main_code = files.get("main.py", "")
print(main_code)

# Save to disk
for filename, code in files.items():
    with open(filename, 'w') as f:
        f.write(code)
```

## Monitoring Progress

```python
agent = Overseer("MyApp", requirements)

# Setup workflow
agent.setup_workflow()

# Check initial status
status = agent.zen_tasks.get_workflow_status()
print(f"Total tasks: {status['total']}")

# Execute
results = agent.execute_workflow()

# Check completion
status = agent.zen_tasks.get_workflow_status()
print(f"Completed: {status['completed']}/{status['total']}")
print(f"Progress: {status['progress_percentage']:.1f}%")
```

## Advanced: Manual Role Control

```python
from unified_agent import Overseer, RoleType

agent = Overseer("MyApp", requirements)

# Execute just the planner
planner = agent.switch_role(RoleType.PLANNER)
plan = planner.execute(agent.context, task)

# Execute just the architect
architect = agent.switch_role(RoleType.ARCHITECT)
design = architect.execute(agent.context, task)

# Access context at any point
print(agent.context.plan)
print(agent.context.architecture)
```

## Tips for Best Results

### ✅ DO:
- Be specific about requirements
- Mention technologies if preferred
- Include error handling needs
- Specify input/output formats
- List key features explicitly

### ❌ DON'T:
- Use vague terms (maybe, possibly, etc.)
- Leave details as "TBD"
- Use approximate numbers
- Assume implicit requirements
- Skip important details

### Example: Good vs Bad Requirements

**❌ Bad:**
```
Create a web app that does some processing.
Maybe add authentication.
Should handle various file types (TBD).
```

**✅ Good:**
```
Create a web application with:
- User authentication via JWT
- File upload for CSV and JSON files
- Data processing: remove duplicates, validate fields
- Export results as CSV
- Error handling and logging
```

## Troubleshooting

### Issue: Too many clarifying questions
**Solution**: Make requirements more specific

### Issue: Generated code doesn't match needs
**Solution**: Provide more detailed requirements with examples

### Issue: Missing features in output
**Solution**: Explicitly list all required features

## Next Steps

1. **Read the full README**: `README.md`
2. **Understand the design**: `DESIGN.md`
3. **Try the examples**: `example_usage.py`
4. **Build your own project**: Use the templates above

## Getting Help

- Check `DESIGN.md` for architecture details
- Review `example_usage.py` for more examples
- Examine `unified_agent.py` for implementation details

## What's Next?

Now that you're familiar with the basics:

1. Try building a real project with clear requirements
2. Experiment with different project types
3. Customize roles for your specific needs
4. Integrate into your development workflow

Happy coding! 🚀
