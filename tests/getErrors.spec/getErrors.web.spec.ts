import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getErrors } from '../../src/mcpServer/tools/getErrors';

interface TestWorkspace {
    root: string;
    diagnosticsDir: string;
    diagnosticsFile: string;
}

interface InvalidParams {
    invalid: boolean;
}

/** @aiContributed-2026-01-29 */
describe('getErrors', () => {
    let originalCwd: string;
    let workspace: TestWorkspace;

    beforeEach(() => {
        originalCwd = process.cwd();
        const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'coe-get-errors-'));
        const diagnosticsDir = path.join(tempRoot, '.vscode');
        const diagnosticsFile = path.join(diagnosticsDir, 'quality-diagnostics.json');

        fs.mkdirSync(diagnosticsDir, { recursive: true });
        process.chdir(tempRoot);

        workspace = {
            root: tempRoot,
            diagnosticsDir,
            diagnosticsFile,
        };
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (fs.existsSync(workspace.root)) {
            fs.rmSync(workspace.root, { recursive: true, force: true });
        }
    });

    /** @aiContributed-2026-01-29 */
    it('throws MCPProtocolError for invalid parameters', async () => {
        const invalidParams: InvalidParams = { invalid: true };
        await expect(getErrors(invalidParams)).rejects.toThrowErrorMatchingSnapshot();
    });

    /** @aiContributed-2026-01-29 */
    it('returns empty arrays when diagnostics file is missing', async () => {
        if (fs.existsSync(workspace.diagnosticsFile)) {
            fs.unlinkSync(workspace.diagnosticsFile);
        }

        const response = await getErrors({});

        expect(response.success).toBe(true);
        expect(response.source).toBe('none');
        expect(response.timestamp).toBeNull();
        expect(response.typeScriptErrors).toEqual([]);
        expect(response.skippedTests).toEqual([]);
        expect(response.underCoverageFiles).toEqual([]);
    });

    /** @aiContributed-2026-01-29 */
    it('returns diagnostics from quality-diagnostics.json', async () => {
        const payload = {
            typeScriptErrors: [
                {
                    file: 'src/example.ts',
                    line: 12,
                    column: 5,
                    code: 'TS1234',
                    message: 'Example error message',
                },
            ],
            skippedTests: [
                {
                    file: 'tests/example.test.ts',
                    line: 3,
                    pattern: '.skip',
                    match: 'it.skip("example")',
                },
            ],
            underCoverageFiles: [
                {
                    file: 'src/low-coverage.ts',
                    coverage: 62.5,
                },
            ],
            timestamp: '2026-01-29T00:00:00.000Z',
        };

        fs.writeFileSync(workspace.diagnosticsFile, JSON.stringify(payload, null, 2));

        const response = await getErrors({});

        expect(response.success).toBe(true);
        expect(response.source).toBe('quality-diagnostics');
        expect(response.timestamp).toBe(payload.timestamp);
        expect(response.typeScriptErrors).toEqual(payload.typeScriptErrors);
        expect(response.skippedTests).toEqual(payload.skippedTests);
        expect(response.underCoverageFiles).toEqual(payload.underCoverageFiles);
    });

    /** @aiContributed-2026-01-29 */
    it('returns empty arrays when diagnostics JSON is invalid', async () => {
        fs.writeFileSync(workspace.diagnosticsFile, '{ invalid json');

        const response = await getErrors({});

        expect(response.success).toBe(true);
        expect(response.source).toBe('invalid');
        expect(response.timestamp).toBeNull();
        expect(response.typeScriptErrors).toEqual([]);
        expect(response.skippedTests).toEqual([]);
        expect(response.underCoverageFiles).toEqual([]);
    });

    /** @aiContributed-2026-01-29 */
    it('handles diagnostics JSON with missing optional fields', async () => {
        const payload = {
            timestamp: '2026-01-29T00:00:00.000Z',
        };

        fs.writeFileSync(workspace.diagnosticsFile, JSON.stringify(payload, null, 2));

        const response = await getErrors({});

        expect(response.success).toBe(true);
        expect(response.source).toBe('quality-diagnostics');
        expect(response.timestamp).toBe(payload.timestamp);
        expect(response.typeScriptErrors).toEqual([]);
        expect(response.skippedTests).toEqual([]);
        expect(response.underCoverageFiles).toEqual([]);
    });
});