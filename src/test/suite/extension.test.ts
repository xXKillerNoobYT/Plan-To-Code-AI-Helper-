/**
 * Integration Test: Extension Activation
 * Tests that the extension activates correctly in VS Code
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation Test Suite', () => {
    vscode.window.showInformationMessage('Starting extension activation tests');

    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('your-publisher-name.copilot-orchestration-extension');
        assert.ok(extension, 'Extension should be found');
    });

    test('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('your-publisher-name.copilot-orchestration-extension');

        if (extension) {
            await extension.activate();
            assert.strictEqual(extension.isActive, true, 'Extension should be active');
        }
    });

    test('COE: Activate command should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('coe.activate'), 'coe.activate command should be registered');
    });
});
