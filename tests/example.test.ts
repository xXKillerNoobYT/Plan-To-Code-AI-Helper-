/**
 * 🧪 Example Test File (Your First Test!)
 * 
 * This is a simple test to show you how Jest works.
 * 
 * Test Structure:
 * 1. describe() - Groups related tests together (like a folder for tests)
 * 2. it() or test() - Defines a single test case (one thing to check)
 * 3. expect() - Makes an assertion (checks if something is true)
 * 
 * Example:
 *   describe('Math', () => {
 *     it('should add numbers correctly', () => {
 *       expect(2 + 2).toBe(4);  // ✅ PASS
 *       expect(2 + 2).toBe(5);  // ❌ FAIL
 *     });
 *   });
 */

// 🎭 MOCKING EXPLAINED (For Noobs!)
// 
// **What is mocking?** Creating fake versions of things for testing.
// 
// **Why mock?** Sometimes you can't use the real thing in tests:
// - VS Code API only works inside VS Code (not in Jest tests)
// - Database calls are slow and need a real database
// - Network requests need internet and can fail
// 
// **How to mock?** Jest automatically applies mocks from __mocks__/ folders
// VS Code is automatically mocked via __mocks__/vscode.ts

/**
 * 🎯 Test Group: Extension Activation
 * 
 * These tests check if the extension starts up correctly.
 */
describe('COE Extension Activation', () => {
    /**
     * ✅ Test Case 1: Check if activate function exists
     * 
     * What this test does:
     * - Imports the activate function from extension.ts
     * - Checks if it's a real function (not undefined or null)
     * 
     * Why it's important:
     * - If activate doesn't exist, the extension won't start!
     */
    it('should export an activate function', () => {
        // Import the activate function from our extension
        const { activate } = require('../src/extension');

        // Check that activate is a function
        // typeof returns the type of a variable (e.g., 'function', 'string', 'number')
        expect(typeof activate).toBe('function');
    });

    /**
     * ✅ Test Case 2: Check if deactivate function exists
     * 
     * What this test does:
     * - Imports the deactivate function from extension.ts
     * - Checks if it's a real function
     * 
     * Why it's important:
     * - If deactivate doesn't exist, the extension won't shut down properly!
     */
    it('should export a deactivate function', () => {
        const { deactivate } = require('../src/extension');
        expect(typeof deactivate).toBe('function');
    });

    /**
     * ✅ Test Case 3: Check activate function behavior
     * 
     * What this test does:
     * - Creates a fake VS Code context (mocking)
     * - Calls the activate function
     * - Checks if it registers commands correctly
     * 
     * Mocking = Creating fake objects for testing
     * (We can't use the real VS Code in tests, so we fake it!)
     */
    it('should register commands when activated', () => {
        const { activate } = require('../src/extension');

        // 🎭 Create a mock VS Code context
        // This is a fake context object that looks like the real one
        const mockContext = {
            subscriptions: [],  // Empty array to collect registered commands
        };

        // Spy on console.log to check if activation message is logged
        // jest.spyOn() lets us "watch" a function and see if it was called
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        // 🚀 Call the activate function with our mock context
        activate(mockContext as any);

        // ✅ Check if activation message was logged
        // toHaveBeenCalledWith() checks if console.log was called with this exact text
        expect(consoleLogSpy).toHaveBeenCalledWith('🚀 COE Activated');

        // ✅ Check if at least one command was registered
        // The activate function should add commands to context.subscriptions
        expect(mockContext.subscriptions.length).toBeGreaterThan(0);

        // 🧹 Clean up: restore console.log to normal
        consoleLogSpy.mockRestore();
    });
});

/**
 * 🎯 Test Group: Simple Math Example (Learning Test)
 * 
 * This is just to show you how basic tests work!
 * Delete this when you write real tests.
 */
describe('Basic Jest Examples', () => {
    /**
     * ✅ Example: Testing numbers
     */
    it('should pass simple math tests', () => {
        expect(2 + 2).toBe(4);           // ✅ Exact equality
        expect(10 - 5).toBe(5);          // ✅ Works with subtraction too
        expect(3 * 3).toBeGreaterThan(8); // ✅ Comparison operators
    });

    /**
     * ✅ Example: Testing strings
     */
    it('should pass simple string tests', () => {
        const greeting = 'Hello, COE!';
        expect(greeting).toContain('COE');   // ✅ Check if string contains text
        expect(greeting.length).toBe(11);    // ✅ Check string length
    });

    /**
     * ✅ Example: Testing arrays
     */
    it('should pass simple array tests', () => {
        const tasks = ['Plan', 'Code', 'Test'];
        expect(tasks).toHaveLength(3);           // ✅ Check array length
        expect(tasks).toContain('Code');         // ✅ Check if array includes item
        expect(tasks[0]).toBe('Plan');           // ✅ Check specific index
    });

    /**
     * ✅ Example: Testing objects
     */
    it('should pass simple object tests', () => {
        const task = {
            id: '123',
            title: 'Write tests',
            status: 'done',
        };

        expect(task.status).toBe('done');         // ✅ Check property value
        expect(task).toHaveProperty('title');     // ✅ Check if property exists
        expect(task.title).toContain('tests');   // ✅ Check property contains text
    });
});

/**
 * 🎓 Jest Cheat Sheet (Common Matchers)
 * 
 * Matchers are the words after expect() that check things:
 * 
 * EQUALITY:
 * - expect(x).toBe(y)                → x === y (exact match)
 * - expect(x).toEqual(y)             → x == y (deep equality for objects/arrays)
 * - expect(x).not.toBe(y)            → x !== y (not equal)
 * 
 * TRUTHINESS:
 * - expect(x).toBeTruthy()           → x is truthy (true, 1, 'text', etc.)
 * - expect(x).toBeFalsy()            → x is falsy (false, 0, '', null, undefined)
 * - expect(x).toBeNull()             → x is null
 * - expect(x).toBeUndefined()        → x is undefined
 * 
 * NUMBERS:
 * - expect(x).toBeGreaterThan(5)     → x > 5
 * - expect(x).toBeLessThan(10)       → x < 10
 * - expect(x).toBeCloseTo(3.14, 2)   → x ≈ 3.14 (within 2 decimal places)
 * 
 * STRINGS:
 * - expect(str).toContain('text')    → str includes 'text'
 * - expect(str).toMatch(/regex/)     → str matches regex pattern
 * 
 * ARRAYS:
 * - expect(arr).toHaveLength(3)      → arr.length === 3
 * - expect(arr).toContain(item)      → arr includes item
 * 
 * OBJECTS:
 * - expect(obj).toHaveProperty('key') → obj.key exists
 * - expect(obj).toMatchObject({})    → obj contains these properties
 * 
 * FUNCTIONS:
 * - expect(fn).toHaveBeenCalled()    → function was called (requires spy)
 * - expect(fn).toThrow()             → function throws an error
 * 
 * 📚 More matchers: https://jestjs.io/docs/expect
 */
