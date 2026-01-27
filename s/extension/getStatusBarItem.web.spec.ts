import { getStatusBarItem } from '../../src/extension';
import * as vscode from 'vscode';

jest.mock('vscode', () => ({
    ...jest.requireActual('vscode'),
    window: {
        createStatusBarItem: jest.fn(),
    },
}));

/** @aiContributed-2026-01-26 */
describe('getStatusBarItem', () => {
    let mockStatusBarItem: vscode.StatusBarItem;

    beforeEach(() => {
        mockStatusBarItem = {
            text: '',
            tooltip: '',
            command: '',
            color: '',
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn(),
        } as unknown as vscode.StatusBarItem;

        (vscode.window.createStatusBarItem as jest.Mock).mockReturnValue(mockStatusBarItem);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /** @aiContributed-2026-01-26 */
    it('should return null if statusBarItem is not initialized', () => {
        const result = getStatusBarItem();
        expect(result).toBeNull();
    });

    /* it('should return the initialized statusBarItem', () => {
            const result = getStatusBarItem();
            expect(result).toBe(mockStatusBarItem);
        }); */
});